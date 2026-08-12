const Otp = require("../../model/otp");
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
} = require("../../validation/authValidation");
const bcrypt = require("bcrypt");
const {
  categoryValidation,
  productValidation,
} = require("../../validation/productValidation");
const slugify = require("slugify");
const Category = require("../../model/category");
const Product = require("../../model/products");
const mongoose = require("mongoose");
const csv = require("csvtojson");
const { Parser } = require("json2csv");
const generateProductTemplate = require("../../utils/csvTemplate");
const { csvCleaner, imageCleaner } = require("../../utils/fileCleaner");
const ImageLibrary = require("../../model/imageLibrary");
const cloudinary = require("../../config/cloudinary");
const Order = require("../../model/order");

class sellerPageController {
  // Register Page
  async registerPage(req, res) {
    return res.render("seller/register", {
      error: req.flash("error"),
      success: req.flash("success"),
    });
  }

  // Seller Register
  async register(req, res) {
    try {
      const { error, value } = registerValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);
        return res.redirect("/poeme-perfumery/seller/register");
      }

      const { name, phone, email, password } = value;

      // Check existing seller
      const existingSeller = await User.findOne({ email });

      if (existingSeller) {
        if (existingSeller.isVerified) {
          req.flash("error", "Account already exists. Please login.");
          return res.redirect("/poeme-perfumery/seller/login");
        }

        await Otp.deleteMany({
          userID: existingSeller._id,
        });

        await otpEmail(existingSeller);

        req.session.email = existingSeller.email;

        req.flash(
          "success",
          "Your account already exists but is not verified. A new OTP has been sent."
        );

        return req.session.save((err) => {
          if (err) {
            console.error(err);
            req.flash("error", "Session error");
            return res.redirect("/poeme-perfumery/seller/register");
          }

          return res.redirect("/poeme-perfumery/seller/verify");
        });
      }
      console.log("All Roles:", await Role.find());

      let roleData = await Role.findOne({
        role: "seller",
      });

