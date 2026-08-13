const express = require("express");

const adminController = require("../controller/adminController");
const Auth = require("../middleware/authMiddleware");

const AdminAPI = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin APIs
 */

/* ============================================================
   ADMIN AUTHENTICATION
   ============================================================ */

/**
 * @swagger
 * /api/v1/admin/login:
 *   post:
 *     summary: Admin Login
 *     description: Authenticate an admin and generate access and refresh tokens.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin@123
 *               remember:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Admin logged in successfully.
 *       400:
 *         description: Invalid request data.
 *       401:
 *         description: Invalid email or password.
 *       500:
 *         description: Server error.
 */
AdminAPI.post("/login", adminController.login);

/**
 * @swagger
 * /api/v1/admin/logout:
 *   post:
 *     summary: Admin Logout
 *     description: Logout the authenticated admin and invalidate the refresh token.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin logged out successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
AdminAPI.post("/logout", Auth(["admin"]), adminController.logout);

/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     summary: Get All Products
 *     description: Get products with search, approval status, stock status and pagination.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name, SKU, brand, seller name or seller email.
 *
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - approved
 *             - rejected
 *         description: Filter products by approval status.
 *
 *       - in: query
 *         name: stock
 *         schema:
 *           type: string
 *           enum:
 *             - in_stock
 *             - out_of_stock
 *         description: Filter products by stock status.
 *
 *     responses:
 *       200:
 *         description: Products retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
AdminAPI.get("/products", Auth(["admin"]), adminController.products);

/**
 * @swagger
 * /api/v1/admin/products/{id}/status:
 *   patch:
 *     summary: Update Product Approval Status
 *     description: Approve, reject or move a product back to pending.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product MongoDB ObjectId.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approvalStatus
 *             properties:
 *               approvalStatus:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - approved
 *                   - rejected
 *                 example: approved
 *
 *     responses:
 *       200:
 *         description: Product approval status updated successfully.
 *       400:
 *         description: Invalid product ID or approval status.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
AdminAPI.patch(
  "/products/:id/status",
  Auth(["admin"]),
  adminController.updateProductStatus
);

/**
 * @swagger
 * /api/v1/admin/orders:
 *   get:
 *     summary: Get All Orders
 *     description: Get all customer orders with search, order status, payment status and pagination.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name, email, product name or order ID.
 *
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - confirmed
 *             - processing
 *             - shipped
 *             - delivered
 *             - cancelled
 *         description: Filter by order status.
 *
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - paid
 *             - failed
 *             - refunded
 *         description: Filter by payment status.
 *
 *     responses:
 *       200:
 *         description: Orders retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
AdminAPI.get("/orders", Auth(["admin"]), adminController.orders);

/**
 * @swagger
 * /api/v1/admin/categories:
 *   get:
 *     summary: Get All Categories
 *     description: Get all categories with seller information, product counts, search and pagination.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by category name, slug, seller name or seller email.
 *
 *     responses:
 *       200:
 *         description: Categories retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
AdminAPI.get("/categories", Auth(["admin"]), adminController.categories);

/**
 * @swagger
 * /api/v1/admin/customers:
 *   get:
 *     summary: Get Customers
 *     description: Get customers who have placed paid orders.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name, email or phone.
 *
 *     responses:
 *       200:
 *         description: Customers retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
AdminAPI.get("/customers", Auth(["admin"]), adminController.customers);

/**
 * @swagger
 * /api/v1/admin/sellers:
 *   get:
 *     summary: Get All Sellers
 *     description: Get all sellers with product statistics, search and pagination.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by seller name, email or phone.
 *
 *     responses:
 *       200:
 *         description: Sellers retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
AdminAPI.get("/sellers", Auth(["admin"]), adminController.sellers);

/**
 * @swagger
 * /api/v1/admin/sellers/{id}:
 *   delete:
 *     summary: Delete Seller
 *     description: Soft delete a seller by setting isActive to false.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller MongoDB ObjectId.
 *
 *     responses:
 *       200:
 *         description: Seller deleted successfully.
 *       400:
 *         description: Invalid seller ID.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Seller not found.
 *       500:
 *         description: Server error.
 */
AdminAPI.delete("/sellers/:id", Auth(["admin"]), adminController.deleteSeller);

module.exports = AdminAPI;
