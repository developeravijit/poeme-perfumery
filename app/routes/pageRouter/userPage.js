const express = require("express");
const userPageController = require("../../controller/pageController/userPageController");
const passport = require("passport");
const pageAuth = require("../../middleware/pageAuth/pageAuthMiddleware");

const User = express.Router();

// Navbar Pages
User.get("/home", userPageController.landingPage);
User.get("/perfumes", userPageController.perfumes);

// Auth Page and API
User.get("/register", userPageController.registerpage);
User.post("/register", userPageController.register);
User.get("/verify", userPageController.verifyPage);
User.post("/verify", userPageController.verify);
User.get("/login", userPageController.loginPage);
User.post("/login", userPageController.login);

// Google Login
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

// Logout
User.get("/logout", pageAuth, userPageController.logout);

/* ====================================================================================== */
// Add To Cart
User.get("/cart", pageAuth, userPageController.addToCart);

// Orders
User.get("/orders", pageAuth, userPageController.orders);

// Settings
User.get("/settings", pageAuth, userPageController.settings);

// Contact Us Chat Support
User.get("/chat", pageAuth, userPageController.chatSupport);

module.exports = User;