      if (!roleData) {
        roleData = await Role.create({
          role: "seller",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const seller = new User({
        name,
        phone,
        email,
        password: hashedPassword,
        role: roleData._id,
      });

      await seller.save();

      await otpEmail(seller);

      req.session.email = seller.email;

      req.flash(
        "success",
        "Registration successful. Please verify your email."
      );

      return req.session.save((err) => {
        if (err) {
          console.error(err);
          req.flash("error", "Session error");
          return res.redirect("/poeme-perfumery/seller/register");
        }

        return res.redirect("/poeme-perfumery/seller/verify");
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  /*======================================================*/

  // Verify Page
  async verifyPage(req, res) {
    return res.render("seller/verify", {
      error: req.flash("error"),
      success: req.flash("success"),
    });
  }

  // Verify User
  async verify(req, res) {
    try {
      const { otp } = req.body;

      if (!otp) {
        req.flash("error", "OTP is required");
        return res.redirect("/poeme-perfumery/seller/verify");
      }

      // Get email from session
      const email = req.session.email;

      if (!email) {
        req.flash("error", "Session expired. Please register again.");
        return res.redirect("/poeme-perfumery/seller/register");
      }

      const seller = await User.findOne({ email });

      if (!seller) {
        req.flash("error", "User not found");
        return res.redirect("/poeme-perfumery/seller/register");
      }

      if (seller.isVerified) {
        req.flash("error", "Account already verified");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      const otpData = await Otp.findOne({ userID: seller._id });

      if (!otpData) {
        req.flash("error", "OTP expired");
        return res.redirect("/poeme-perfumery/seller/register");
      }

      if (otpData.otp !== otp) {
        req.flash("error", "Invalid OTP");
        return res.redirect("/poeme-perfumery/seller/verify");
      }

      seller.isVerified = true;
      await seller.save();

      await Otp.deleteOne({ _id: otpData._id });

      delete req.session.email;

      req.flash("success", "Account verified successfully");
      return res.redirect("/poeme-perfumery/seller/login");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  /*======================================================*/

  // Login Page
  async loginPage(req, res) {
    const showOtp = req.session.showOtp || false;

    return res.render("seller/login", {
      error: req.flash("error"),
      success: req.flash("success"),
      email: req.session.email || "",
      showOtp,
    });
  }

  // Seller Login
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

      const seller = await User.findOne({ email });
      if (!seller) {
        req.flash("error", "Invalid email id");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      if (!seller.isVerified) {
        req.flash("error", "Please verify your email first");
        return res.redirect("/poeme-perfumery/seller/verify");
      }

      const isMatch = await bcrypt.compare(password, seller.password);

      if (!isMatch) {
        req.flash("error", "Invalid Password");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      const sellerAccessToken = generateAccessToken(seller);
      const sellerRefreshToken = generateRefreshToken(seller);

      seller.refreshToken = sellerRefreshToken;
      await seller.save();

      const rememberMe = remember === "on";

      const accessMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 30 * 60 * 1000;

      const refreshMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

      res.cookie("sellerAccessToken", sellerAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: accessMaxAge,
      });

      res.cookie("sellerRefreshToken", sellerRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: refreshMaxAge,
      });

      return res.redirect("/poeme-perfumery/seller/dashboard");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Verify Login
  async verifyLogin(req, res) {
    try {
      const { otp } = req.body;

      if (!otp) {
        req.session.showOtp = true;

        req.flash("error", "OTP is required");

        return res.redirect("/poeme-perfumery/seller/login");
      }

      const seller = await User.findOne({
        email: req.session.email,
      });

      if (!seller) {
        delete req.session.showOtp;
        delete req.session.email;

        req.flash("error", "Seller not found");

        return res.redirect("/poeme-perfumery/seller/login");
      }

      const otpData = await Otp.findOne({
        userID: seller._id,
      });

      if (!otpData) {
        req.session.showOtp = true;

        req.flash("error", "OTP expired");

        return res.redirect("/poeme-perfumery/seller/login");
      }

      if (otpData.otp !== otp) {
        req.session.showOtp = true;

        req.flash("error", "Invalid OTP");

        return res.redirect("/poeme-perfumery/seller/login");
      }

      await Otp.deleteOne({
        _id: otpData._id,
      });

      const sellerAccessToken = generateAccessToken(seller);
      const sellerRefreshToken = generateRefreshToken(seller);

      seller.refreshToken = sellerRefreshToken;

      await seller.save();

      res.cookie("sellerAccessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 60 * 1000,
      });

      res.cookie("sellerRefreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      delete req.session.showOtp;
      delete req.session.email;

      return res.redirect("/poeme-perfumery/seller/dashboard");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Send Login OTP
  async loginWithOtp(req, res) {
    try {
      const { email } = req.body;

      const seller = await User.findOne({ email });

      if (!seller) {
        req.flash("error", "Invalid email id");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      if (!seller.isVerified) {
        req.flash("error", "Please verify your account first");
        return res.redirect("/poeme-perfumery/seller/verify");
      }

      await Otp.deleteMany({
        userID: seller._id,
      });

      await otpEmail(seller);

      req.session.email = email;
      req.session.showOtp = true;

      return req.session.save((err) => {
        if (err) {
          console.error(err);
          req.flash("error", "Something went wrong");
          return res.redirect("/poeme-perfumery/seller/login");
        }

        return res.redirect("/poeme-perfumery/seller/login");
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
          refreshToken: "",
        });
      }

      res.clearCookie("sellerAccessToken");
      res.clearCookie("sellerRefreshToken");

      return res.redirect("/poeme-perfumery/seller/login");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  /*======================================================*/
  /*======================================================*/

  // Seller Dashboard
  async dashboard(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user.id);

      // Get seller
      const seller = await User.findById(sellerId).lean();

      if (!seller) {
        return res.status(httpCodes.not_found).render("error", {
          success: false,
          message: "Seller not found",
        });
      }

      /*
    ============================================================
    1. TOTAL PRODUCTS
    ============================================================
    */

      const totalProducts = await Product.countDocuments({
        sellerId,
        isActive: true,
      });

      /*
    ============================================================
    2. LOW STOCK PRODUCTS
    ============================================================
    */

      const lowStock = await Product.countDocuments({
        sellerId,
        isActive: true,
        stock: {
          $lte: 5,
        },
      });

      /*
    ============================================================
    3. PRODUCT-WISE ORDER ANALYTICS
    ============================================================

    Only PAID orders are counted.

    We:
    Order
      ↓
    items
      ↓
    Product
      ↓
    sellerId
    */

      const productOrders = await Order.aggregate([
        // Only successful payments
        {
          $match: {
            paymentStatus: "paid",
          },
        },

        // Separate every product inside an order
        {
          $unwind: "$items",
        },

        // Find the actual Product document
        {
          $lookup: {
            from: "products",

            localField: "items.productId",

            foreignField: "_id",

            as: "product",
          },
        },

        // Convert product array into object
        {
          $unwind: "$product",
        },

        // Only products belonging to current seller
        {
          $match: {
            "product.sellerId": sellerId,
            "product.isActive": true,
          },
        },

        // Group by product
        {
          $group: {
            _id: "$items.productId",

            productName: {
              $first: "$items.productName",
            },

            orders: {
              $sum: 1,
            },

            quantitySold: {
              $sum: "$items.quantity",
            },

            revenue: {
              $sum: "$items.totalPrice",
            },
          },
        },

        // Highest order count first
        {
          $sort: {
            orders: -1,
          },
        },

        // Clean response
        {
          $project: {
            _id: 0,

            productId: "$_id",

            productName: 1,

            orders: 1,

            quantitySold: 1,

            revenue: 1,
          },
        },
      ]);

      /*
    ============================================================
    4. TOTAL SELLER ORDERS
    ============================================================

    Important:
    We count unique orders, not individual products.
    */

      const sellerOrders = await Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
          },
        },

        {
          $unwind: "$items",
        },

        {
          $lookup: {
            from: "products",

            localField: "items.productId",

            foreignField: "_id",

            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $match: {
            "product.sellerId": sellerId,
          },
        },

        // One record per order
        {
          $group: {
            _id: "$_id",

            userId: {
              $first: "$userId",
            },

            total: {
              $sum: "$items.totalPrice",
            },
          },
        },
      ]);

      const totalOrders = sellerOrders.length;

      /*
    ============================================================
    5. TOTAL REVENUE
    ============================================================
    */

      const revenue = sellerOrders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );

      /*
    ============================================================
    6. UNIQUE CUSTOMERS
    ============================================================
    */

      const customerIds = new Set();

      sellerOrders.forEach((order) => {
        if (order.userId) {
          customerIds.add(order.userId.toString());
        }
      });

      const customers = customerIds.size;

      /*
    ============================================================
    7. PENDING ORDERS
    ============================================================

    pending
    confirmed
    processing

    are considered active/pending seller orders.
    */

      const pendingSellerOrders = await Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",

            orderStatus: {
              $in: ["pending", "confirmed", "processing"],
            },
          },
        },

        {
          $unwind: "$items",
        },

        {
          $lookup: {
            from: "products",

            localField: "items.productId",

            foreignField: "_id",

            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $match: {
            "product.sellerId": sellerId,
          },
        },

        {
          $group: {
            _id: "$_id",
          },
        },
      ]);

      const pendingOrders = pendingSellerOrders.length;

      /*
    ============================================================
    8. FINAL STATS OBJECT
    ============================================================
    */

      const stats = {
        totalProducts,

        totalOrders,

        revenue,

        customers,

        pendingOrders,

        lowStock,

        productOrders,
      };

      /*
    ============================================================
    9. RENDER DASHBOARD
    ============================================================
    */

      return res.render("seller/dashboard", {
        seller,

        stats,

        currentPage: "dashboard",
      });
    } catch (error) {
      console.error("SELLER DASHBOARD ERROR:", error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,

        message: error.message,
      });
    }
  }

  /*======================================================*/

  // Seller Chat Support
  async chatSupport(req, res) {
    try {
      const seller = await User.findById(req.user.id);

      return res.render("seller/chat", {
        seller,
        currentPage: "chat",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Categories Page
  async categories(req, res) {
    try {
      const seller = await User.findById(req.user.id);

      const categories = await Category.find({
        sellerId: req.user.id,
      }).sort({ createdAt: -1 });

      res.render("seller/categories", {
        seller,
        categories,
        success: req.flash("success"),
        error: req.flash("error"),
        currentPage: "categories",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Create Category Page
  async createCategoryPage(req, res) {
    try {
      const seller = await User.findById(req.user.id);

      return res.render("seller/createCategory", {
        seller,
        error: req.flash("error"),
        success: req.flash("success"),
        currentPage: "categories",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Create Category
  async createCategory(req, res) {
    try {
      const { error, value } = categoryValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);
        return res.redirect("/poeme-perfumery/seller/create/category");
      }

      const { categoryName } = value;

      const sellerId = req.user.id;

      const slug = slugify(categoryName, {
        lower: true,
        strict: true,
      });

      const existingCategory = await Category.findOne({
        sellerId,
        slug,
      });

      if (existingCategory) {
        req.flash("error", "Category is already exist");
        return res.redirect("/poeme-perfumery/seller/create/category");
      }

      const data = new Category({
        sellerId,
        categoryName,
        slug,
      });

      await data.save();

      req.flash("success", "Category created successfully");
      return res.redirect("/poeme-perfumery/seller/categories");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  /*======================================================*/

  // Product Page
  async products(req, res) {
    try {
      const seller = await User.findById(req.user.id);

      const products = await Product.aggregate([
        {
          $match: {
            sellerId: new mongoose.Types.ObjectId(req.user.id),
            isActive: true,
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
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      res.render("seller/product", {
        seller,
        products,
        success: req.flash("success"),
        error: req.flash("error"),
        currentPage: "product",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Create Product Page
  async createProductPage(req, res) {
    try {
      const seller = await User.findById(req.user.id);

      const categories = await Category.find({
        sellerId: req.user.id,
      }).sort({ categoryName: 1 });

      return res.render("seller/createProduct", {
        seller,
        categories,
        error: req.flash("error"),
        success: req.flash("success"),
        currentPage: "product",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Create Product
  async createProduct(req, res) {
    try {
      const { error, value } = productValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);
        return res.redirect("/poeme-perfumery/seller/create/product");
      }

      const {
        categoryId,
        productName,
        description,
        price,
        stock,
        sku,
        brand,
        tags,
      } = value;

      const sellerId = req.user.id;

      const slug = slugify(productName, {
        lower: true,
        strict: true,
      });

      const existingProduct = await Product.findOne({
        sellerId,
        $or: [{ slug }, { sku }],
      });

      if (existingProduct) {
        await cleanupImages(req.files);
        req.flash("error", "Product is already exist");
        return res.redirect("/poeme-perfumery/seller/create/product");
      }

      const cleanupImages = async (files) => {
        if (Array.isArray(files) && files.length > 0) {
          await Promise.all(files.map(imageCleaner));
        }
      };

      const images = [];

      if (req.files?.length) {
        for (const file of req.files) {
          const image = await ImageLibrary.create({
            sellerId,
            imageCode: `IMG${Date.now()}${Math.floor(Math.random() * 1000)}`,
            originalName: file.originalname,
            url: file.path,
            publicId: file.filename,
            size: file.size,
            format: file.mimetype.split("/")[1],
          });

          images.push({
            imageId: image._id,
            url: image.url,
            publicId: image.publicId,
          });
        }
      }

      const data = new Product({
        sellerId,
        categoryId,
        productName,
        slug,
        description,
        price,
        stock,
        sku,
        brand,
        tags,
        stockStatus: stock > 0 ? "in_stock" : "out_of_stock",
        images,
      });

      await data.save();

      req.flash("success", "Product created successfully");

      return res.redirect("/poeme-perfumery/seller/products");
    } catch (error) {
      await cleanupImages(req.files);
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Increased Stock
  async increaseStock(req, res) {
    try {
      await Product.findOneAndUpdate(
        {
          _id: req.params.id,
          sellerId: req.user.id,
        },
        {
          $inc: { stock: 1 },
        }
      );

      return res.redirect("/poeme-perfumery/seller/products");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Decrease Stock
  async decreaseStock(req, res) {
    try {
      const product = await Product.findOne({
        _id: req.params.id,
        sellerId: req.user.id,
      });

      if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/poeme-perfumery/seller/products");
      }

      if (product.stock > 0) {
        product.stock--;
      }

      if (product.stock === 0) {
        product.status = "out_of_stock";
      }

      await product.save();

      return res.redirect("/poeme-perfumery/seller/products");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Out of stock
  async outOfStock(req, res) {
    try {
      await Product.findOneAndUpdate(
        {
          _id: req.params.id,
          sellerId: req.user.id,
        },
        {
          stock: 0,
          status: "out_of_stock",
        }
      );

      return res.redirect("/poeme-perfumery/seller/products");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Bulk Upload Page
  async bulkUploadPage(req, res) {
    const seller = await User.findById(req.user.id);

    res.render("seller/bulkUpload", {
      seller,
      error: req.flash("error"),
      success: req.flash("success"),
      currentPage: "product",
    });
  }

  // Bulk CSV Upload
  async bulkUpload(req, res) {
    try {
      if (!req.file) {
        req.flash("error", "Please upload a CSV file.");
        return res.redirect("/poeme-perfumery/seller/bulk-upload");
      }

      const products = await csv().fromFile(req.file.path);

      if (!products.length) {
        await csvCleaner(req.file);

        req.flash("error", "CSV file is empty.");
        return res.redirect("/poeme-perfumery/seller/bulk-upload");
      }

      const sellerId = req.user.id;

      let successCount = 0;
      let duplicateCount = 0;
      let categoryFailed = 0;
      let validationFailed = 0;
      let failedCount = 0;

      const uploadedSKUs = new Set();
      const uploadedProducts = new Set();

      const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      for (const item of products) {
        try {
          const productName = (item["Product Name"] || "").trim();
          const categoryName = (item.Category || "").trim();
          const sku = (item.SKU || "").trim().toUpperCase();
          const description = (item.Description || "").trim();
          const brand = (item.Brand || "").trim();

          const price = Number(item.Price);
          const stock = Number(item.Stock);

          // Required fields
          if (
            !productName ||
            !categoryName ||
            !sku ||
            Number.isNaN(price) ||
            Number.isNaN(stock)
          ) {
            validationFailed++;
            failedCount++;
            continue;
          }

          // Duplicate inside uploaded CSV
          if (
            uploadedSKUs.has(sku) ||
            uploadedProducts.has(productName.toLowerCase())
          ) {
            duplicateCount++;
            failedCount++;
            continue;
          }

          uploadedSKUs.add(sku);
          uploadedProducts.add(productName.toLowerCase());

          // Find Category (case-insensitive)
          const category = await Category.findOne({
            sellerId,
            categoryName: {
              $regex: new RegExp(`^${escapeRegex(categoryName)}$`, "i"),
            },
          });

          if (!category) {
            categoryFailed++;
            failedCount++;
            continue;
          }

          // Check existing product
          const existingProduct = await Product.findOne({
            sellerId,
            $or: [
              { sku },
              {
                productName: {
                  $regex: new RegExp(`^${escapeRegex(productName)}$`, "i"),
                },
              },
            ],
          });

          if (existingProduct) {
            duplicateCount++;
            failedCount++;
            continue;
          }

          const slug = slugify(productName, {
            lower: true,
            strict: true,
          });

          let images = [];

          const imageCodes = [
            item.Image1,
            item.Image2,
            item.Image3,
            item.Image4,
            item.Image5,
          ]
            .map((code) => (code || "").trim().toUpperCase())
            .filter(Boolean);

          const uniqueCodes = [...new Set(imageCodes)];

          if (uniqueCodes.length !== imageCodes.length) {
            failedCount++;
            validationFailed++;
            continue;
          }

          if (imageCodes.length > 5) {
            failedCount++;
            validationFailed++;
            continue;
          }

          if (imageCodes.length) {
            const libraryImages = await ImageLibrary.find({
              sellerId,
              imageCode: { $in: uniqueCodes },
              isActive: true,
            });

            if (libraryImages.length !== uniqueCodes.length) {
              failedCount++;
              validationFailed++;
              continue;
            }

            images = imageCodes.map((code) => {
              const image = libraryImages.find((img) => img.imageCode === code);

              return {
                imageId: image._id,
                url: image.url,
                publicId: image.publicId,
              };
            });
          }

          await Product.create({
            sellerId,
            categoryId: category._id,
            productName,
            slug,
            description,
            price,
            stock,
            sku,
            brand,
            tags: item.Tags
              ? item.Tags.split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
              : [],
            images,
            status: "draft",
          });

          successCount++;
        } catch (err) {
          console.error(
            `Bulk Upload Error (${item["Product Name"] || "Unknown Product"}):`,
            err.message
          );

          failedCount++;
        }
      }

      await csvCleaner(req.file);

      req.flash(
        "success",
        `${successCount} product(s) uploaded successfully. ${duplicateCount} duplicate(s) skipped. ${categoryFailed} category not found. ${validationFailed} invalid row(s).`
      );

      return res.redirect("/poeme-perfumery/seller/bulk-upload");
    } catch (error) {
      if (req.file) {
        await csvCleaner(req.file);
      }

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Download Template
  async downloadTemplate(req, res) {
    try {
      const categories = await Category.find({
        sellerId: req.user.id,
      });

      const category = categories.length > 0 ? categories[0].categoryName : "";

      const csv = generateProductTemplate(category);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="product-template.csv"'
      );

      return res.send(csv);
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Upload Image Page
  async uploadImagePage(req, res) {
    try {
      const seller = await User.findById(req.user.id);

      return res.render("seller/uploadImage", {
        seller,
        error: req.flash("error"),
        success: req.flash("success"),
        currentPage: "image-library",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Upload Images
  async uploadImage(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        req.flash("error", "Please select at least one image.");
        return res.redirect("/poeme-perfumery/seller/upload-image");
      }

      const sellerId = req.user.id;

      let uploaded = 0;

      for (const file of req.files) {
        const lastImage = await ImageLibrary.findOne({
          sellerId,
        }).sort({ createdAt: -1 });

        let nextNumber = 1;

        if (lastImage) {
          const match = lastImage.imageCode.match(/\d+/);

          if (match) {
            nextNumber = Number(match[0]) + 1;
          }
        }

        const imageCode = `IMG${String(nextNumber).padStart(4, "0")}`;

        const exists = await ImageLibrary.findOne({
          sellerId,
          imageCode,
        });

        if (exists) {
          req.flash("error", "Image code already exists. Please upload again.");

          return res.redirect("/poeme-perfumery/seller/upload-image");
        }

        await ImageLibrary.create({
          sellerId,
          imageCode,
          originalName: file.originalname,
          url: file.path,
          publicId: file.filename,
          size: file.size,
          format: file.mimetype.split("/")[1],
        });

        uploaded++;
      }

      req.flash("success", `${uploaded} image(s) uploaded successfully.`);

      return res.redirect("/poeme-perfumery/seller/image-library");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Image Library
  async imageLibrary(req, res) {
    try {
      const seller = await User.findById(req.user.id);

      const page = Number(req.query.page) || 1;
      const limit = 12;
      const skip = (page - 1) * limit;

      const search = (req.query.search || "").trim();

      const query = {
        sellerId: req.user.id,
        isActive: true,
      };

      const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      if (search) {
        query.$or = [
          {
            imageCode: {
              $regex: escapeRegex(search),
              $options: "i",
            },
          },
          {
            originalName: {
              $regex: escapeRegex(search),
              $options: "i",
            },
          },
        ];
      }

      const totalImages = await ImageLibrary.countDocuments(query);

      const totalPages = Math.ceil(totalImages / limit);

      const images = await ImageLibrary.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.render("seller/imageLibrary", {
        seller,
        images,
        search,
        currentPage: "image-library",
        success: req.flash("success"),
        error: req.flash("error"),
        totalPages: 1,
        currentPageNumber: 1,

        pagination: {
          currentPage: page,
          totalPages,
          totalImages,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        },
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Delete Image - Hard Delete
  async deleteImage(req, res) {
    try {
      const sellerId = req.user.id;
      const imageId = req.params.id;

      // Find image
      const image = await ImageLibrary.findOne({
        _id: imageId,
        sellerId,
      });

      if (!image) {
        req.flash("error", "Image not found.");
        return res.redirect("/poeme-perfumery/seller/image-library");
      }

      // Check if image is assigned to any product
      const product = await Product.findOne({
        sellerId,
        isActive: true,
        "images.imageId": image._id,
      });

      if (product) {
        req.flash(
          "error",
          "This image is already assigned to a product and cannot be deleted."
        );
        return res.redirect("/poeme-perfumery/seller/image-library");
      }

      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(image.publicId);

      if (result.result !== "ok" && result.result !== "not found") {
        throw new Error("Failed to delete image from Cloudinary.");
      }

      // Hard delete from MongoDB
      await ImageLibrary.findByIdAndDelete(image._id);

      req.flash("success", "Image deleted successfully.");
      return res.redirect("/poeme-perfumery/seller/image-library");
    } catch (error) {
      console.error("Delete Image Error:", error);

      req.flash("error", "Unable to delete image.");
      return res.redirect("/poeme-perfumery/seller/image-library");
    }
  }

  // Edit Product Page
  async editPorductPage(req, res) {
    try {
      const sellerId = req.user.id;
      const productId = req.params.id;
      const seller = await User.findById(sellerId);
      const product = await Product.findOne({ _id: productId, sellerId });

      if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/poeme-perfumery/seller/products");
      }

      const categories = await Category.find({ sellerId }).sort({
        categoryName: 1,
      });

      return res.render("seller/editProduct", {
        seller,
        product,
        categories,
        error: req.flash("error"),
        success: req.flash("success"),
        currentPage: "product",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Edit Product
  async editProduct(req, res) {
    try {
      const sellerId = req.user.id;
      const productId = req.params.id;

      // Get form data
      const {
        categoryId,
        productName,
        description,
        price,
        stock,
        sku,
        brand,
        tags,
      } = req.body;

      // Check product exists and belongs to logged-in seller
      const product = await Product.findOne({
        _id: productId,
        sellerId,
      });

      if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/poeme-perfumery/seller/products");
      }

      // Check category exists and belongs to logged-in seller
      const category = await Category.findOne({
        _id: categoryId,
        sellerId,
      });

      if (!category) {
        req.flash("error", "Invalid category");

        return res.redirect(
          `/poeme-perfumery/seller/edit/product/${productId}`
        );
      }

      // Generate slug from product name
      const slug = slugify(productName, {
        lower: true,
        strict: true,
      });

      // Check if another product has same slug or SKU
      const existingProduct = await Product.findOne({
        sellerId,

        _id: {
          $ne: productId,
        },

        $or: [{ slug }, { sku }],
      });

      if (existingProduct) {
        req.flash(
          "error",
          "Another product with this name or SKU already exists"
        );

        return res.redirect(
          `/poeme-perfumery/seller/edit/product/${productId}`
        );
      }

      // Convert price and stock to numbers
      const priceNumber = Number(price);
      const stockNumber = Number(stock);

      // Validate price
      if (Number.isNaN(priceNumber) || priceNumber < 0) {
        req.flash("error", "Please enter a valid price");

        return res.redirect(
          `/poeme-perfumery/seller/edit/product/${productId}`
        );
      }

      // Validate stock
      if (Number.isNaN(stockNumber) || stockNumber < 0) {
        req.flash("error", "Please enter a valid stock quantity");

        return res.redirect(
          `/poeme-perfumery/seller/edit/product/${productId}`
        );
      }

      // Format tags
      let formattedTags = [];

      if (typeof tags === "string") {
        formattedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }

      // Product data to update
      const productData = {
        categoryId,
        productName,
        slug,
        description,
        price: priceNumber,
        stock: stockNumber,
        sku,
        brand: brand || "",
        tags: formattedTags,

        stockStatus: stockNumber > 0 ? "in_stock" : "out_of_stock",
      };

      // Update product
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          sellerId,
        },
        {
          $set: productData,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedProduct) {
        req.flash("error", "Unable to update product");

        return res.redirect(
          `/poeme-perfumery/seller/edit/product/${productId}`
        );
      }

      req.flash("success", "Product updated successfully");

      return res.redirect("/poeme-perfumery/seller/products");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // View Product Page
  async viewProductPage(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid product ID");
        return res.redirect("/poeme-perfumery/seller/products");
      }

      const product = await Product.findOne({
        _id: id,
        sellerId,
        isActive: true,
      })
        .populate({
          path: "categoryId",
          select: "categoryName",
        })
        .lean();

      if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/poeme-perfumery/seller/products");
      }

      product.category = product.categoryId;

      const seller = await User.findById(sellerId);

      return res.render("seller/viewProduct", {
        seller,
        product,
        success: req.flash("success"),
        error: req.flash("error"),
        currentPage: "product",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Deleted Products Page
  async deletedProductsPage(req, res) {
    try {
      const sellerId = req.user.id;

      const seller = await User.findById(sellerId);

      const products = await Product.aggregate([
        {
          $match: {
            sellerId: new mongoose.Types.ObjectId(sellerId),
            isActive: false,
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
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ]);

      return res.render("seller/deletedProducts", {
        seller,
        products,
        success: req.flash("success"),
        error: req.flash("error"),
        currentPage: "product",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Delete Product - Soft Delete
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;

      const product = await Product.findOne({
        _id: id,
        sellerId,
      });

      if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/poeme-perfumery/seller/products");
      }

      // Soft delete product
      const deletedProduct = await Product.findOneAndUpdate(
        {
          _id: id,
          sellerId,
        },
        {
          $set: {
            isActive: false,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!deletedProduct) {
        req.flash("error", "Unable to delete product");

        return res.redirect("/poeme-perfumery/seller/products");
      }

      req.flash("success", "Product deleted successfully");

      return res.redirect("/poeme-perfumery/seller/products");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Delete Product - Soft Delete
  async restoreProduct(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;

      const product = await Product.findOne({
        _id: id,
        sellerId,
      });

      if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/poeme-perfumery/seller/products");
      }

      // Soft delete product
      const restoreProduct = await Product.findOneAndUpdate(
        {
          _id: id,
          sellerId,
        },
        {
          $set: {
            isActive: true,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!restoreProduct) {
        req.flash("error", "Unable to delete product");

        return res.redirect("/poeme-perfumery/seller/products");
      }

      req.flash("success", "Product deleted successfully");

      return res.redirect("/poeme-perfumery/seller/products");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // ============================================================
  // ORDERS PAGE
  // ============================================================

  async orders(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user.id);

      const seller = await User.findById(sellerId).lean();

      if (!seller) {
        req.flash("error", "Seller not found");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      const search = (req.query.search || "").trim();
      const status = (req.query.status || "").trim();

      const allowedStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      // ============================================================
      // ORDER MATCH
      // ============================================================

      const orderMatch = {
        paymentStatus: "paid",
      };

      if (allowedStatuses.includes(status)) {
        orderMatch.orderStatus = status;
      }

      // ============================================================
      // ORDERS PIPELINE
      // ============================================================

      const pipeline = [
        {
          $match: orderMatch,
        },

        // Split products inside order
        {
          $unwind: "$items",
        },

        // Find product
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        // Only products belonging to logged-in seller
        {
          $match: {
            "product.sellerId": sellerId,
          },
        },

        // Find customer
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "customer",
          },
        },

        {
          $unwind: {
            path: "$customer",
            preserveNullAndEmptyArrays: true,
          },
        },

        // ==========================================================
        // SEARCH
        // ==========================================================

        ...(search
          ? [
              {
                $match: {
                  $or: [
                    {
                      "customer.name": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                    {
                      "customer.email": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                    {
                      "customer.phone": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                    {
                      "items.productName": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                    {
                      $expr: {
                        $regexMatch: {
                          input: {
                            $toString: "$_id",
                          },
                          regex: search,
                          options: "i",
                        },
                      },
                    },
                  ],
                },
              },
            ]
          : []),

        // ==========================================================
        // GROUP PRODUCTS BACK INTO ORDER
        // ==========================================================

        {
          $group: {
            _id: "$_id",

            userId: {
              $first: "$userId",
            },

            customer: {
              $first: {
                _id: "$customer._id",
                name: "$customer.name",
                email: "$customer.email",
                phone: "$customer.phone",
              },
            },

            // IMPORTANT:
            // Your EJS expects sellerItems
            sellerItems: {
              $push: {
                productId: "$items.productId",
                productName: "$items.productName",
                price: "$items.price",
                quantity: "$items.quantity",
                totalPrice: "$items.totalPrice",
                image: "$items.image",
              },
            },

            // IMPORTANT:
            // Your EJS expects sellerSubtotal
            sellerSubtotal: {
              $sum: "$items.totalPrice",
            },

            total: {
              $first: "$total",
            },

            subtotal: {
              $first: "$subtotal",
            },

            shipping: {
              $first: "$shipping",
            },

            tax: {
              $first: "$tax",
            },

            orderStatus: {
              $first: "$orderStatus",
            },

            paymentStatus: {
              $first: "$paymentStatus",
            },

            paymentMethod: {
              $first: "$paymentMethod",
            },

            shippingAddress: {
              $first: "$shippingAddress",
            },

            razorpayOrderId: {
              $first: "$razorpayOrderId",
            },

            createdAt: {
              $first: "$createdAt",
            },

            updatedAt: {
              $first: "$updatedAt",
            },
          },
        },

        // Latest orders first
        {
          $sort: {
            createdAt: -1,
          },
        },
      ];

      const orders = await Order.aggregate(pipeline);

      // ============================================================
      // ORDER STATISTICS
      // ============================================================

      const statisticsPipeline = [
        {
          $match: {
            paymentStatus: "paid",
          },
        },

        {
          $unwind: "$items",
        },

        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $match: {
            "product.sellerId": sellerId,
          },
        },

        // One entry per order
        {
          $group: {
            _id: "$_id",

            orderStatus: {
              $first: "$orderStatus",
            },

            sellerSubtotal: {
              $sum: "$items.totalPrice",
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            pending: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$orderStatus", "pending"],
                  },
                  1,
                  0,
                ],
              },
            },

            confirmed: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$orderStatus", "confirmed"],
                  },
                  1,
                  0,
                ],
              },
            },

            processing: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$orderStatus", "processing"],
                  },
                  1,
                  0,
                ],
              },
            },

            shipped: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$orderStatus", "shipped"],
                  },
                  1,
                  0,
                ],
              },
            },

            delivered: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$orderStatus", "delivered"],
                  },
                  1,
                  0,
                ],
              },
            },

            cancelled: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$orderStatus", "cancelled"],
                  },
                  1,
                  0,
                ],
              },
            },

            revenue: {
              $sum: "$sellerSubtotal",
            },
          },
        },
      ];

      const statisticsResult = await Order.aggregate(statisticsPipeline);

      const statistics = statisticsResult[0] || {
        total: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        revenue: 0,
      };

      // ============================================================
      // RENDER
      // ============================================================

      return res.render("seller/orders", {
        seller,
        orders,

        search,
        status,

        statistics,

        success: req.flash("success"),
        error: req.flash("error"),

        currentPage: "orders",
      });
    } catch (error) {
      console.error("SELLER ORDERS ERROR:", error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }
  async updateOrderStatus(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user.id);

      const { id } = req.params;
      const { orderStatus } = req.body;

      // --------------------------------------------------------
      // Validate order ID
      // --------------------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid order ID");
        return res.redirect("/poeme-perfumery/seller/orders");
      }

      // --------------------------------------------------------
      // Allowed statuses
      // --------------------------------------------------------

      const allowedStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (!allowedStatuses.includes(orderStatus)) {
        req.flash("error", "Invalid order status");
        return res.redirect("/poeme-perfumery/seller/orders");
      }

      // --------------------------------------------------------
      // Find order containing a product owned by this seller
      //
      // This is important. A seller cannot update an order that
      // does not contain one of their products.
      // --------------------------------------------------------

      const sellerOrder = await Order.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            paymentStatus: "paid",
          },
        },

        {
          $unwind: "$items",
        },

        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $match: {
            "product.sellerId": sellerId,
          },
        },

        {
          $project: {
            _id: 1,
            orderStatus: 1,
          },
        },

        {
          $limit: 1,
        },
      ]);

      if (!sellerOrder.length) {
        req.flash(
          "error",
          "Order not found or this order does not belong to your products."
        );

        return res.redirect("/poeme-perfumery/seller/orders");
      }

      const currentStatus = sellerOrder[0].orderStatus;

      // --------------------------------------------------------
      // Prevent changing a completed/cancelled order
      // --------------------------------------------------------

      if (currentStatus === "delivered" || currentStatus === "cancelled") {
        req.flash(
          "error",
          `This order is already ${currentStatus} and cannot be changed.`
        );

        return res.redirect("/poeme-perfumery/seller/orders");
      }

      // --------------------------------------------------------
      // Valid forward order flow
      // --------------------------------------------------------

      const statusFlow = {
        pending: ["confirmed", "cancelled"],

        confirmed: ["processing", "cancelled"],

        processing: ["shipped", "cancelled"],

        shipped: ["delivered"],

        delivered: [],

        cancelled: [],
      };

      if (!statusFlow[currentStatus]?.includes(orderStatus)) {
        req.flash(
          "error",
          `You cannot change order status from "${currentStatus}" to "${orderStatus}".`
        );

        return res.redirect("/poeme-perfumery/seller/orders");
      }

      // --------------------------------------------------------
      // Update order
      // --------------------------------------------------------

      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id),
          orderStatus: currentStatus,
        },
        {
          $set: {
            orderStatus,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedOrder) {
        req.flash("error", "Order status could not be updated.");

        return res.redirect("/poeme-perfumery/seller/orders");
      }

      req.flash("success", `Order status changed to ${orderStatus}.`);

      return res.redirect("/poeme-perfumery/seller/orders");
    } catch (error) {
      console.error("SELLER UPDATE ORDER STATUS ERROR:", error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new sellerPageController();
