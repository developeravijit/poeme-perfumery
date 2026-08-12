const express = require("express");
const User = require("./pageRouter/userPage");
const Seller = require("./pageRouter/sellerPage");
const Auth = require("./authRouter");
const Chatbot = require("./chatbotRouter");
const Admin = require("./pageRouter/adminPage");
const Payment = require("./paymentRouter");

const router = express.Router();

/* =================================================================== */
// Authentication Router Define
router.use("/api/v1", Auth);
/* =================================================================== */
// AI Chatbot Router Define
router.use("/api", Chatbot);
/* =================================================================== */
// User Page Router Define
router.use("/poeme-perfumery", User);
/* =================================================================== */
// Seller Page Router Define
router.use("/poeme-perfumery/seller", Seller);
/* =================================================================== */
// Admin Page Router Define
router.use("/poeme-perfumery/admin", Admin);

// Payment API
router.use("/api/v1/payment", Payment);

module.exports = router;
