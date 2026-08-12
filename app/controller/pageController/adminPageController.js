const httpCodes = require("../../utils/httpCodes");
const User = require("../../model/user");
const Role = require("../../model/role");
const Product = require("../../model/products");
const Order = require("../../model/order");
const { loginSchema } = require("../../validation/authValidation");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/token");
const { getCookieOptions } = require("../../utils/cookieHelpers");
const Category = require("../../model/category");

class adminPageController {
  // =========================================================
  //  LOGIN & Logout
  // =========================================================

  async loginPage(req, res) {
    try {
      return res.render("admin/login", {
        error: null,
        success: null,
      });
    } catch (error) {
      console.error("Admin login page error:", error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Login
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

      const admin = await User.findOne({ email }).populate("role");
      if (!admin) {
        req.flash("error", "Invalid email id");
        return res.redirect("/poeme-perfumery/admin/login");
      }

      const isMatch = await bcrypt.compare(password, admin.password || "");

      if (!isMatch || admin.role?.role !== "admin") {
        req.flash("error", "Invalid email or password");
        return res.redirect("/poeme-perfumery/admin/login");
      }

      const adminAccessToken = generateAccessToken(admin);
      const adminRefreshToken = generateRefreshToken(admin);

      admin.refreshToken = adminRefreshToken;
      await admin.save();

      const rememberMe = remember === "on";

      const accessMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 30 * 60 * 1000;

      const refreshMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

      res.cookie(
        "adminAccessToken",
        adminAccessToken,
        getCookieOptions(req, { maxAge: accessMaxAge })
      );
      res.cookie(
        "adminRefreshToken",
        adminRefreshToken,
        getCookieOptions(req, { maxAge: refreshMaxAge })
      );

      return res.redirect("/poeme-perfumery/admin/dashboard");
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

      res.clearCookie("adminAccessToken");
      res.clearCookie("adminRefreshToken");

      return res.redirect("/poeme-perfumery/admin/login");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // =========================================================
  // ADMIN DASHBOARD
  // =========================================================

  async dashboard(req, res) {
    try {
      // ==========================================
      // ADMIN
      // ==========================================

      const adminId = req.user?._id;

      if (!adminId) {
        return res.redirect("/poeme-perfumery/admin/login");
      }

      // Get admin using aggregation
      const adminResult = await User.aggregate([
        {
          $match: {
            _id: adminId,
          },
        },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleData",
          },
        },
        {
          $unwind: "$roleData",
        },
        {
          $match: {
            "roleData.role": "admin",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            isActive: 1,
            isVerified: 1,
            role: {
              _id: "$roleData._id",
              role: "$roleData.role",
            },
          },
        },
      ]);

      const admin = adminResult[0];

      if (!admin) {
        return res.status(httpCodes.forbidden).render("error", {
          success: false,
          message: "You are not authorized to access the admin dashboard.",
        });
      }

      // ==========================================
      // ROLE IDS
      // ==========================================

      const roles = await Role.aggregate([
        {
          $match: {
            role: {
              $in: ["user", "seller", "admin"],
            },
          },
        },
        {
          $project: {
            _id: 1,
            role: 1,
          },
        },
      ]);

      let userRoleId = null;
      let sellerRoleId = null;
      let adminRoleId = null;

      for (const role of roles) {
        if (role.role === "user") {
          userRoleId = role._id;
        }

        if (role.role === "seller") {
          sellerRoleId = role._id;
        }

        if (role.role === "admin") {
          adminRoleId = role._id;
        }
      }

      // ==========================================
      // USER STATISTICS
      // ==========================================

      const userStats = await User.aggregate([
        {
          $group: {
            _id: "$role",

            total: {
              $sum: 1,
            },

            active: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$isActive", true],
                  },
                  1,
                  0,
                ],
              },
            },

            verified: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$isVerified", true],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      let totalCustomers = 0;
      let totalSellers = 0;
      let totalAdmins = 0;

      let activeSellers = 0;
      let verifiedSellers = 0;

      for (const item of userStats) {
        if (
          userRoleId &&
          item._id &&
          item._id.toString() === userRoleId.toString()
        ) {
          totalCustomers = item.total;
        }

        if (
          sellerRoleId &&
          item._id &&
          item._id.toString() === sellerRoleId.toString()
        ) {
          totalSellers = item.total;
          activeSellers = item.active;
          verifiedSellers = item.verified;
        }

        if (
          adminRoleId &&
          item._id &&
          item._id.toString() === adminRoleId.toString()
        ) {
          totalAdmins = item.total;
        }
      }

      // ==========================================
      // PENDING SELLERS
      // ==========================================

      let pendingSellers = 0;

      if (sellerRoleId) {
        const result = await User.aggregate([
          {
            $match: {
              role: sellerRoleId,
              isVerified: false,
            },
          },
          {
            $count: "count",
          },
        ]);

        pendingSellers = result[0]?.count || 0;
      }

      // ==========================================
      // PRODUCT STATISTICS
      // ==========================================

      const productStatsResult = await Product.aggregate([
        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            active: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$isActive", true],
                  },
                  1,
                  0,
                ],
              },
            },

            pending: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$approvalStatus", "pending"],
                  },
                  1,
                  0,
                ],
              },
            },

            lowStock: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $gt: ["$stock", 0],
                      },
                      {
                        $lte: ["$stock", 5],
                      },
                      {
                        $eq: ["$isActive", true],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            outOfStock: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: ["$stock", 0],
                      },
                      {
                        $eq: ["$isActive", true],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const productStats = productStatsResult[0] || {};

      const totalProducts = productStats.total || 0;
      const activeProducts = productStats.active || 0;
      const pendingProducts = productStats.pending || 0;
      const lowStockProducts = productStats.lowStock || 0;
      const outOfStockProducts = productStats.outOfStock || 0;

      // ==========================================
      // ORDER STATISTICS
      // ==========================================

      const orderStatsResult = await Order.aggregate([
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
                    $in: [
                      "$orderStatus",
                      ["pending", "confirmed", "processing"],
                    ],
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

            paid: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$paymentStatus", "paid"],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const orderStats = orderStatsResult[0] || {};

      const totalOrders = orderStats.total || 0;
      const pendingOrders = orderStats.pending || 0;
      const deliveredOrders = orderStats.delivered || 0;
      const cancelledOrders = orderStats.cancelled || 0;
      const paidOrders = orderStats.paid || 0;

      // ==========================================
      // REVENUE
      // ==========================================

      const revenueResult = await Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            orderStatus: {
              $ne: "cancelled",
            },
          },
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: "$total",
            },
          },
        },
      ]);

      const totalRevenue = revenueResult[0]?.revenue || 0;

      // ==========================================
      // RECENT ORDERS
      // ==========================================

      const recentOrders = await Order.aggregate([
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $limit: 8,
        },

        // Customer
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "customerData",
          },
        },

        {
          $unwind: {
            path: "$customerData",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Products
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productData",
          },
        },

        // Seller IDs
        {
          $set: {
            sellerIds: {
              $setUnion: [
                {
                  $ifNull: ["$productData.sellerId", []],
                },
                [],
              ],
            },
          },
        },

        // Sellers
        {
          $lookup: {
            from: "users",
            localField: "sellerIds",
            foreignField: "_id",
            as: "sellerData",
          },
        },

        {
          $project: {
            _id: 1,

            orderNumber: {
              $toUpper: {
                $substrBytes: [
                  {
                    $toString: "$_id",
                  },
                  0,
                  8,
                ],
              },
            },

            customer: {
              name: "$customerData.name",
              email: "$customerData.email",
            },

            seller: {
              $cond: [
                {
                  $eq: [
                    {
                      $size: "$sellerData",
                    },
                    1,
                  ],
                },
                {
                  name: {
                    $arrayElemAt: ["$sellerData.name", 0],
                  },
                },
                {
                  name: "Multiple Sellers",
                },
              ],
            },

            totalAmount: "$total",
            status: "$orderStatus",
            paymentStatus: 1,
            paymentMethod: 1,
            createdAt: 1,
          },
        },
      ]);

      // ==========================================
      // TOP SELLERS
      // ==========================================

      const topSellerData = await Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            orderStatus: {
              $ne: "cancelled",
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
            as: "productData",
          },
        },

        {
          $unwind: {
            path: "$productData",
            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "productData.sellerId",
            foreignField: "_id",
            as: "sellerData",
          },
        },

        {
          $unwind: {
            path: "$sellerData",
            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $group: {
            _id: "$sellerData._id",

            name: {
              $first: "$sellerData.name",
            },

            email: {
              $first: "$sellerData.email",
            },

            revenue: {
              $sum: {
                $ifNull: ["$items.totalPrice", 0],
              },
            },

            orders: {
              $addToSet: "$_id",
            },
          },
        },

        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            revenue: 1,

            orders: {
              $size: "$orders",
            },
          },
        },

        {
          $sort: {
            revenue: -1,
          },
        },

        {
          $limit: 5,
        },
      ]);

      const topSellers = topSellerData.map((seller) => ({
        name: seller.name,
        orders: seller.orders,
        revenue: seller.revenue,
      }));

      // ==========================================
      // REVENUE CHART
      // ==========================================

      const chartDays = 30;

      const chartStart = new Date();

      chartStart.setHours(0, 0, 0, 0);

      chartStart.setDate(chartStart.getDate() - (chartDays - 1));

      const revenueByDay = await Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",

            orderStatus: {
              $ne: "cancelled",
            },

            createdAt: {
              $gte: chartStart,
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },

            revenue: {
              $sum: {
                $ifNull: ["$total", 0],
              },
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      const revenueMap = new Map(
        revenueByDay.map((item) => [item._id, item.revenue])
      );

      const chartLabels = [];
      const chartValues = [];

      for (let i = 0; i < chartDays; i++) {
        const date = new Date(chartStart);

        date.setDate(chartStart.getDate() + i);

        const year = date.getFullYear();

        const month = String(date.getMonth() + 1).padStart(2, "0");

        const day = String(date.getDate()).padStart(2, "0");

        const key = `${year}-${month}-${day}`;

        chartLabels.push(
          date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })
        );

        chartValues.push(revenueMap.get(key) || 0);
      }

      const revenueData = {
        labels: chartLabels,
        values: chartValues,
      };

      // ==========================================
      // DASHBOARD CALCULATIONS
      // ==========================================

      const sellerActivity =
        totalSellers > 0 ? Math.round((activeSellers / totalSellers) * 100) : 0;

      const nonCancelledOrders = totalOrders - cancelledOrders;

      const orderFulfillment =
        nonCancelledOrders > 0
          ? Math.round((deliveredOrders / nonCancelledOrders) * 100)
          : 0;

      const productHealth =
        activeProducts > 0
          ? Math.round(
              ((activeProducts - outOfStockProducts) / activeProducts) * 100
            )
          : 0;

      const notificationCount =
        pendingSellers + pendingProducts + pendingOrders + lowStockProducts;

      // ==========================================
      // FINAL STATS
      // ==========================================

      const stats = {
        revenue: totalRevenue,
        orders: totalOrders,
        customers: totalCustomers,
        sellers: activeSellers,
        products: totalProducts,

        pendingSellers,
        pendingOrders,
        pendingProducts,

        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,

        paidOrders,
        deliveredOrders,
        cancelledOrders,

        sellerActivity,
        orderFulfillment,
        productHealth,
      };

      // ==========================================
      // RENDER
      // ==========================================

      return res.render("admin/dashboard", {
        admin,

        currentPage: "dashboard",

        pageTitle: "Dashboard",

        notificationCount,

        pendingSellers,

        stats,

        revenueData,

        recentOrders,

        topSellers,
      });
    } catch (error) {
      console.error("=================================");
      console.error("ADMIN DASHBOARD ERROR");
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
      console.error("=================================");

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Unable to load admin dashboard.",
      });
    }
  }

  // =========================================================
  // ADMIN PRODUCTS
  // =========================================================

  async products(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

      const limit = 12;

      const skip = (page - 1) * limit;

      const search = (req.query.search || "").trim();
      const status = (req.query.status || "").trim();
      const stock = (req.query.stock || "").trim();

      // ==========================================
      // PRODUCT MATCH
      // ==========================================

      const match = {};

      if (["pending", "approved", "rejected"].includes(status)) {
        match.approvalStatus = status;
      }

      if (["in_stock", "out_of_stock"].includes(stock)) {
        match.stockStatus = stock;
      }

      // ==========================================
      // SEARCH
      // ==========================================

      let searchMatch = null;

      if (search) {
        const searchRegex = new RegExp(search, "i");

        searchMatch = {
          $or: [
            { productName: searchRegex },
            { sku: searchRegex },
            { brand: searchRegex },
            { "seller.name": searchRegex },
            { "seller.email": searchRegex },
          ],
        };
      }

      // ==========================================
      // PRODUCT AGGREGATION
      // ==========================================

      const pipeline = [
        {
          $match: match,
        },

        // ========================================
        // SELLER LOOKUP
        // ========================================

        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "seller",
          },
        },

        {
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true,
          },
        },

        // ========================================
        // CATEGORY LOOKUP
        // ========================================

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
      ];

      // ==========================================
      // SEARCH AFTER LOOKUP
      // ==========================================

      if (searchMatch) {
        pipeline.push({
          $match: searchMatch,
        });
      }

      // ==========================================
      // SORT
      // ==========================================

      pipeline.push({
        $sort: {
          createdAt: -1,
        },
      });

      // ==========================================
      // FACET
      // ==========================================

      pipeline.push({
        $facet: {
          products: [
            {
              $skip: skip,
            },

            {
              $limit: limit,
            },

            {
              $project: {
                _id: 1,

                productName: 1,

                slug: 1,

                description: 1,

                price: 1,

                stock: 1,

                sku: 1,

                brand: 1,

                tags: 1,

                images: 1,

                approvalStatus: 1,

                stockStatus: 1,

                isApproved: 1,

                isActive: 1,

                createdAt: 1,

                updatedAt: 1,

                seller: {
                  _id: "$seller._id",
                  name: "$seller.name",
                  email: "$seller.email",
                },

                category: {
                  _id: "$category._id",
                  categoryName: "$category.categoryName",
                },
              },
            },
          ],

          total: [
            {
              $count: "count",
            },
          ],

          statusStats: [
            {
              $group: {
                _id: "$approvalStatus",

                count: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      });

      const [result] = await Product.aggregate(pipeline);

      const products = result?.products || [];

      const total = result?.total?.[0]?.count || 0;

      // ==========================================
      // STATUS COUNTS
      // ==========================================

      let pending = 0;
      let approved = 0;
      let rejected = 0;

      for (const item of result?.statusStats || []) {
        if (item._id === "pending") {
          pending = item.count;
        }

        if (item._id === "approved") {
          approved = item.count;
        }

        if (item._id === "rejected") {
          rejected = item.count;
        }
      }

      // ==========================================
      // PENDING SELLERS
      // ==========================================

      const pendingSellerResult = await User.aggregate([
        {
          $match: {
            role: "seller",
            isVerified: true,
            isActive: false,
          },
        },

        {
          $count: "count",
        },
      ]);

      const pendingSellers = pendingSellerResult[0]?.count || 0;

      // ==========================================
      // PAGINATION
      // ==========================================

      const totalPages = Math.max(Math.ceil(total / limit), 1);

      const currentPage = Math.min(page, totalPages);

      const start = total === 0 ? 0 : skip + 1;

      const end = total === 0 ? 0 : Math.min(skip + products.length, total);

      // ==========================================
      // RENDER
      // ==========================================

      return res.render("admin/products", {
        admin: req.user,

        products,

        search,

        status,

        stock,

        pendingSellers,

        stats: {
          total,
          pending,
          approved,
          rejected,
        },

        pagination: {
          currentPage,
          totalPages,
          total,
          start,
          end,
        },

        currentPage: "products",

        pageTitle: "Products",

        success: req.flash("success"),

        error: req.flash("error"),
      });
    } catch (error) {
      console.error("Admin products error:", error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,

        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Unable to load admin products.",
      });
    }
  }

  // =========================================================
  // UPDATE PRODUCT APPROVAL STATUS
  // =========================================================

  async updateProductStatus(req, res) {
    try {
      const { id } = req.params;

      const { approvalStatus } = req.body;

      // ==========================================
      // VALIDATE PRODUCT ID
      // ==========================================

      const mongoose = require("mongoose");

      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid product ID.");

        return res.redirect("/poeme-perfumery/admin/products");
      }

      // ==========================================
      // VALIDATE STATUS
      // ==========================================

      const allowedStatuses = ["pending", "approved", "rejected"];

      if (!allowedStatuses.includes(approvalStatus)) {
        req.flash("error", "Invalid approval status.");

        return res.redirect("/poeme-perfumery/admin/products");
      }

      // ==========================================
      // UPDATE
      // ==========================================

      const isApproved = approvalStatus === "approved";

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          $set: {
            approvalStatus,
            isApproved,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedProduct) {
        req.flash("error", "Product not found.");

        return res.redirect("/poeme-perfumery/admin/products");
      }

      // ==========================================
      // SUCCESS
      // ==========================================

      if (approvalStatus === "approved") {
        req.flash("success", "Product approved successfully.");
      } else if (approvalStatus === "rejected") {
        req.flash("success", "Product rejected successfully.");
      } else {
        req.flash("success", "Product moved back to pending.");
      }

      return res.redirect(
        req.get("referer") || "/poeme-perfumery/admin/products"
      );
    } catch (error) {
      console.error("Admin product status update error:", error);

      req.flash("error", "Unable to update product status.");

      return res.redirect("/poeme-perfumery/admin/products");
    }
  }

  // =========================================================
  // ORDERS
  // =========================================================

  async orders(req, res) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);

      const limit = 10;
      const skip = (page - 1) * limit;

      const search = (req.query.search || "").trim();
      const status = (req.query.status || "").trim();
      const paymentStatus = (req.query.paymentStatus || "").trim();

      // =====================================================
      // BASE MATCH
      // =====================================================

      const match = {};

      const allowedOrderStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"];

      if (status && allowedOrderStatuses.includes(status)) {
        match.orderStatus = status;
      }

      if (paymentStatus && allowedPaymentStatuses.includes(paymentStatus)) {
        match.paymentStatus = paymentStatus;
      }

      // =====================================================
      // ESCAPE SEARCH REGEX
      // =====================================================

      const escapeRegex = (text) => {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      };

      const safeSearch = escapeRegex(search);

      // =====================================================
      // ORDER PIPELINE
      // =====================================================

      const pipeline = [
        {
          $match: match,
        },

        // ===================================================
        // GET CUSTOMER
        // ===================================================

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

        // ===================================================
        // SEARCH
        // ===================================================

        ...(search
          ? [
              {
                $match: {
                  $or: [
                    {
                      "customer.name": {
                        $regex: safeSearch,
                        $options: "i",
                      },
                    },

                    {
                      "customer.email": {
                        $regex: safeSearch,
                        $options: "i",
                      },
                    },

                    {
                      "items.productName": {
                        $regex: safeSearch,
                        $options: "i",
                      },
                    },

                    {
                      $expr: {
                        $regexMatch: {
                          input: {
                            $toString: "$_id",
                          },
                          regex: safeSearch,
                          options: "i",
                        },
                      },
                    },
                  ],
                },
              },
            ]
          : []),

        // ===================================================
        // SORT
        // ===================================================

        {
          $sort: {
            createdAt: -1,
          },
        },

        // ===================================================
        // PAGINATION + TOTAL
        // ===================================================

        {
          $facet: {
            orders: [
              {
                $skip: skip,
              },

              {
                $limit: limit,
              },

              {
                $project: {
                  _id: 1,

                  userId: 1,

                  customer: {
                    _id: "$customer._id",
                    name: "$customer.name",
                    email: "$customer.email",
                    phone: "$customer.phone",
                  },

                  items: 1,

                  subtotal: 1,
                  shipping: 1,
                  tax: 1,
                  total: 1,

                  paymentMethod: 1,
                  paymentStatus: 1,

                  orderStatus: 1,

                  shippingAddress: 1,

                  razorpayOrderId: 1,

                  razorpayPaymentId: 1,

                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            ],

            total: [
              {
                $count: "count",
              },
            ],
          },
        },
      ];

      const result = await Order.aggregate(pipeline);

      const orders = result[0]?.orders || [];

      const total = result[0]?.total?.[0]?.count || 0;

      const totalPages = Math.max(Math.ceil(total / limit), 1);

      const currentPage = Math.min(page, totalPages);

      // =====================================================
      // ORDER STATISTICS
      // =====================================================

      const statisticsResult = await Order.aggregate([
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

            paid: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$paymentStatus", "paid"],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const statistics = statisticsResult[0] || {};

      const start = total === 0 ? 0 : skip + 1;

      const end = total === 0 ? 0 : Math.min(skip + orders.length, total);

      // =====================================================
      // RENDER
      // =====================================================

      return res.render("admin/orders", {
        admin: req.user,

        orders,

        search,
        status,
        paymentStatus,

        statistics: {
          total: statistics.total || 0,
          pending: statistics.pending || 0,
          confirmed: statistics.confirmed || 0,
          processing: statistics.processing || 0,
          shipped: statistics.shipped || 0,
          delivered: statistics.delivered || 0,
          cancelled: statistics.cancelled || 0,
          paid: statistics.paid || 0,
        },

        pagination: {
          currentPage,
          totalPages,
          total,
          start,
          end,
        },

        currentPage: "orders",
        pageTitle: "Orders",

        success: req.flash("success"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.error("=================================");
      console.error("ADMIN ORDERS ERROR");
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
      console.error("=================================");

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Unable to load orders.",
      });
    }
  }

  // =========================================================
  // CATEGORIES
  // =========================================================

  async categories(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

      const limit = 12;

      const skip = (page - 1) * limit;

      const search = (req.query.search || "").trim();

      // =====================================================
      // SEARCH
      // =====================================================

      const pipeline = [];

      // =====================================================
      // SELLER LOOKUP
      // =====================================================

      pipeline.push({
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "seller",
        },
      });

      pipeline.push({
        $unwind: {
          path: "$seller",
          preserveNullAndEmptyArrays: true,
        },
      });

      // =====================================================
      // PRODUCT COUNT
      // =====================================================

      pipeline.push({
        $lookup: {
          from: "products",
          let: {
            categoryId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$categoryId", "$$categoryId"],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "productStats",
        },
      });

      // =====================================================
      // SEARCH AFTER LOOKUPS
      // =====================================================

      if (search) {
        const searchRegex = new RegExp(
          search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        );

        pipeline.push({
          $match: {
            $or: [
              {
                categoryName: searchRegex,
              },
              {
                slug: searchRegex,
              },
              {
                "seller.name": searchRegex,
              },
              {
                "seller.email": searchRegex,
              },
            ],
          },
        });
      }

      // =====================================================
      // FORMAT CATEGORY DATA
      // =====================================================

      pipeline.push({
        $project: {
          _id: 1,

          categoryName: 1,

          slug: 1,

          createdAt: 1,

          updatedAt: 1,

          seller: {
            _id: "$seller._id",
            name: "$seller.name",
            email: "$seller.email",
          },

          productCount: {
            $ifNull: [
              {
                $arrayElemAt: ["$productStats.count", 0],
              },
              0,
            ],
          },
        },
      });

      // =====================================================
      // SORT
      // =====================================================

      pipeline.push({
        $sort: {
          createdAt: -1,
        },
      });

      // =====================================================
      // PAGINATION + TOTAL
      // =====================================================

      pipeline.push({
        $facet: {
          categories: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],

          total: [
            {
              $count: "count",
            },
          ],
        },
      });

      const [result] = await Category.aggregate(pipeline);

      const categories = result?.categories || [];

      const total = result?.total?.[0]?.count || 0;

      // =====================================================
      // OVERALL CATEGORY STATISTICS
      // =====================================================

      const categoryStatsResult = await Category.aggregate([
        {
          $lookup: {
            from: "products",
            let: {
              categoryId: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$categoryId", "$$categoryId"],
                  },
                },
              },
              {
                $count: "count",
              },
            ],
            as: "productStats",
          },
        },

        {
          $project: {
            productCount: {
              $ifNull: [
                {
                  $arrayElemAt: ["$productStats.count", 0],
                },
                0,
              ],
            },
          },
        },

        {
          $group: {
            _id: null,

            totalCategories: {
              $sum: 1,
            },

            categoriesWithProducts: {
              $sum: {
                $cond: [
                  {
                    $gt: ["$productCount", 0],
                  },
                  1,
                  0,
                ],
              },
            },

            emptyCategories: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$productCount", 0],
                  },
                  1,
                  0,
                ],
              },
            },

            totalProductsAssigned: {
              $sum: "$productCount",
            },
          },
        },
      ]);

      const categoryStats = categoryStatsResult[0] || {};

      // =====================================================
      // PAGINATION
      // =====================================================

      const totalPages = Math.max(Math.ceil(total / limit), 1);

      const currentPage = Math.min(page, totalPages);

      const start = total === 0 ? 0 : skip + 1;

      const end = total === 0 ? 0 : Math.min(skip + categories.length, total);

      // =====================================================
      // RENDER
      // =====================================================

      return res.render("admin/categories", {
        admin: req.user,

        categories,

        search,

        stats: {
          total: categoryStats.totalCategories || 0,
          withProducts: categoryStats.categoriesWithProducts || 0,
          empty: categoryStats.emptyCategories || 0,
          products: categoryStats.totalProductsAssigned || 0,
        },

        pagination: {
          currentPage,
          totalPages,
          total,
          start,
          end,
        },

        currentPage: "categories",

        pageTitle: "Categories",

        success: req.flash("success"),

        error: req.flash("error"),
      });
    } catch (error) {
      console.error("=================================");
      console.error("ADMIN CATEGORIES ERROR");
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
      console.error("=================================");

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Unable to load categories.",
      });
    }
  }

  // =========================================================
  // CUSTOMERS WHO HAVE ORDERED PRODUCTS
  // =========================================================

  async customers(req, res) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = 12;
      const skip = (page - 1) * limit;

      const search = (req.query.search || "").trim();

      const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // ---------------------------------------------------------
      // PENDING SELLERS
      // Required by the admin sidebar
      // ---------------------------------------------------------

      const sellerRole = await Role.findOne({
        role: "seller",
      });

      let pendingSellers = 0;

      if (sellerRole) {
        const pendingSellerResult = await User.aggregate([
          {
            $match: {
              role: sellerRole._id,
              isVerified: true,
              isActive: false,
            },
          },
          {
            $count: "count",
          },
        ]);

        pendingSellers = pendingSellerResult[0]?.count || 0;
      }

      // ---------------------------------------------------------
      // CUSTOMER PIPELINE
      // ---------------------------------------------------------

      const customerPipeline = [
        // Only real paid orders
        {
          $match: {
            paymentStatus: "paid",
            orderStatus: {
              $ne: "cancelled",
            },
            "items.0": {
              $exists: true,
            },
          },
        },

        // -------------------------------------------------------
        // CUSTOMER LOOKUP
        // -------------------------------------------------------

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
            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $lookup: {
            from: "roles",
            localField: "customer.role",
            foreignField: "_id",
            as: "customerRole",
          },
        },

        {
          $unwind: {
            path: "$customerRole",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $match: {
            "customerRole.role": {
              $nin: ["admin", "seller"],
            },
          },
        },

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
                  ],
                },
              },
            ]
          : []),

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $group: {
            _id: "$userId",

            name: {
              $first: "$customer.name",
            },

            email: {
              $first: "$customer.email",
            },

            phone: {
              $first: "$customer.phone",
            },

            totalOrders: {
              $sum: 1,
            },

            totalSpent: {
              $sum: "$total",
            },

            productsOrdered: {
              $sum: {
                $size: "$items",
              },
            },

            latestOrderStatus: {
              $first: "$orderStatus",
            },

            lastOrder: {
              $first: "$createdAt",
            },
          },
        },

        // -------------------------------------------------------
        // SORT CUSTOMERS
        // -------------------------------------------------------

        {
          $sort: {
            lastOrder: -1,
          },
        },
      ];

      const customers = await Order.aggregate([
        ...customerPipeline,

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },
      ]);

      const totalResult = await Order.aggregate([
        ...customerPipeline,

        {
          $count: "count",
        },
      ]);

      const total = totalResult[0]?.count || 0;

      // ---------------------------------------------------------
      // PAGINATION
      // ---------------------------------------------------------

      const totalPages = Math.max(Math.ceil(total / limit), 1);

      const currentPage = Math.min(page, totalPages);

      const start = total === 0 ? 0 : skip + 1;

      const end = total === 0 ? 0 : Math.min(skip + customers.length, total);

      return res.render("admin/customers", {
        admin: req.user,

        customers,

        search,

        pendingSellers,

        pagination: {
          currentPage,
          totalPages,
          total,
          start,
          end,
        },

        currentPage: "users",

        pageTitle: "Customers",

        success: req.flash("success"),

        error: req.flash("error"),
      });
    } catch (error) {
      console.error("Admin customers error:", error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Unable to load customers.",
      });
    }
  }

  // Sellers
  async sellers(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

      const limit = 12;

      const skip = (page - 1) * limit;

      const search = (req.query.search || "").trim();

      // =====================================================
      // GET SELLER ROLE
      // =====================================================

      const sellerRole = await Role.aggregate([
        {
          $match: {
            role: "seller",
          },
        },
        {
          $project: {
            _id: 1,
            role: 1,
          },
        },
      ]);

      if (!sellerRole.length) {
        return res.render("admin/sellers", {
          admin: req.user,
          sellers: [],
          search,
          pendingSellers: 0,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            total: 0,
            start: 0,
            end: 0,
          },
          currentPage: "sellers",
          pageTitle: "Sellers",
          success: req.flash("success"),
          error: req.flash("error"),
        });
      }

      const sellerRoleId = sellerRole[0]._id;

      // =====================================================
      // SEARCH REGEX
      // =====================================================

      let searchMatch = {};

      if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const searchRegex = new RegExp(escapedSearch, "i");

        searchMatch = {
          $or: [
            {
              name: searchRegex,
            },
            {
              email: searchRegex,
            },
            {
              phone: searchRegex,
            },
          ],
        };
      }

      // =====================================================
      // SELLER PIPELINE
      // =====================================================

      const sellerPipeline = [
        {
          $match: {
            role: sellerRoleId,
            ...searchMatch,
          },
        },

        // ===================================================
        // PRODUCT COUNT
        // ===================================================

        {
          $lookup: {
            from: "products",
            let: {
              sellerId: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$sellerId", "$$sellerId"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: 1,
                  },
                  active: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$isActive", true],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "productStats",
          },
        },

        // ===================================================
        // FORMAT PRODUCT COUNT
        // ===================================================

        {
          $set: {
            totalProducts: {
              $ifNull: [
                {
                  $arrayElemAt: ["$productStats.total", 0],
                },
                0,
              ],
            },

            activeProducts: {
              $ifNull: [
                {
                  $arrayElemAt: ["$productStats.active", 0],
                },
                0,
              ],
            },
          },
        },

        // ===================================================
        // PROJECT SELLER DATA
        // ===================================================

        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            isActive: 1,
            isVerified: 1,
            createdAt: 1,
            updatedAt: 1,
            totalProducts: 1,
            activeProducts: 1,
          },
        },

        // ===================================================
        // SORT
        // ===================================================

        {
          $sort: {
            createdAt: -1,
          },
        },
      ];

      // =====================================================
      // TOTAL SELLERS
      // =====================================================

      const totalResult = await User.aggregate([
        ...sellerPipeline,
        {
          $count: "count",
        },
      ]);

      const total = totalResult.length ? totalResult[0].count : 0;

      // =====================================================
      // PAGINATED SELLERS
      // =====================================================

      const sellers = await User.aggregate([
        ...sellerPipeline,

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },
      ]);

      // =====================================================
      // PAGINATION
      // =====================================================

      const totalPages = Math.max(Math.ceil(total / limit), 1);

      const currentPage = Math.min(page, totalPages);

      const start = total === 0 ? 0 : skip + 1;

      const end = total === 0 ? 0 : Math.min(skip + sellers.length, total);

      // =====================================================
      // PENDING SELLERS
      // =====================================================

      const pendingSellerResult = await User.aggregate([
        {
          $match: {
            role: sellerRoleId,
            isVerified: false,
          },
        },
        {
          $count: "count",
        },
      ]);

      const pendingSellers = pendingSellerResult.length
        ? pendingSellerResult[0].count
        : 0;

      // =====================================================
      // RENDER
      // =====================================================

      return res.render("admin/sellers", {
        admin: req.user,

        sellers,

        search,

        pendingSellers,

        pagination: {
          currentPage,
          totalPages,
          total,
          start,
          end,
        },

        currentPage: "sellers",

        pageTitle: "Sellers",

        success: req.flash("success"),

        error: req.flash("error"),
      });
    } catch (error) {
      console.error("ADMIN SELLERS ERROR:", error);

      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Unable to load sellers.",
      });
    }
  }

  // =========================================================
  // DELETE SELLER
  // =========================================================
  // Soft delete seller by setting isActive = false.
  // This keeps existing products/orders safe.
  // =========================================================

  async deleteSeller(req, res) {
    try {
      const { id } = req.params;

      // =====================================================
      // GET SELLER ROLE
      // =====================================================

      const sellerRole = await Role.aggregate([
        {
          $match: {
            role: "seller",
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);

      if (!sellerRole.length) {
        req.flash("error", "Seller role not found.");

        return res.redirect("/poeme-perfumery/admin/sellers");
      }

      const sellerRoleId = sellerRole[0]._id;

      // =====================================================
      // CHECK SELLER
      // =====================================================

      const seller = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            role: sellerRoleId,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            isActive: 1,
          },
        },
      ]);

      if (!seller.length) {
        req.flash("error", "Seller not found.");

        return res.redirect("/poeme-perfumery/admin/sellers");
      }

      // =====================================================
      // SOFT DELETE
      // =====================================================

      const deletedSeller = await User.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id),
          role: sellerRoleId,
        },
        {
          $set: {
            isActive: false,
          },
        },
        {
          new: true,
        }
      );

      if (!deletedSeller) {
        req.flash("error", "Unable to delete seller.");

        return res.redirect("/poeme-perfumery/admin/sellers");
      }

      req.flash("success", "Seller deleted successfully.");

      return res.redirect("/poeme-perfumery/admin/sellers");
    } catch (error) {
      console.error("ADMIN DELETE SELLER ERROR:", error);

      req.flash("error", "Unable to delete seller.");

      return res.redirect("/poeme-perfumery/admin/sellers");
    }
  }
}

module.exports = new adminPageController();
