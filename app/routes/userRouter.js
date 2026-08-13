const express = require("express");
const Auth = require("../middleware/authMiddleware");
const userController = require("../controller/userController");
const passport = require("passport");

const UserAPI = express.Router();

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User authentication, products, cart and order APIs
 */

/* =================================================================== */
//                          Authentication
/* =================================================================== */

// User Login Via Google
/**
 * @swagger
 * /api/v1/user/google:
 *   get:
 *     tags:
 *       - User
 *     summary: Login with Google
 *     description: Starts Google OAuth authentication.
 *     responses:
 *       302:
 *         description: Redirects the user to Google authentication.
 *       500:
 *         description: Server error.
 */
UserAPI.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * @swagger
 * /api/v1/user/google/callback:
 *   get:
 *     tags:
 *       - User
 *     summary: Google authentication callback
 *     description: Handles the callback after successful Google authentication.
 *     responses:
 *       302:
 *         description: Authentication successful or failed.
 *       401:
 *         description: Google authentication failed.
 *       500:
 *         description: Server error.
 */
UserAPI.get(
  "google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/v1/user/login",
  }),
  userController.googleLogin
);

// User Register
/**
 * @swagger
 * /api/v1/user/register:
 *   post:
 *     tags:
 *       - User
 *     summary: Register a new user
 *     description: Creates a new user account and starts email OTP verification.
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
 *                 example: Avijit Roy
 *               phone:
 *                 type: string
 *                 example: "8910806300"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: avijit@example.com
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
 *       200:
 *         description: User registered successfully.
 *       400:
 *         description: Invalid registration data.
 *       409:
 *         description: Email already exists.
 *       500:
 *         description: Server error.
 */
UserAPI.post("/register", userController.register);

// Verify OTP
/**
 * @swagger
 * /api/v1/user/verify:
 *   post:
 *     tags:
 *       - User
 *     summary: Verify user OTP
 *     description: Verifies the OTP sent to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: User verified successfully.
 *       400:
 *         description: Invalid or expired OTP.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
UserAPI.post("/verify", userController.verify);

// Login User
/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     tags:
 *       - User
 *     summary: Login user
 *     description: Authenticates a user using email and password.
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
 *                 example: avijit@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *               remember:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Login successful.
 *       400:
 *         description: Invalid request data.
 *       401:
 *         description: Invalid email or password.
 *       403:
 *         description: Email is not verified.
 *       500:
 *         description: Server error.
 */
UserAPI.post("/login", userController.login);

// Logout User
/**
 * @swagger
 * /api/v1/user/logout:
 *   post:
 *     tags:
 *       - User
 *     summary: Logout user
 *     description: Logs out the currently authenticated user and invalidates authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
UserAPI.post("/logout", Auth(["user"]), userController.logout);

/* =================================================================== */
//                          POEME PERFUMERY
/* =================================================================== */

// Home

/**
 * @swagger
 * /api/v1/user/home:
 *   get:
 *     tags:
 *       - User
 *     summary: Get home page products
 *     description: Returns the latest approved, active and in-stock products.
 *     security: []
 *     responses:
 *       200:
 *         description: Home page products fetched successfully.
 *       500:
 *         description: Server error.
 */
UserAPI.get("/home", userController.landingPage);

// Perfumes
/**
 * @swagger
 * /api/v1/user/perfumes:
 *   get:
 *     tags:
 *       - User
 *     summary: Get perfumes
 *     description: Returns perfumes with search, category, brand, price, stock, sorting and pagination filters.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *
 *       - in: query
 *         name: search
 *         required: false
 *         description: Search products by name.
 *         schema:
 *           type: string
 *         example: Oud
 *
 *       - in: query
 *         name: category
 *         required: false
 *         description: Category ID.
 *         schema:
 *           type: string
 *         example: 64f123456789abcdef123456
 *
 *       - in: query
 *         name: brand
 *         required: false
 *         description: Filter products by brand.
 *         schema:
 *           type: string
 *         example: Poeme
 *
 *       - in: query
 *         name: price
 *         required: false
 *         description: Maximum product price.
 *         schema:
 *           type: number
 *         example: 5000
 *
 *       - in: query
 *         name: stock
 *         required: false
 *         description: Filter products by availability.
 *         schema:
 *           type: string
 *           enum:
 *             - instock
 *             - outofstock
 *
 *       - in: query
 *         name: sort
 *         required: false
 *         description: Product sorting method.
 *         schema:
 *           type: string
 *           enum:
 *             - latest
 *             - priceLow
 *             - priceHigh
 *             - name
 *           default: latest
 *
 *     responses:
 *       200:
 *         description: Products fetched successfully.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
UserAPI.get("/perfumes", Auth(["user"]), userController.perfumes);

// Product details
/**
 * @swagger
 * /api/v1/user/products/{slug}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get product details
 *     description: Returns detailed information about a product using its slug.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Product slug.
 *         schema:
 *           type: string
 *         example: oud-royal
 *     responses:
 *       200:
 *         description: Product details fetched successfully.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
UserAPI.get("/products/:slug", Auth(["user"]), userController.viewProductPage);

// Add product to cart
/**
 * @swagger
 * /api/v1/user/cart/{id}:
 *   post:
 *     tags:
 *       - User
 *     summary: Add product to cart
 *     description: Adds one quantity of a product to the authenticated user's cart.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product ID.
 *         schema:
 *           type: string
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Product added to cart.
 *       400:
 *         description: Product is unavailable or out of stock.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
UserAPI.post("/cart/:id", Auth(["user"]), userController.addToCart);

// Show Cart Items
/**
 * @swagger
 * /api/v1/user/cart:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user's cart
 *     description: Returns all cart items belonging to the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items fetched successfully.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
UserAPI.get("/cart", Auth(["user"]), userController.addToCartPage);

// Increase cart quantity
/**
 * @swagger
 * /api/v1/user/cart/{id}/increase:
 *   patch:
 *     tags:
 *       - User
 *     summary: Increase cart quantity
 *     description: Increases the quantity of a product in the authenticated user's cart.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product ID.
 *         schema:
 *           type: string
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Cart quantity increased.
 *       400:
 *         description: Maximum available stock reached.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Cart item not found.
 *       500:
 *         description: Server error.
 */
UserAPI.patch(
  "/cart/:id/increase",
  Auth(["user"]),
  userController.increaseCartQuantity
);

// Decrease cart quantity
/**
 * @swagger
 * /api/v1/user/cart/{id}/decrease:
 *   patch:
 *     tags:
 *       - User
 *     summary: Decrease cart quantity
 *     description: Decreases the quantity of a product in the authenticated user's cart.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product ID.
 *         schema:
 *           type: string
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Cart quantity decreased.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Cart item not found.
 *       500:
 *         description: Server error.
 */
UserAPI.patch(
  "/cart/:id/decrease",
  Auth(["user"]),
  userController.decreaseCartQuantity
);

// Remove cart item
/**
 * @swagger
 * /api/v1/user/cart/{id}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Remove cart item
 *     description: Removes a product from the authenticated user's cart.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product ID.
 *         schema:
 *           type: string
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Cart item removed successfully.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Cart item not found.
 *       500:
 *         description: Server error.
 */
UserAPI.delete("/cart/:id", Auth(["user"]), userController.removeCartItem);

// Get logged-in user's orders
/**
 * @swagger
 * /api/v1/user/orders:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user's orders
 *     description: Returns paid orders belonging to the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User orders fetched successfully.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
UserAPI.get("/orders", Auth(["user"]), userController.orders);

module.exports = UserAPI;
