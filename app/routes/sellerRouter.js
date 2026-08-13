const express = require("express");
const sellerController = require("../controller/sellerController");
const Auth = require("../middleware/authMiddleware");
const uploadFile = require("../middleware/cloudinaryMiddleware");
const csvUpload = require("../middleware/csvUpload");

const SellerAPI = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Seller
 *     description: Seller authentication, products, categories, images and orders APIs
 */

/* ========================================================================== */
/*                           SELLER AUTHENTICATION                            */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/register:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Register seller
 *     description: Creates a new seller account and sends an email OTP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - email
 *               - password
 *               - confirmPassword
 *               - terms
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Seller
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: seller@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *               terms:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Seller registered successfully.
 *       200:
 *         description: Existing unverified account. New OTP sent.
 *       400:
 *         description: Invalid registration data.
 *       409:
 *         description: Account already exists.
 *       500:
 *         description: Server error.
 */
SellerAPI.post("/register", sellerController.register);

/**
 * @swagger
 * /api/v1/seller/verify:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Verify seller registration OTP
 *     description: Verifies the OTP sent to the seller email during registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: seller@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Seller account verified successfully.
 *       400:
 *         description: Invalid or expired OTP.
 *       404:
 *         description: Seller not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.post("/verify", sellerController.verify);

/**
 * @swagger
 * /api/v1/seller/login:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Seller password login
 *     description: Authenticates seller using email and password.
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
 *                 example: seller@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Seller login successful.
 *       400:
 *         description: Invalid request.
 *       401:
 *         description: Invalid email or password.
 *       403:
 *         description: Account is not verified or is not a seller.
 *       500:
 *         description: Server error.
 */
SellerAPI.post("/login", sellerController.login);

/**
 * @swagger
 * /api/v1/seller/login-otp:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Request seller login OTP
 *     description: Sends a login OTP to the seller email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: seller@example.com
 *     responses:
 *       200:
 *         description: Login OTP sent successfully.
 *       401:
 *         description: Invalid email.
 *       403:
 *         description: Account is not a seller or is not verified.
 *       500:
 *         description: Server error.
 */
SellerAPI.post("/login-otp", sellerController.loginWithOtp);

/**
 * @swagger
 * /api/v1/seller/verify-login:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Verify seller login OTP
 *     description: Verifies seller login OTP and returns authentication tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: seller@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Seller login successful.
 *       400:
 *         description: Invalid or expired OTP.
 *       404:
 *         description: Seller not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.post("/verify-login", sellerController.verifyLogin);

/**
 * @swagger
 * /api/v1/seller/logout:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Logout seller
 *     description: Invalidates the seller refresh token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller logged out successfully.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
SellerAPI.post("/logout", Auth(["seller"]), sellerController.logout);

/* ========================================================================== */
/*                              SELLER DASHBOARD                              */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/dashboard:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Get seller dashboard
 *     description: Returns seller statistics, revenue, orders, customers, stock and product analytics.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Seller not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.get("/dashboard", Auth(["seller"]), sellerController.dashboard);

/* ========================================================================== */
/*                               CATEGORIES                                   */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/categories:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Get seller categories
 *     description: Returns all categories belonging to the authenticated seller.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories fetched successfully.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Seller not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.get("/categories", Auth(["seller"]), sellerController.categories);

/**
 * @swagger
 * /api/v1/seller/categories:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Create seller category
 *     description: Creates a category for the authenticated seller.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryName
 *             properties:
 *               categoryName:
 *                 type: string
 *                 example: Oud Perfumes
 *     responses:
 *       201:
 *         description: Category created successfully.
 *       400:
 *         description: Invalid category data.
 *       401:
 *         description: Authentication required.
 *       409:
 *         description: Category already exists.
 *       500:
 *         description: Server error.
 */
SellerAPI.post(
  "/categories",
  Auth(["seller"]),
  sellerController.createCategory
);

/* ========================================================================== */
/*                                PRODUCTS                                    */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/products:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Get seller products
 *     description: Returns active products belonging to the authenticated seller.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products fetched successfully.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Seller not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.get("/products", Auth(["seller"]), sellerController.products);

/**
 * @swagger
 * /api/v1/seller/products:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Create product
 *     description: Creates a new product with optional product images.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - productName
 *               - description
 *               - price
 *               - stock
 *               - sku
 *             properties:
 *               categoryId:
 *                 type: string
 *                 example: 64f123456789abcdef123456
 *               productName:
 *                 type: string
 *                 example: Oud Royal
 *               description:
 *                 type: string
 *                 example: Premium oud perfume.
 *               price:
 *                 type: number
 *                 example: 2499
 *               stock:
 *                 type: integer
 *                 example: 20
 *               sku:
 *                 type: string
 *                 example: OUD-001
 *               brand:
 *                 type: string
 *                 example: Poeme
 *               tags:
 *                 type: string
 *                 example: oud,premium,perfume
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully.
 *       400:
 *         description: Invalid product data.
 *       401:
 *         description: Authentication required.
 *       409:
 *         description: Product already exists.
 *       500:
 *         description: Server error.
 */
SellerAPI.post(
  "/products",
  Auth(["seller"]),
  uploadFile.array("images", 5),
  sellerController.createProduct
);

/* ========================================================================== */
/*                              PRODUCT STOCK                                 */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/products/{id}/increase-stock:
 *   patch:
 *     tags:
 *       - Seller
 *     summary: Increase product stock
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Stock increased successfully.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.patch(
  "/products/:id/increase-stock",
  Auth(["seller"]),
  sellerController.increaseStock
);

