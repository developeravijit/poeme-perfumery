const { default: mongoose } = require("mongoose");
const Cart = require("../model/cart");
const Category = require("../model/category");
const Order = require("../model/order");
const Product = require("../model/products");
const Role = require("../model/role");
const User = require("../model/user");
const httpCodes = require("../utils/httpCodes");
const { otpEmail } = require("../utils/sendEmail");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const {
  registerValidation,
  loginSchema,
} = require("../validation/authValidation");
const bcrypt = require("bcrypt");

class userController {
  // Google Login
  async googleLogin(req, res) {
    try {
      if (!req.user) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message: "Google Authentication Failed",
        });
      }

      const user = req.user;

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      return res.status(httpCodes.success).json({
        success: true,
        message: "Google login successful",

        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
          },

          accessToken,
          refreshToken,

          accessTokenExpiresIn: 30 * 60 * 1000,
          refreshTokenExpiresIn: 7 * 24 * 60 * 60 * 1000,
        },
      });
    } catch (error) {
      console.log("GOOGLE LOGIN API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Register
  async register(req, res) {
    try {
      const { error, value } = registerValidation.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { name, phone, email, password, confirmPassword, terms } = value;

      // Check if email already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Find user role
      const roleData = await Role.findOne({ role: "user" });

      if (!roleData) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid role",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const data = new User({
        name,
        phone,
        email,
        password: hashedPassword,
        role: roleData._id,
      });

      await data.save();

      // Send OTP
      await otpEmail(data);

      return res.status(httpCodes.created).json({
        success: true,
        message: "Registration successful. OTP sent to your email.",
        data: {
          email: data.email,
          userId: data._id,
        },
      });
    } catch (error) {
      console.error("Register API Error:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Verify User
  async verify(req, res) {
    try {
      const { otp, email } = req.body;

      if (!otp) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "OTP is required",
        });
      }

      if (!email) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Email is required",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.isVerified) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Account already verified",
        });
      }

      const otpData = await Otp.findOne({
        userID: user._id,
      });

      if (!otpData) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "OTP expired",
        });
      }

      if (otpData.otp !== otp) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      user.isVerified = true;
      await user.save();

      await Otp.deleteOne({
        _id: otpData._id,
      });

      return res.status(httpCodes.success).json({
        success: true,
        message: "Account verified successfully",
      });
    } catch (error) {
      console.error("Verify API Error:", error);

      return res.status(httpCodes.server_error).json({
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
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { email, password } = value;

      const remember = req.body.remember;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message: "Invalid email id",
        });
      }

      if (!user.isVerified) {
        return res.status(httpCodes.forbidden).json({
          success: false,
          message: "Please verify your email first",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message: "Invalid Password",
        });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      const rememberMe =
        remember === true || remember === "true" || remember === "on";

      const accessMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 30 * 60 * 1000;

      const refreshMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

      return res.status(httpCodes.success).json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
          },
          accessToken,
          refreshToken,
          accessTokenExpiresIn: accessMaxAge,
          refreshTokenExpiresIn: refreshMaxAge,
        },
      });
    } catch (error) {
      console.error("Login API Error:", error);

      return res.status(httpCodes.server_error).json({
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

      return res.status(httpCodes.success).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout API Error:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // View Product
  async viewProductPage(req, res) {
    try {
      const { slug } = req.params;

      if (!slug) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Product not found",
        });
      }

      const products = await Product.aggregate([
        {
          $match: {
            slug: slug,
            isActive: true,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "categoryData",
          },
        },

        {
          $unwind: {
            path: "$categoryData",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 1,
            productName: 1,
            slug: 1,
            description: 1,
            price: 1,
            discountPrice: 1,
            stock: 1,
            quantity: 1,
            brand: 1,
            images: 1,
            image: 1,
            categoryId: 1,
            isActive: 1,
            approvalStatus: 1,
            isApproved: 1,
            createdAt: 1,
            updatedAt: 1,

            category: {
              _id: "$categoryData._id",
              categoryName: "$categoryData.categoryName",
            },
          },
        },
      ]);

      if (!products || products.length === 0) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Product not found",
        });
      }

      const product = products[0];

      return res.status(httpCodes.success).json({
        success: true,
        message: "Product fetched successfully",
        data: {
          product,
        },
      });
    } catch (error) {
      console.log("VIEW PRODUCT API ERROR:", error);

      return res.status(httpCodes.server_error).json({
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
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.stock <= 0) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Product is out of stock",
        });
      }

      const existingItem = await Cart.findOne({
        userId: req.user._id,
        productId: id,
      });

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return res.status(httpCodes.bad_request).json({
            success: false,
            message: "Maximum available stock reached",
          });
        }

        existingItem.quantity += 1;
        await existingItem.save();

        return res.status(httpCodes.success).json({
          success: true,
          message: "Product quantity increased",
          data: {
            cartItem: existingItem,
          },
        });
      }

      const cartItem = await Cart.create({
        userId: req.user._id,
        productId: id,
        quantity: 1,
      });

      return res.status(httpCodes.created).json({
        success: true,
        message: "Product added to cart",
        data: {
          cartItem,
        },
      });
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // View Cart
  async addToCartPage(req, res) {
    try {
      if (!req.user) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message: "Authentication required",
        });
      }

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

      return res.status(httpCodes.success).json({
        success: true,
        message: "Cart fetched successfully",

        data: {
          cartItems,

          summary: {
            itemCount: cartItems.length,
            subtotal,
            shipping,
            tax,
            total,
          },
        },
      });
    } catch (error) {
      console.log("CART API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Increase Cart Item
  async increaseCartQuantity(req, res) {
    try {
      const { id } = req.params;

      const cart = await Cart.findOne({
        userId: req.user._id,
        productId: id,
      });

      if (!cart) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Cart item not found",
        });
      }

      const product = await Product.findById(id);

      if (!product || !product.isActive) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Product not found",
        });
      }

      if (cart.quantity >= product.stock) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Maximum available stock reached",
          data: {
            quantity: cart.quantity,
            availableStock: product.stock,
          },
        });
      }

      cart.quantity += 1;

      await cart.save();

      return res.status(httpCodes.success).json({
        success: true,
        message: "Cart quantity increased",
        data: {
          cartItem: cart,
        },
      });
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Decrease Cart Item
  async decreaseCartQuantity(req, res) {
    try {
      const { id } = req.params;

      const cart = await Cart.findOne({
        userId: req.user._id,
        productId: id,
      });

      if (!cart) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Cart item not found",
        });
      }

      // Remove item if quantity becomes zero
      if (cart.quantity <= 1) {
        await Cart.deleteOne({
          _id: cart._id,
        });

        return res.status(httpCodes.success).json({
          success: true,
          message: "Product removed from cart",
          data: {
            removed: true,
            productId: id,
          },
        });
      }

      cart.quantity -= 1;

      await cart.save();

      return res.status(httpCodes.success).json({
        success: true,
        message: "Cart quantity decreased",
        data: {
          cartItem: cart,
        },
      });
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Remove Cart Item
  async removeCartItem(req, res) {
    try {
      const { id } = req.params;

      const cart = await Cart.findOneAndDelete({
        userId: req.user._id,
        productId: id,
      });

      if (!cart) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Cart item not found",
        });
      }

      return res.status(httpCodes.success).json({
        success: true,
        message: "Product removed from cart",
        data: {
          removed: true,
          productId: id,
        },
      });
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Orders
  async orders(req, res) {
    try {
      if (!req.user) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message: "Authentication required",
        });
      }

      const orders = await Order.find({
        userId: req.user._id,
        paymentStatus: "paid",
      })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(httpCodes.success).json({
        success: true,
        message: "Orders fetched successfully",
        data: {
          orders,
          count: orders.length,
        },
      });
    } catch (error) {
      console.log("ORDERS API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Home Page
  async landingPage(req, res) {
    try {
      const products = await Product.aggregate([
        {
          $match: {
            approvalStatus: "approved",
            isApproved: true,
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

      return res.status(httpCodes.success).json({
        success: true,
        message: "Home page data fetched successfully",
        data: {
          products,
        },
      });
    } catch (error) {
      console.log("LANDING PAGE API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Perfume Page
  async perfumes(req, res) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
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

      const matchStage = {
        approvalStatus: "approved",
        isApproved: true,
        isActive: true,
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
        if (!mongoose.Types.ObjectId.isValid(category)) {
          return res.status(httpCodes.bad_request).json({
            success: false,
            message: "Invalid category ID",
          });
        }

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
        const maxPrice = Number(price);

        if (isNaN(maxPrice) || maxPrice < 0) {
          return res.status(httpCodes.bad_request).json({
            success: false,
            message: "Invalid price",
          });
        }

        matchStage.price = {
          $lte: maxPrice,
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

      // If no stock filter is provided,
      // show only products currently available.
      if (!stock) {
        matchStage.stock = {
          $gt: 0,
        };
      }

      // Sorting
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

        case "latest":
        default:
          sortStage = {
            createdAt: -1,
          };
          break;
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

      // Get total number of products
      const totalProducts = await Product.aggregate([
        ...aggregate,
        {
          $count: "count",
        },
      ]);

      const total = totalProducts.length > 0 ? totalProducts[0].count : 0;

      // Get paginated products
      const products = await Product.aggregate([
        ...aggregate,

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },
      ]);

      // Get active categories
      const categories = await Category.find({
        isActive: true,
      })
        .sort({
          categoryName: 1,
        })
        .lean();

      return res.status(httpCodes.success).json({
        success: true,
        message: "Products fetched successfully",

        data: {
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

          pagination: {
            currentPage: page,
            limit,
            totalProducts: total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPreviousPage: page > 1,
          },
        },
      });
    } catch (error) {
      console.log("PERFUMES API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new userController();
