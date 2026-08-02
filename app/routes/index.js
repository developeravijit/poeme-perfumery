const express = require("express");
const User = require("./pageRouter/userPage");
const Seller = require("./pageRouter/sellerPage");
const Auth = require("./authRouter");

const router = express.Router();

/* =================================================================== */
// Authentication Router Define
router.use("/api/v1", Auth);
/* =================================================================== */
// User Page Router Define
router.use("/poeme-perfumery", User);
/* =================================================================== */
// Seller Page Router Define
router.use("/poeme-perfumery/seller", Seller);

module.exports = router;
