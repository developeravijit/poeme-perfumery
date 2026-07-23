const express = require("express");
const sellerPageController = require("../../controller/pageController/sellerPageController");

const Seller = express.Router();

// Register
Seller.get("/register", sellerPageController.registerPage);
Seller.post("/register", sellerPageController.register);

// Verify Seller
Seller.get("/verify", sellerPageController.verifyPage);
Seller.post("/verify", sellerPageController.verify);

// Login
Seller.get("/login", sellerPageController.loginPage);
Seller.post("/login", sellerPageController.login);

// Login With OTP
Seller.post("/login-otp", sellerPageController.loginWithOtp);
Seller.post("/verify-login", sellerPageController.verifyLogin);

module.exports = Seller;
