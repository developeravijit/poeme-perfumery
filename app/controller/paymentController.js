const razorpay = require("../config/razorpay");
const Order = require("../model/order");
const Cart = require("../model/cart");
const Product = require("../model/products");
const httpCodes = require("../utils/httpCodes");
const crypto = require("crypto");

class PaymentController {
  // =====================================================
  // CREATE ORDER + RAZORPAY ORDER
  // =====================================================

  async createOrder(req, res) {
    try {
      // ---------------------------------------------------
      // CHECK LOGIN
      // ---------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // ---------------------------------------------------
      // GET SHIPPING ADDRESS FROM EJS
      // ---------------------------------------------------

      const { shippingAddress } = req.body;

      if (!shippingAddress) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Shipping address is required",
        });
      }

      const { name, phone, address, city, state, pincode } = shippingAddress;

      // ---------------------------------------------------
      // VALIDATE REQUIRED ADDRESS FIELDS
      // ---------------------------------------------------

      if (!name || !phone || !address || !city || !state || !pincode) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Please complete all shipping address fields",
        });
      }

      // ---------------------------------------------------
      // CLEAN ADDRESS DATA
      // ---------------------------------------------------

      const cleanAddress = {
        name: String(name).trim(),
        phone: String(phone).trim(),
        address: String(address).trim(),
        city: String(city).trim(),
        state: String(state).trim(),
        pincode: String(pincode).trim(),
      };

      // ---------------------------------------------------
      // VALIDATE PHONE
      // ---------------------------------------------------

      if (!/^[6-9][0-9]{9}$/.test(cleanAddress.phone)) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Please enter a valid 10 digit mobile number",
        });
      }

      // ---------------------------------------------------
      // VALIDATE PINCODE
      // ---------------------------------------------------

      if (!/^[0-9]{6}$/.test(cleanAddress.pincode)) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Please enter a valid 6 digit PIN code",
        });
      }

      // ---------------------------------------------------
      // GET CART ITEMS
      // ---------------------------------------------------

      const cartItems = await Cart.aggregate([
        {
          $match: {
            userId: req.user._id,
          },
        },

        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $project: {
            productId: 1,
            quantity: 1,

            totalPrice: {
              $multiply: ["$quantity", "$product.price"],
            },

            productName: "$product.productName",

            price: "$product.price",

            image: {
              $arrayElemAt: ["$product.images.url", 0],
            },

            stock: "$product.stock",
          },
        },
      ]);

      // ---------------------------------------------------
      // CHECK EMPTY CART
      // ---------------------------------------------------

      if (!cartItems || cartItems.length === 0) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Cart is empty",
        });
      }

      // ---------------------------------------------------
      // CHECK STOCK
      // ---------------------------------------------------

      for (const item of cartItems) {
        if (typeof item.stock === "number" && item.quantity > item.stock) {
          return res.status(httpCodes.bad_request).json({
            success: false,
            message: `${item.productName} does not have enough stock`,
          });
        }
      }

      // ---------------------------------------------------
      // CALCULATE TOTAL
      // ---------------------------------------------------

      const subtotal = cartItems.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
      );

      const shipping = subtotal > 0 ? 100 : 0;

      const tax = subtotal * 0.18;

      const total = Math.round(subtotal + shipping + tax);

      // ---------------------------------------------------
      // PREPARE ORDER ITEMS
      // ---------------------------------------------------

      const items = cartItems.map((item) => ({
        productId: item.productId,

        productName: item.productName,

        price: item.price,

        quantity: item.quantity,

        totalPrice: item.totalPrice,

        image: item.image || "",
      }));

      // ---------------------------------------------------
      // CREATE DATABASE ORDER
      // ---------------------------------------------------

      const order = new Order({
        userId: req.user._id,

        items,

        subtotal,

        shipping,

        tax,

        total,

        // IMPORTANT:
        // Save the customer's actual address
        shippingAddress: cleanAddress,

        paymentMethod: "razorpay",

        paymentStatus: "pending",

        orderStatus: "pending",
      });

      await order.save();

      // ---------------------------------------------------
      // CREATE RAZORPAY ORDER
      // ---------------------------------------------------

      const options = {
        amount: total * 100,

        currency: "INR",

        receipt: order._id.toString(),

        payment_capture: 1,
      };

      const rOrder = await razorpay.orders.create(options);

      // ---------------------------------------------------
      // SAVE RAZORPAY ORDER ID
      // ---------------------------------------------------

      order.razorpayOrderId = rOrder.id;

      await order.save();

      // ---------------------------------------------------
      // SEND RESPONSE TO EJS
      // ---------------------------------------------------

      return res.json({
        success: true,

        key: process.env.RAZERPAY_API_KEY,

        orderId: rOrder.id,

        amount: rOrder.amount,

        currency: rOrder.currency,

        dbOrderId: order._id,
      });
    } catch (error) {
      console.log("CREATE ORDER ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // =====================================================
  // VERIFY RAZORPAY PAYMENT
  // =====================================================

  async verifyPayment(req, res) {
    try {
      // ---------------------------------------------------
      // CHECK LOGIN
      // ---------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        dbOrderId,
      } = req.body;

      // ---------------------------------------------------
      // CHECK PAYMENT DATA
      // ---------------------------------------------------

      if (
        !razorpay_payment_id ||
        !razorpay_order_id ||
        !razorpay_signature ||
        !dbOrderId
      ) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid payment parameters",
        });
      }

      // ---------------------------------------------------
      // GENERATE EXPECTED SIGNATURE
      // ---------------------------------------------------

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZERPAY_API_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      // ---------------------------------------------------
      // VERIFY SIGNATURE
      // ---------------------------------------------------

      if (expectedSignature !== razorpay_signature) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid payment signature",
        });
      }

      // ---------------------------------------------------
      // FIND ORDER
      // ---------------------------------------------------

      const order = await Order.findById(dbOrderId);

      if (!order) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Order not found",
        });
      }

      // ---------------------------------------------------
      // MAKE SURE ORDER BELONGS TO LOGGED-IN USER
      // ---------------------------------------------------

      if (String(order.userId) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to verify this order",
        });
      }

      // ---------------------------------------------------
      // CHECK RAZORPAY ORDER ID
      // ---------------------------------------------------

      if (order.razorpayOrderId !== razorpay_order_id) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Order mismatch",
        });
      }

      // ---------------------------------------------------
      // PREVENT DUPLICATE PAYMENT PROCESSING
      // ---------------------------------------------------

      if (order.paymentStatus === "paid") {
        return res.json({
          success: true,
          message: "Payment already verified",
        });
      }

      // ---------------------------------------------------
      // UPDATE ORDER PAYMENT STATUS
      // ---------------------------------------------------

      order.paymentStatus = "paid";

      order.orderStatus = "confirmed";

      order.razorpayPaymentId = razorpay_payment_id;

      order.razorpaySignature = razorpay_signature;

      await order.save();

      // ---------------------------------------------------
      // REDUCE PRODUCT STOCK
      // ---------------------------------------------------

      for (const item of order.items) {
        try {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: {
              stock: -Math.max(0, item.quantity),
            },
          });
        } catch (error) {
          console.log("STOCK UPDATE ERROR:", error);
        }
      }

      // ---------------------------------------------------
      // CLEAR CUSTOMER CART
      // ---------------------------------------------------

      try {
        await Cart.deleteMany({
          userId: order.userId,
        });
      } catch (error) {
        console.log("CART CLEAR ERROR:", error);
      }

      // ---------------------------------------------------
      // PAYMENT SUCCESS
      // ---------------------------------------------------

      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } catch (error) {
      console.log("VERIFY PAYMENT ERROR:", error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PaymentController();
