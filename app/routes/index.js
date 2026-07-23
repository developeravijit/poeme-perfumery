const express = require("express");
const User = require("./pageRouter/userPage");
const Seller = require("./pageRouter/sellerPage");

const router = express.Router();

/* =================================================================== */

/* =================================================================== */
// User Page Router Define
router.use("/poeme-perfumery", User);
/* =================================================================== */
// Seller Page Router Define
router.use("/poeme-perfumery/seller", Seller);

module.exports = router;
