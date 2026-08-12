const express = require("express");
const adminPageController = require("../../controller/pageController/adminPageController");
const pageAuth = require("../../middleware/pageAuth/pageAuthMiddleware");

const Admin = express.Router();
const adminAuth = pageAuth("/poeme-perfumery/admin/login", ["admin"]);

// ==========================================
// LOGIN & Logout
// ==========================================

Admin.get("/login", adminPageController.loginPage);
Admin.post("/login", adminPageController.login);
Admin.get("/logout", adminAuth, adminPageController.logout);
// ==========================================
// DASHBOARD
// ==========================================

Admin.get("/dashboard", adminAuth, adminPageController.dashboard);

// ==========================================
// PRODUCTS
// ==========================================

Admin.get("/products", adminAuth, adminPageController.products);

// ==========================================
// PRODUCT STATUS
// ==========================================

Admin.post(
  "/products/:id/status",
  adminAuth,
  adminPageController.updateProductStatus
);

// ==========================================
// Orders
// ==========================================

Admin.get("/orders", adminAuth, adminPageController.orders);

// ==========================================
// Categories
// ==========================================

Admin.get("/categories", adminAuth, adminPageController.categories);
// ==========================================
// Customers
// ==========================================

Admin.get("/customers", adminAuth, adminPageController.customers);

// ==========================================
// SELLERS
// ==========================================

Admin.get("/sellers", adminAuth, adminPageController.sellers);

Admin.post("/sellers/:id/delete", adminAuth, adminPageController.deleteSeller);

module.exports = Admin;
