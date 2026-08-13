const { default: mongoose } = require("mongoose");
const User = require("../model/user");
const {
  registerValidation,
  loginSchema,
} = require("../validation/authValidation");
const { otpEmail } = require("../utils/sendEmail");
const Role = require("../model/role");
const bcrypt = require("bcrypt");
const Otp = require("../model/otp");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const Product = require("../model/products");
const Order = require("../model/order");
const httpCodes = require("../utils/httpCodes");
const {
  categoryValidation,
  productValidation,
} = require("../validation/productValidation");
const Category = require("../model/category");
const { imageCleaner, csvCleaner } = require("../utils/fileCleaner");
const slugify = require("slugify");
const ImageLibrary = require("../model/imageLibrary");
const generateProductTemplate = require("../utils/csvTemplate");
const cloudinary = require("../config/cloudinary");

class sellerController {
  /*======================================================*/
  //                        Authentication
  /*======================================================*/

  // Seller Register
  async register(req, res) {
    try {
      const { error, value } = registerValidation.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { name, phone, email, password } = value;

      // Check existing seller/user
      const existingSeller = await User.findOne({ email });

      if (existingSeller) {
        if (existingSeller.isVerified) {
          return res.status(httpCodes.conflict).json({
            success: false,
            message: "Account already exists. Please login.",
          });
        }

        // Delete old OTP
        await Otp.deleteMany({
          userID: existingSeller._id,
        });

        // Send new OTP
        await otpEmail(existingSeller);

        return res.status(httpCodes.ok).json({
          success: true,
          message:
            "Account already exists but is not verified. A new OTP has been sent.",
          email: existingSeller.email,
        });
      }

      // Find seller role
      let roleData = await Role.findOne({
        role: "seller",
      });

      // Create role if it doesn't exist
      if (!roleData) {
        roleData = await Role.create({
          role: "seller",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create seller
      const seller = new User({
        name,
        phone,
        email,
        password: hashedPassword,
        role: roleData._id,
        isVerified: false,
      });

      await seller.save();

      // Send OTP
      await otpEmail(seller);

      return res.status(httpCodes.created).json({
        success: true,
        message: "Registration successful. Please verify your email.",
        email: seller.email,
      });
    } catch (error) {
      console.error("Seller registration error:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Verify Seller Registration
  async verify(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Email and OTP are required.",
        });
      }

      const seller = await User.findOne({ email });

      if (!seller) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Seller not found.",
        });
      }

      if (seller.isVerified) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Account already verified.",
        });
      }

      const otpData = await Otp.findOne({
        userID: seller._id,
      });

      if (!otpData) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "OTP expired. Please request a new OTP.",
        });
      }

      if (otpData.otp !== otp) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid OTP.",
        });
      }

      seller.isVerified = true;

      await seller.save();

      await Otp.deleteOne({
        _id: otpData._id,
      });

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Account verified successfully. You can now login.",
      });
    } catch (error) {
      console.error("Seller verification error:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Seller Login
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

      const seller = await User.findOne({ email }).populate("role");

      if (!seller) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      // Make sure the account belongs to seller role
      const roleName = seller.role?.role || seller.role;

      if (roleName !== "seller") {
        return res.status(httpCodes.forbidden).json({
          success: false,
          message: "This account is not registered as a seller.",
        });
      }

      if (!seller.isVerified) {
        return res.status(httpCodes.forbidden).json({
          success: false,
          message: "Please verify your email first.",
        });
      }

      const isMatch = await bcrypt.compare(password, seller.password);

      if (!isMatch) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      // Generate tokens
      const sellerAccessToken = generateAccessToken(seller);
      const sellerRefreshToken = generateRefreshToken(seller);

      // Store refresh token
      seller.refreshToken = sellerRefreshToken;

      await seller.save();

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Seller login successful.",
        accessToken: sellerAccessToken,
        refreshToken: sellerRefreshToken,
        user: {
          id: seller._id,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          role: roleName,
        },
      });
    } catch (error) {
      console.error("Seller login error:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Send Seller Login OTP
  async loginWithOtp(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Email is required.",
        });
      }

      const seller = await User.findOne({ email }).populate("role");

      if (!seller) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message: "Invalid email.",
        });
      }

      const roleName = seller.role?.role || seller.role;

      if (roleName !== "seller") {
        return res.status(httpCodes.forbidden).json({
          success: false,
          message: "This account is not registered as a seller.",
        });
      }

      if (!seller.isVerified) {
        return res.status(httpCodes.forbidden).json({
          success: false,
          message: "Please verify your account first.",
        });
      }

      // Remove old OTP
      await Otp.deleteMany({
        userID: seller._id,
      });

      // Generate and send OTP
      await otpEmail(seller);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Login OTP has been sent to your email.",
        email: seller.email,
      });
    } catch (error) {
      console.error("Seller login OTP error:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Verify Seller Login OTP
  async verifyLogin(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Email and OTP are required.",
        });
      }

      const seller = await User.findOne({
        email,
      }).populate("role");

      if (!seller) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Seller not found.",
        });
      }

      const roleName = seller.role?.role || seller.role;

      if (roleName !== "seller") {
        return res.status(httpCodes.forbidden).json({
          success: false,
          message: "This account is not registered as a seller.",
        });
      }

      const otpData = await Otp.findOne({
        userID: seller._id,
      });

      if (!otpData) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "OTP expired. Please request a new OTP.",
        });
      }

      if (otpData.otp !== otp) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid OTP.",
        });
      }

      // OTP is valid
      await Otp.deleteOne({
        _id: otpData._id,
      });

      // Generate tokens
      const sellerAccessToken = generateAccessToken(seller);
      const sellerRefreshToken = generateRefreshToken(seller);

      // Store refresh token
      seller.refreshToken = sellerRefreshToken;

      await seller.save();

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Seller login successful.",
        accessToken: sellerAccessToken,
        refreshToken: sellerRefreshToken,
        user: {
          id: seller._id,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          role: roleName,
        },
      });
    } catch (error) {
      console.error("Seller OTP login error:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Seller Logout
  async logout(req, res) {
    try {
      if (!req.user) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message: "Authentication required.",
        });
      }

      await User.findByIdAndUpdate(req.user._id, {
        refreshToken: "",
      });

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Seller logged out successfully.",
      });
    } catch (error) {
      console.error("Seller logout error:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  /*======================================================*/
  //                        Poeme Perfumery
  /*======================================================*/

  // Seller Dashboard
  async dashboard(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      // Get seller
      const seller = await User.findById(sellerId)
        .select("-password -refreshToken")
        .lean();

      if (!seller) {
        return res.status(httpCodes.not_found).json({
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
    */

      const productOrders = await Order.aggregate([
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
            "product.isActive": true,
          },
        },

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

        {
          $sort: {
            orders: -1,
          },
        },

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
    4. SELLER ORDERS
    ============================================================
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
    8. RESPONSE
    ============================================================
    */

      return res.status(httpCodes.ok).json({
        success: true,

        message: "Seller dashboard data fetched successfully.",

        seller: {
          id: seller._id,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          role: seller.role,
        },

        stats: {
          totalProducts,
          totalOrders,
          revenue,
          customers,
          pendingOrders,
          lowStock,
        },

        productOrders,
      });
    } catch (error) {
      console.error("SELLER DASHBOARD API ERROR:", error);

      return res.status(httpCodes.server_error).json({
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
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { categoryName } = value;

      // Auth middleware provides the authenticated seller
      const sellerId = req.user._id;

      // Generate slug
      const slug = slugify(categoryName, {
        lower: true,
        strict: true,
      });

      // Check if category already exists for this seller
      const existingCategory = await Category.findOne({
        sellerId,
        slug,
      });

      if (existingCategory) {
        return res.status(httpCodes.conflict).json({
          success: false,
          message: "Category already exists.",
        });
      }

      // Create category
      const category = new Category({
        sellerId,
        categoryName,
        slug,
      });

      await category.save();

      return res.status(httpCodes.created).json({
        success: true,
        message: "Category created successfully.",
        category: {
          id: category._id,
          sellerId: category.sellerId,
          categoryName: category.categoryName,
          slug: category.slug,
          createdAt: category.createdAt,
        },
      });
    } catch (error) {
      console.error("CREATE CATEGORY API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Seller Categories
  async categories(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      // Get seller
      const seller = await User.findById(sellerId)
        .select("-password -refreshToken")
        .lean();

      if (!seller) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Seller not found",
        });
      }

      // Get seller categories
      const categories = await Category.find({
        sellerId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Seller categories fetched successfully.",

        seller: {
          id: seller._id,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          role: seller.role,
        },

        categories,
      });
    } catch (error) {
      console.error("SELLER CATEGORIES API ERROR:", error);

      return res.status(httpCodes.server_error).json({
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
        if (Array.isArray(req.files)) {
          await Promise.all(req.files.map(imageCleaner));
        }

        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
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

      const sellerId = req.user._id;

      const slug = slugify(productName, {
        lower: true,
        strict: true,
      });

      // Check duplicate product
      const existingProduct = await Product.findOne({
        sellerId,
        $or: [{ slug }, { sku }],
      });

      if (existingProduct) {
        if (Array.isArray(req.files)) {
          await Promise.all(req.files.map(imageCleaner));
        }

        return res.status(httpCodes.conflict).json({
          success: false,
          message: "Product already exists.",
        });
      }

      // Store uploaded images
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

      const product = new Product({
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

        stockStatus: Number(stock) > 0 ? "in_stock" : "out_of_stock",

        images,
      });

      await product.save();

      return res.status(httpCodes.created).json({
        success: true,
        message: "Product created successfully.",
        product,
      });
    } catch (error) {
      console.error("CREATE PRODUCT API ERROR:", error);

      // Clean Cloudinary images if product creation fails
      if (Array.isArray(req.files)) {
        await Promise.all(req.files.map(imageCleaner));
      }

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Seller Products
  async products(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const seller = await User.findById(sellerId)
        .select("-password -refreshToken")
        .lean();

      if (!seller) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Seller not found.",
        });
      }

      const products = await Product.aggregate([
        {
          $match: {
            sellerId,
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

        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Seller products fetched successfully.",

        seller: {
          id: seller._id,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          role: seller.role,
        },

        products,
      });
    } catch (error) {
      console.error("SELLER PRODUCTS API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Increase Product Stock
  async increaseStock(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findOneAndUpdate(
        {
          _id: id,
          sellerId: req.user._id,
          isActive: true,
        },
        {
          $inc: {
            stock: 1,
          },
        },
        {
          new: true,
        }
      );

      if (!product) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Product not found.",
        });
      }

      // Keep stock status synchronized
      product.stockStatus = product.stock > 0 ? "in_stock" : "out_of_stock";

      await product.save();

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Product stock increased successfully.",

        product: {
          id: product._id,
          productName: product.productName,
          stock: product.stock,
          stockStatus: product.stockStatus,
        },
      });
    } catch (error) {
      console.error("INCREASE STOCK API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Decrease Product Stock
  async decreaseStock(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findOne({
        _id: id,
        sellerId: req.user._id,
        isActive: true,
      });

      if (!product) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Product not found.",
        });
      }

      // Prevent negative stock
      if (product.stock > 0) {
        product.stock -= 1;
      }

      // Update stock status
      product.stockStatus = product.stock > 0 ? "in_stock" : "out_of_stock";

      await product.save();

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Product stock decreased successfully.",

        product: {
          id: product._id,
          productName: product.productName,
          stock: product.stock,
          stockStatus: product.stockStatus,
        },
      });
    } catch (error) {
      console.error("DECREASE STOCK API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Mark Product Out Of Stock
  async outOfStock(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findOneAndUpdate(
        {
          _id: id,
          sellerId: req.user._id,
          isActive: true,
        },
        {
          $set: {
            stock: 0,
            stockStatus: "out_of_stock",
          },
        },
        {
          new: true,
        }
      );

      if (!product) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Product not found.",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Product marked as out of stock.",

        product: {
          id: product._id,
          productName: product.productName,
          stock: product.stock,
          stockStatus: product.stockStatus,
        },
      });
    } catch (error) {
      console.error("OUT OF STOCK API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Bulk CSV Upload
  async bulkUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Please upload a CSV file.",
        });
      }

      const products = await csv().fromFile(req.file.path);

      if (!products.length) {
        await csvCleaner(req.file);

        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "CSV file is empty.",
        });
      }

      const sellerId = req.user._id;

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

          // Find category
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
              {
                sku,
              },
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

          // Image codes
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

          // Duplicate image codes
          if (uniqueCodes.length !== imageCodes.length) {
            failedCount++;
            validationFailed++;
            continue;
          }

          // Maximum 5 images
          if (imageCodes.length > 5) {
            failedCount++;
            validationFailed++;
            continue;
          }

          // Find images from seller's image library
          if (imageCodes.length) {
            const libraryImages = await ImageLibrary.find({
              sellerId,
              imageCode: {
                $in: uniqueCodes,
              },
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

          // Create product
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

      // Remove uploaded CSV
      await csvCleaner(req.file);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Bulk product upload completed.",

        summary: {
          successCount,
          duplicateCount,
          categoryFailed,
          validationFailed,
          failedCount,
          totalRows: products.length,
        },
      });
    } catch (error) {
      console.error("BULK UPLOAD API ERROR:", error);

      if (req.file) {
        await csvCleaner(req.file);
      }

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Download Product Template
  async downloadTemplate(req, res) {
    try {
      const categories = await Category.find({
        sellerId: req.user._id,
      })
        .select("categoryName")
        .lean();

      const category = categories.length > 0 ? categories[0].categoryName : "";

      const csvData = generateProductTemplate(category);

      res.setHeader("Content-Type", "text/csv");

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="product-template.csv"'
      );

      return res.send(csvData);
    } catch (error) {
      console.error("DOWNLOAD TEMPLATE API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Upload Images
  async uploadImage(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Please select at least one image.",
        });
      }

      const sellerId = req.user._id;

      let uploaded = 0;

      const uploadedImages = [];

      for (const file of req.files) {
        const lastImage = await ImageLibrary.findOne({
          sellerId,
        }).sort({
          createdAt: -1,
        });

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
          continue;
        }

        const image = await ImageLibrary.create({
          sellerId,
          imageCode,
          originalName: file.originalname,
          url: file.path,
          publicId: file.filename,
          size: file.size,
          format: file.mimetype.split("/")[1],
        });

        uploaded++;

        uploadedImages.push({
          id: image._id,
          imageCode: image.imageCode,
          originalName: image.originalName,
          url: image.url,
          publicId: image.publicId,
          size: image.size,
          format: image.format,
        });
      }

      return res.status(httpCodes.created).json({
        success: true,
        message: `${uploaded} image(s) uploaded successfully.`,
        uploaded,
        images: uploadedImages,
      });
    } catch (error) {
      console.error("UPLOAD IMAGE API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Seller Image Library
  async imageLibrary(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const page = Math.max(Number(req.query.page) || 1, 1);

      const limit = 12;

      const skip = (page - 1) * limit;

      const search = (req.query.search || "").trim();

      const query = {
        sellerId,
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
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Image library fetched successfully.",

        images,

        pagination: {
          currentPage: page,
          totalPages,
          totalImages,
          limit,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        },
      });
    } catch (error) {
      console.error("IMAGE LIBRARY API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete Image
  async deleteImage(req, res) {
    try {
      const sellerId = req.user._id;
      const imageId = req.params.id;

      // Find seller's image
      const image = await ImageLibrary.findOne({
        _id: imageId,
        sellerId,
      });

      if (!image) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Image not found.",
        });
      }

      // Check whether image is assigned to a product
      const product = await Product.findOne({
        sellerId,
        isActive: true,
        "images.imageId": image._id,
      });

      if (product) {
        return res.status(httpCodes.conflict).json({
          success: false,
          message:
            "This image is already assigned to a product and cannot be deleted.",
        });
      }

      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(image.publicId);

      if (result.result !== "ok" && result.result !== "not found") {
        throw new Error("Failed to delete image from Cloudinary.");
      }

      // Hard delete from MongoDB
      await ImageLibrary.findByIdAndDelete(image._id);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Image deleted successfully.",
        imageId,
      });
    } catch (error) {
      console.error("DELETE IMAGE API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // View Product
  async viewProductPage(req, res) {
    try {
      const { id } = req.params;

      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const productId = new mongoose.Types.ObjectId(id);

      const products = await Product.aggregate([
        {
          $match: {
            _id: productId,
            sellerId,
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

        {
          $project: {
            _id: 1,
            sellerId: 1,
            categoryId: 1,

            productName: 1,
            slug: 1,
            description: 1,

            price: 1,
            stock: 1,
            stockStatus: 1,

            sku: 1,
            brand: 1,
            tags: 1,

            images: 1,

            isActive: 1,

            createdAt: 1,
            updatedAt: 1,

            category: {
              _id: "$category._id",
              categoryName: "$category.categoryName",
            },
          },
        },
      ]);

      if (!products.length) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Product fetched successfully",

        product: products[0],
      });
    } catch (error) {
      console.error("VIEW PRODUCT API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Edit Product
  async editProduct(req, res) {
    try {
      const sellerId = req.user._id;
      const productId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid product ID",
        });
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
      } = req.body;

      // Check product
      const product = await Product.findOne({
        _id: productId,
        sellerId,
      });

      if (!product) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check category
      const category = await Category.findOne({
        _id: categoryId,
        sellerId,
      });

      if (!category) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid category",
        });
      }

      // Validate product name
      if (!productName || !productName.trim()) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Product name is required",
        });
      }

      const slug = slugify(productName, {
        lower: true,
        strict: true,
      });

      // Check duplicate slug / SKU
      const existingProduct = await Product.findOne({
        sellerId,

        _id: {
          $ne: productId,
        },

        $or: [
          {
            slug,
          },
          {
            sku,
          },
        ],
      });

      if (existingProduct) {
        return res.status(httpCodes.conflict).json({
          success: false,
          message: "Another product with this name or SKU already exists",
        });
      }

      // Convert price and stock
      const priceNumber = Number(price);
      const stockNumber = Number(stock);

      if (Number.isNaN(priceNumber) || priceNumber < 0) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Please enter a valid price",
        });
      }

      if (Number.isNaN(stockNumber) || stockNumber < 0) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Please enter a valid stock quantity",
        });
      }

      // Format tags
      let formattedTags = [];

      if (typeof tags === "string") {
        formattedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      } else if (Array.isArray(tags)) {
        formattedTags = tags.map((tag) => String(tag).trim()).filter(Boolean);
      }

      const productData = {
        categoryId,
        productName: productName.trim(),
        slug,
        description: description || "",
        price: priceNumber,
        stock: stockNumber,
        sku,
        brand: brand || "",
        tags: formattedTags,

        stockStatus: stockNumber > 0 ? "in_stock" : "out_of_stock",
      };

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
        return res.status(httpCodes.server_error).json({
          success: false,
          message: "Unable to update product",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Product updated successfully",

        product: updatedProduct,
      });
    } catch (error) {
      console.error("EDIT PRODUCT API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete Product - Soft Delete
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user._id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const product = await Product.findOne({
        _id: id,
        sellerId,
        isActive: true,
      });

      if (!product) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Product not found",
        });
      }

      const deletedProduct = await Product.findOneAndUpdate(
        {
          _id: id,
          sellerId,
          isActive: true,
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
        return res.status(httpCodes.server_error).json({
          success: false,
          message: "Unable to delete product",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Product deleted successfully",
        product: {
          id: deletedProduct._id,
          productName: deletedProduct.productName,
          isActive: deletedProduct.isActive,
        },
      });
    } catch (error) {
      console.error("DELETE PRODUCT API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Deleted Products
  async deletedProductsPage(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const products = await Product.aggregate([
        {
          $match: {
            sellerId,
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

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Deleted products fetched successfully",
        products,
      });
    } catch (error) {
      console.error("DELETED PRODUCTS API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Restore Product - Soft Restore
  async restoreProduct(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user._id;

      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      // Check product belongs to logged-in seller
      const product = await Product.findOne({
        _id: id,
        sellerId,
        isActive: false,
      });

      if (!product) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Deleted product not found",
        });
      }

      // Restore product
      const restoredProduct = await Product.findOneAndUpdate(
        {
          _id: id,
          sellerId,
          isActive: false,
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

      if (!restoredProduct) {
        return res.status(httpCodes.server_error).json({
          success: false,
          message: "Unable to restore product",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Product restored successfully",

        product: {
          id: restoredProduct._id,
          productName: restoredProduct.productName,
          isActive: restoredProduct.isActive,
        },
      });
    } catch (error) {
      console.error("RESTORE PRODUCT API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Seller Orders
  async orders(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user.id);

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
      // SEARCH REGEX
      // ============================================================

      const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
                        $regex: escapeRegex(search),
                        $options: "i",
                      },
                    },

                    {
                      "customer.email": {
                        $regex: escapeRegex(search),
                        $options: "i",
                      },
                    },

                    {
                      "customer.phone": {
                        $regex: escapeRegex(search),
                        $options: "i",
                      },
                    },

                    {
                      "items.productName": {
                        $regex: escapeRegex(search),
                        $options: "i",
                      },
                    },

                    {
                      $expr: {
                        $regexMatch: {
                          input: {
                            $toString: "$_id",
                          },
                          regex: escapeRegex(search),
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

            // Products belonging to this seller
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

            // Seller's portion of this order
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

        // Only this seller's products
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

        // Calculate statistics
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
      // API RESPONSE
      // ============================================================

      return res.status(httpCodes.ok).json({
        success: true,

        message: "Seller orders fetched successfully",

        filters: {
          search,
          status,
        },

        statistics,

        orders,
      });
    } catch (error) {
      console.error("SELLER ORDERS API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update Order Status
  async updateOrderStatus(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user.id);
      const { id } = req.params;
      const { orderStatus } = req.body;

      // --------------------------------------------------------
      // Validate order ID
      // --------------------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid order ID",
        });
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
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid order status",
        });
      }

      const orderId = new mongoose.Types.ObjectId(id);

      // --------------------------------------------------------
      // Find order belonging to this seller
      // --------------------------------------------------------

      const sellerOrder = await Order.aggregate([
        {
          $match: {
            _id: orderId,
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
        return res.status(httpCodes.not_found).json({
          success: false,
          message:
            "Order not found or this order does not belong to your products.",
        });
      }

      const currentStatus = sellerOrder[0].orderStatus;

      // --------------------------------------------------------
      // Prevent changing completed/cancelled orders
      // --------------------------------------------------------

      if (currentStatus === "delivered" || currentStatus === "cancelled") {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: `This order is already ${currentStatus} and cannot be changed.`,
        });
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
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: `You cannot change order status from "${currentStatus}" to "${orderStatus}".`,
        });
      }

      // --------------------------------------------------------
      // Update order
      // --------------------------------------------------------

      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: orderId,

          orderStatus: currentStatus,

          paymentStatus: "paid",

          items: {
            $elemMatch: {
              productId: {
                $in: await Product.find({
                  sellerId,
                }).distinct("_id"),
              },
            },
          },
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
        return res.status(httpCodes.conflict).json({
          success: false,
          message:
            "Order status could not be updated. The order may have changed.",
        });
      }

      // --------------------------------------------------------
      // Success
      // --------------------------------------------------------

      return res.status(httpCodes.ok).json({
        success: true,
        message: `Order status changed to ${orderStatus}.`,
        order: {
          _id: updatedOrder._id,
          orderStatus: updatedOrder.orderStatus,
          paymentStatus: updatedOrder.paymentStatus,
          updatedAt: updatedOrder.updatedAt,
        },
      });
    } catch (error) {
      console.error("SELLER UPDATE ORDER STATUS API ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new sellerController();
