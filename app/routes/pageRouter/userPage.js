const express = require("express");
const userPageController = require("../../controller/pageController/userPageController");
const passport = require("passport");
const pageAuth = require("../../middleware/pageAuth/pageAuthMiddleware");
const optionalAuth = require("../../middleware/pageAuth/optionalAuth");

const User = express.Router();
const userAuth = pageAuth("/poeme-perfumery/login", ["user"]);

/*
 * =========================================================
 * USER AUTH
 * =========================================================
 */

User.get("/register", userPageController.registerpage);

User.post("/register", userPageController.register);

User.get("/verify", userPageController.verifyPage);

User.post("/verify", userPageController.verify);

User.get("/login", userPageController.loginPage);

User.post("/login", userPageController.login);

/*
 * =========================================================
 * GOOGLE LOGIN
 * =========================================================
 */

User.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

User.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/poeme-perfumery/login",
    session: true,
  }),
  userPageController.googleLogin
);

/*
 * =========================================================
 * USER LOGOUT
 * =========================================================
 */

User.get("/logout", userAuth, userPageController.logout);

/*
 * =========================================================
 * LANDING PAGE
 * =========================================================
 *
 * Landing page can be accessed without login.
 */

User.get("/home", optionalAuth, userPageController.landingPage);

/*
 * =========================================================
 * PERFUMES
 * =========================================================
 */

User.get("/perfumes", userAuth, userPageController.perfumes);
User.get("/product/:slug", optionalAuth, userPageController.viewProductPage);

/*
 * =========================================================
 * CART
 * =========================================================
 */

User.get("/cart", userAuth, userPageController.addToCartPage);

User.get("/addToCart/:id", userAuth, userPageController.addToCart);

User.get(
  "/cart/increase/:id",
  userAuth,
  userPageController.increaseCartQuantity
);

User.get(
  "/cart/decrease/:id",
  userAuth,
  userPageController.decreaseCartQuantity
);

User.get("/cart/remove/:id", userAuth, userPageController.removeCartItem);

/*
 * =========================================================
 * ORDERS
 * =========================================================
 */

User.get("/orders", userAuth, userPageController.orders);

/*
 * =========================================================
 * SETTINGS
 * =========================================================
 */

User.get("/settings", userAuth, userPageController.settings);

/*
 * =========================================================
 * CUSTOMER SUPPORT CHAT
 * =========================================================
 */

User.get("/chat", userAuth, userPageController.chatSupport);

module.exports = User;
