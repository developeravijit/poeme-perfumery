const express = require("express");
const User = require("./pageRouter/userPage");

const router = express.Router();

/* =================================================================== */

/* =================================================================== */
// User Page Router Define
router.use("/poeme-perfumery", User);

module.exports = router;
