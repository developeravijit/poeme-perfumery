const express = require("express");

const paymentController = require("../controller/paymentController");
const optionalAuth = require("../middleware/pageAuth/optionalAuth");

const router = express.Router();

router.post("/create-order", optionalAuth, paymentController.createOrder);
router.post("/verify-payment", optionalAuth, paymentController.verifyPayment);

module.exports = router;
