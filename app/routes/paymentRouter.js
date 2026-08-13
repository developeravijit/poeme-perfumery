const express = require("express");

const paymentController = require("../controller/paymentController");
const optionalAuth = require("../middleware/pageAuth/optionalAuth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payment
 *     description: Razorpay payment APIs
 */

// Create Order
/**
 * @swagger
 * /api/v1/payment/create-order:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Create Razorpay order
 *     description: Creates a database order and Razorpay order using the logged-in user's cart and shipping address.
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - name
 *                   - phone
 *                   - address
 *                   - city
 *                   - state
 *                   - pincode
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Customer's full name.
 *                     example: Avijit Roy
 *
 *                   phone:
 *                     type: string
 *                     description: Customer's 10 digit Indian mobile number.
 *                     example: "9876543210"
 *
 *                   address:
 *                     type: string
 *                     description: Complete delivery address.
 *                     example: 123 Main Road
 *
 *                   city:
 *                     type: string
 *                     description: City.
 *                     example: Kolkata
 *
 *                   state:
 *                     type: string
 *                     description: State.
 *                     example: West Bengal
 *
 *                   pincode:
 *                     type: string
 *                     description: 6 digit PIN code.
 *                     example: "700001"
 *
 *     responses:
 *       200:
 *         description: Razorpay order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 key:
 *                   type: string
 *                   description: Razorpay API key.
 *                   example: rzp_test_xxxxxxxxx
 *                 orderId:
 *                   type: string
 *                   description: Razorpay order ID.
 *                   example: order_ABC123456
 *                 amount:
 *                   type: integer
 *                   description: Order amount in paise.
 *                   example: 177000
 *                 currency:
 *                   type: string
 *                   example: INR
 *                 dbOrderId:
 *                   type: string
 *                   description: MongoDB order ID.
 *                   example: 64f123456789abcdef123456
 *
 *       400:
 *         description: Invalid request, missing address, empty cart, or insufficient stock.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Shipping address is required
 *
 *       401:
 *         description: Authentication required.
 *
 *       500:
 *         description: Server error while creating the order.
 */
router.post("/create-order", optionalAuth, paymentController.createOrder);

// Verify Payment
/**
 * @swagger
 * /api/v1/payment/verify-payment:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Verify Razorpay payment
 *     description: Verifies the Razorpay payment signature and updates the order as paid.
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_payment_id
 *               - razorpay_order_id
 *               - razorpay_signature
 *               - dbOrderId
 *             properties:
 *               razorpay_payment_id:
 *                 type: string
 *                 description: Razorpay payment ID.
 *                 example: pay_ABC123456
 *
 *               razorpay_order_id:
 *                 type: string
 *                 description: Razorpay order ID returned when creating the order.
 *                 example: order_ABC123456
 *
 *               razorpay_signature:
 *                 type: string
 *                 description: Razorpay payment signature.
 *                 example: 9f8c7d6e5b4a3210abcdef123456789
 *
 *               dbOrderId:
 *                 type: string
 *                 description: MongoDB order ID returned by the create-order API.
 *                 example: 64f123456789abcdef123456
 *
 *     responses:
 *       200:
 *         description: Payment verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment verified successfully
 *
 *       400:
 *         description: Invalid payment parameters, signature, or order mismatch.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid payment parameters
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: The order does not belong to the logged-in user.
 *
 *       404:
 *         description: Order not found.
 *
 *       500:
 *         description: Server error while verifying payment.
 */
router.post("/verify-payment", optionalAuth, paymentController.verifyPayment);

module.exports = router;
