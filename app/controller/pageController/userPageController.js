const Cart = require("../../model/cart");
const Category = require("../../model/category");
const Otp = require("../../model/otp");
const Product = require("../../model/products");
const Role = require("../../model/role");
const User = require("../../model/user");
const httpCodes = require("../../utils/httpCodes");
const { otpEmail } = require("../../utils/sendEmail");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/token");
const {
  registerValidation,
  loginSchema,
  verifySchema,
} = require("../../validation/authValidation");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const getCartCount = async (userId) => {
  if (!userId) return 0;
  return await Cart.countDocuments({ userId });
};

class userPageController {
  // Home Page
  async landingPage(req, res) {
    try {
      const products = await Product.aggregate([
        {
          $match: {
            approvalStatus: "pending",
            isApproved: false,
            isActive: true,
            stock: { $gt: 0 },
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: "$category",
        },

        {
          $project: {
            _id: 1,
            productName: 1,
            slug: 1,
            description: 1,
            price: 1,
            stock: 1,
            brand: 1,
            images: 1,
            category: {
              _id: "$category._id",
              categoryName: "$category.categoryName",
            },
            createdAt: 1,
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $limit: 8,
        },
      ]);

      const cartCount = await getCartCount(req.user ? req.user._id : null);

      return res.render("landingPage", {
        user: req.user || null,
        products,
        cartCount,
      });
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Perfume Page
  async perfumes(req, res) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = 9;
      const skip = (page - 1) * limit;

      const {
        search = "",
        category = "",
        brand = "",
        price = "",
        stock = "",
        sort = "latest",
      } = req.query;

      // Sidebar Categories
      const categories = await Category.find({
        isActive: true,
      }).sort({
        categoryName: 1,
      });

      const matchStage = {
        approvalStatus: "pending",
        isApproved: false,
        isActive: true,
        stock: { $gt: 0 },
      };

      // Search
      if (search) {
        matchStage.productName = {
          $regex: search,
          $options: "i",
        };
      }

      // Category
      if (category) {
        matchStage.categoryId = new mongoose.Types.ObjectId(category);
      }

      // Brand
      if (brand) {
        matchStage.brand = {
          $regex: brand,
          $options: "i",
        };
      }

      // Price
      if (price) {
        matchStage.price = {
          $lte: Number(price),
        };
      }

      // Availability
      if (stock === "instock") {
        matchStage.stock = {
          $gt: 0,
        };
      }

      if (stock === "outofstock") {
        matchStage.stock = 0;
      }

      let sortStage = {
        createdAt: -1,
      };

      switch (sort) {
        case "priceLow":
          sortStage = {
            price: 1,
          };
          break;

        case "priceHigh":
          sortStage = {
            price: -1,
          };
          break;

        case "name":
          sortStage = {
            productName: 1,
          };
          break;

        default:
          sortStage = {
            createdAt: -1,
          };
      }

      const aggregate = [
        {
          $match: matchStage,
        },

        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: "$category",
        },

        {
          $sort: sortStage,
        },
      ];

      const totalProducts = await Product.aggregate([
        ...aggregate,
        {
          $count: "count",
        },
      ]);

      const products = await Product.aggregate([
        ...aggregate,

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },
      ]);

      const total = totalProducts.length > 0 ? totalProducts[0].count : 0;

      const cartCount = await getCartCount(req.user ? req.user._id : null);

      return res.render("perfumes", {
        user: req.user || null,
        products,
        categories,
        filters: {
          search,
          category,
          brand,
          price,
          stock,
          sort,
        },
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        cartCount,
        success: req.flash("success"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Register Page
  async registerpage(req, res) {
    res.render("register", {
      user: req.user || null,
      message: req.flash("error"),
      cartCount: 0,
    });
  }

  // Verify Page
  async verifyPage(req, res) {
    res.render("verify", {
      user: null,
      message: req.flash("error"),
    });
  }

  // Login Page
  async loginPage(req, res) {
    res.render("login", {
      user: req.user || null,
      message: req.flash("error"),
      cartCount: 0,
    });
  }

  // Google Login
  async googleLogin(req, res) {
    try {
      if (!req.user) {
        req.flash("error", "Google Authentication Failed");
        return res.redirect("/poeme-perfumery/login");
      }

      const user = req.user;

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect("/poeme-perfumery/home");
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).render("login", {
        success: false,
        message: error.message,
      });
    }
  }

  // Register User
  async register(req, res) {
    try {
      const { error, value } = registerValidation.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).render("error", {
          success: false,
          message: error.details[0].message,
        });
      }

      const { name, phone, email, password, confirmPassword, terms } = value;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        req.flash("error", "Email already exists");
        return res.redirect("/poeme-perfumery/register");
      }

      const roleData = await Role.findOne({ role: "user" });

      if (!roleData) {
        return res.status(httpCodes.bad_request).render("error", {
          success: false,
          message: "Invalid role",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const data = new User({
        name,
        phone,
        email,
        password: hashedPassword,
        role: roleData._id,
      });

      await data.save();

      await otpEmail(data);

      req.session.email = email;

      return res.redirect("/poeme-perfumery/verify");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Verify User
  async verify(req, res) {
    try {
      const { otp } = req.body;

      if (!otp) {
        req.flash("error", "OTP is required");
        return res.redirect("/poeme-perfumery/verify");
      }

      // Get email from session
      const email = req.session.email;

      if (!email) {
        req.flash("error", "Session expired. Please register again.");
        return res.redirect("/poeme-perfumery/register");
      }

      const user = await User.findOne({ email });

      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/poeme-perfumery/register");
      }

      if (user.isVerified) {
        req.flash("error", "Account already verified");
        return res.redirect("/poeme-perfumery/login");
      }

      const otpData = await Otp.findOne({ userID: user._id });

      if (!otpData) {
        req.flash("error", "OTP expired");
        return res.redirect("/poeme-perfumery/register");
      }

      if (otpData.otp !== otp) {
        req.flash("error", "Invalid OTP");
        return res.redirect("/poeme-perfumery/verify");
      }

      user.isVerified = true;
      await user.save();

      await Otp.deleteOne({ _id: otpData._id });

      delete req.session.email;

      req.flash("success", "Account verified successfully");
      return res.redirect("/poeme-perfumery/login");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Login User
  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).render("error", {
          success: false,
          message: error.details[0].message,
        });
      }

      const { email, password } = value;
      const remember = req.body.remember;

      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "Invalid email id");
        return res.redirect("/poeme-perfumery/login");
      }

      if (!user.isVerified) {
        req.flash("error", "Please verify your email first");
        return res.redirect("/poeme-perfumery/verify");
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        req.flash("error", "Invalid Password");
        return res.redirect("/poeme-perfumery/login");
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      const rememberMe = remember === "on";

      const accessMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 30 * 60 * 1000;

      const refreshMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: accessMaxAge,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: refreshMaxAge,
      });

      return res.redirect("/poeme-perfumery/home");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Logout User
  async logout(req, res) {
    try {
      if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
          refreshToken: "",
        });
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.redirect("/poeme-perfumery/login");
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Add To Cart Page
  async addToCartPage(req, res) {
    try {
      const cartItems = await Cart.aggregate([
        {
          $match: {
            userId: req.user._id,
          },
        },

        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $match: {
            "product.isActive": true,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "product.categoryId",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 1,
            quantity: 1,

            product: {
              _id: "$product._id",
              productName: "$product.productName",
              slug: "$product.slug",
              price: "$product.price",
              stock: "$product.stock",
              images: "$product.images",
              brand: "$product.brand",
            },

            category: {
              _id: "$category._id",
              categoryName: "$category.categoryName",
            },

            totalPrice: {
              $multiply: ["$quantity", "$product.price"],
            },
          },
        },
      ]);

      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      const shipping = subtotal > 0 ? 100 : 0;
      const tax = subtotal * 0.18;
      const total = subtotal + shipping + tax;

      return res.render("cart", {
        user: req.user,
        cartItems,
        subtotal,
        shipping,
        tax,
        total,
        cartCount: cartItems.length,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Add To Cart
  async addToCart(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);

      if (!product || !product.isActive) {
        req.flash("error", "Product not found");
        return res.redirect("/poeme-perfumery/perfumes");
      }

      if (product.stock <= 0) {
        req.flash("error", "Product is out of stock");
        return res.redirect("/poeme-perfumery/perfumes");
      }

      const existingItem = await Cart.findOne({
        userId: req.user._id,
        productId: id,
      });

      if (existingItem) {
        existingItem.quantity += 1;
        await existingItem.save();
      } else {
        await Cart.create({
          userId: req.user._id,
          productId: id,
          quantity: 1,
        });
      }

      req.flash("success", "Product added to cart");
      return res.redirect("/poeme-perfumery/cart");
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Orders
  async orders(req, res) {
    try {
      const orders = [];

      return res.render("order", {
        orders,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // User Settings
  async settings(req, res) {
    try {
      const user = await User.findById(req.user._id);

      const lastOrder = [];
      const address = [];

      return res.render("settings", {
        user,
        address,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Contact Page
  async chatSupport(req, res) {
    try {
      const cartCount = await getCartCount(req.user ? req.user._id : null);

      return res.render("contactUs", {
        user: req.user,
        cartCount,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new userPageController();