/**
 * @swagger
 * /api/v1/seller/products/{id}/decrease-stock:
 *   patch:
 *     tags:
 *       - Seller
 *     summary: Decrease product stock
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Stock decreased successfully.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.patch(
  "/products/:id/decrease-stock",
  Auth(["seller"]),
  sellerController.decreaseStock
);

/**
 * @swagger
 * /api/v1/seller/products/{id}/out-of-stock:
 *   patch:
 *     tags:
 *       - Seller
 *     summary: Mark product out of stock
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Product marked out of stock.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.patch(
  "/products/:id/out-of-stock",
  Auth(["seller"]),
  sellerController.outOfStock
);

/* ========================================================================== */
/*                           PRODUCT DELETE / RESTORE                         */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/products/{id}:
 *   delete:
 *     tags:
 *       - Seller
 *     summary: Soft delete product
 *     description: Deactivates a product without permanently deleting it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.delete(
  "/products/:id",
  Auth(["seller"]),
  sellerController.deleteProduct
);

/**
 * @swagger
 * /api/v1/seller/products/deleted:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Get deleted products
 *     description: Returns products that have been soft deleted by the seller.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted products fetched successfully.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
SellerAPI.get(
  "/products/deleted",
  Auth(["seller"]),
  sellerController.deletedProductsPage
);

/**
 * @swagger
 * /api/v1/seller/products/{id}/restore:
 *   patch:
 *     tags:
 *       - Seller
 *     summary: Restore deleted product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product restored successfully.
 *       400:
 *         description: Invalid product ID.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Deleted product not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.patch(
  "/products/:id/restore",
  Auth(["seller"]),
  sellerController.restoreProduct
);

/* ========================================================================== */
/*                           PRODUCT EDIT / VIEW                              */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/products/{id}:
 *   put:
 *     tags:
 *       - Seller
 *     summary: Update product
 *     description: Updates an existing seller product.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               productName:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               sku:
 *                 type: string
 *               brand:
 *                 type: string
 *               tags:
 *                 type: string
 *                 example: oud,premium
 *     responses:
 *       200:
 *         description: Product updated successfully.
 *       400:
 *         description: Invalid product data.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Product not found.
 *       409:
 *         description: Product with same name or SKU already exists.
 *       500:
 *         description: Server error.
 */
SellerAPI.put("/products/:id", Auth(["seller"]), sellerController.editProduct);

/**
 * @swagger
 * /api/v1/seller/products/{id}/view:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Get product details
 *     description: Returns a single active product belonging to the seller.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details fetched successfully.
 *       400:
 *         description: Invalid product ID.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.get(
  "/products/:id/view",
  Auth(["seller"]),
  sellerController.viewProductPage
);

/* ========================================================================== */
/*                            BULK PRODUCT UPLOAD                             */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/products/bulk-upload:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Bulk upload products using CSV
 *     description: Uploads multiple products from a CSV file.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Bulk upload completed successfully.
 *       400:
 *         description: CSV file missing, empty or invalid.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
SellerAPI.post(
  "/products/bulk-upload",
  Auth(["seller"]),
  csvUpload.single("file"),
  sellerController.bulkUpload
);

/**
 * @swagger
 * /api/v1/seller/products/template:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Download product CSV template
 *     description: Downloads a CSV template for bulk product upload.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV template downloaded successfully.
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
SellerAPI.get(
  "/products/template",
  Auth(["seller"]),
  sellerController.downloadTemplate
);

/* ========================================================================== */
/*                              IMAGE LIBRARY                                 */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/images:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Upload images
 *     description: Uploads one or more images to the seller image library.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded successfully.
 *       400:
 *         description: No images provided.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
SellerAPI.post(
  "/images",
  Auth(["seller"]),
  uploadFile.array("images", 5),
  sellerController.uploadImage
);

/**
 * @swagger
 * /api/v1/seller/images:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Get seller image library
 *     description: Returns paginated images belonging to the authenticated seller.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         example: IMG0001
 *     responses:
 *       200:
 *         description: Image library fetched successfully.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
SellerAPI.get("/images", Auth(["seller"]), sellerController.imageLibrary);

/**
 * @swagger
 * /api/v1/seller/images/{id}:
 *   delete:
 *     tags:
 *       - Seller
 *     summary: Delete image
 *     description: Permanently deletes an unused image from the seller image library and Cloudinary.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully.
 *       400:
 *         description: Image is assigned to a product.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Image not found.
 *       500:
 *         description: Server error.
 */
SellerAPI.delete("/images/:id", Auth(["seller"]), sellerController.deleteImage);

/* ========================================================================== */
/*                                  ORDERS                                    */
/* ========================================================================== */

/**
 * @swagger
 * /api/v1/seller/orders:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Get seller orders
 *     description: Returns paid orders containing products belonging to the authenticated seller.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search customer, product or order ID.
 *         example: Oud
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - confirmed
 *             - processing
 *             - shipped
 *             - delivered
 *             - cancelled
 *     responses:
 *       200:
 *         description: Orders fetched successfully.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
SellerAPI.get("/orders", Auth(["seller"]), sellerController.orders);

/**
 * @swagger
 * /api/v1/seller/orders/{id}/status:
 *   patch:
 *     tags:
 *       - Seller
 *     summary: Update order status
 *     description: Updates an order status according to the allowed seller order flow.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderStatus
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - confirmed
 *                   - processing
 *                   - shipped
 *                   - delivered
 *                   - cancelled
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Order status updated successfully.
 *       400:
 *         description: Invalid order ID, status or status transition.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Order not found or does not belong to seller.
 *       500:
 *         description: Server error.
 */
SellerAPI.patch(
  "/orders/:id/status",
  Auth(["seller"]),
  sellerController.updateOrderStatus
);

module.exports = SellerAPI;
