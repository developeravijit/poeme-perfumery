const express = require("express");
const sellerPageController = require("../../controller/pageController/sellerPageController");

const Seller = express.Router();

// Register
Seller.get("/register", sellerPageController.registerPage);
Seller.post("/register", sellerPageController.register);

// Login
Seller.get("/login", sellerPageController.loginPage);

module.exports = Seller;
