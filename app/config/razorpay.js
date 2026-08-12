const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZERPAY_API_KEY,
  key_secret: process.env.RAZERPAY_API_SECRET,
});

module.exports = razorpay;
