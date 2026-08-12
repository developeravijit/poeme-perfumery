const razorpay = require("../config/razorpay");
const Order = require("../model/order");
const Cart = require("../model/cart");
const Product = require("../model/products");
const httpCodes = require("../utils/httpCodes");
const crypto = require("crypto");

class PaymentController {
  // Create order and Razorpay order
  async createOrder(req, res) {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Authentication required" });
      }

      const cartItems = await Cart.aggregate([
        { $match: { userId: req.user._id } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            productId: 1,
            quantity: 1,
            totalPrice: { $multiply: ["$quantity", "$product.price"] },
            productName: "$product.productName",
            price: "$product.price",
            image: { $arrayElemAt: ["$product.images.url", 0] },
          },
        },
      ]);

      if (!cartItems || cartItems.length === 0) {
        return res
          .status(httpCodes.bad_request)
          .json({ success: false, message: "Cart is empty" });
      }

      const subtotal = cartItems.reduce((s, it) => s + it.totalPrice, 0);
      const shipping = subtotal > 0 ? 100 : 0;
      const tax = subtotal * 0.18;
      const total = Math.round(subtotal + shipping + tax);

      const items = cartItems.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        price: it.price,
        quantity: it.quantity,
        totalPrice: it.totalPrice,
        image: it.image || "",
      }));

      // Minimal shipping address using user info (can be updated later)
      const shippingAddress = {
        name: req.user.name || "",
        phone: req.user.phone || "0000000000",
        address: "N/A",
        city: "N/A",
        state: "N/A",
        pincode: "000000",
      };

      const order = new Order({
        userId: req.user._id,
        items,
        subtotal,
        shipping,
        tax,
        total,
        shippingAddress,
        paymentMethod: "razorpay",
      });

      await order.save();

      // Create Razorpay order
      const options = {
        amount: total * 100, // in paise
        currency: "INR",
        receipt: order._id.toString(),
        payment_capture: 1,
      };

      const rOrder = await razorpay.orders.create(options);

      order.razorpayOrderId = rOrder.id;
      await order.save();

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
      return res
        .status(httpCodes.server_error)
        .json({ success: false, message: error.message });
    }
  }

  // Verify payment signature and finalize order
  async verifyPayment(req, res) {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        dbOrderId,
      } = req.body;

      if (
        !razorpay_payment_id ||
        !razorpay_order_id ||
        !razorpay_signature ||
        !dbOrderId
      ) {
        return res
          .status(httpCodes.bad_request)
          .json({ success: false, message: "Invalid parameters" });
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZERPAY_API_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res
          .status(httpCodes.bad_request)
          .json({ success: false, message: "Invalid signature" });
      }

      const order = await Order.findById(dbOrderId);

      if (!order) {
        return res
          .status(httpCodes.not_found)
          .json({ success: false, message: "Order not found" });
      }

      if (order.razorpayOrderId !== razorpay_order_id) {
        return res
          .status(httpCodes.bad_request)
          .json({ success: false, message: "Order mismatch" });
      }

      order.paymentStatus = "paid";
      order.orderStatus = "confirmed";
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;

      await order.save();

      // Decrease product stock and clear cart
      for (const it of order.items) {
        try {
          await Product.findByIdAndUpdate(it.productId, {
            $inc: { stock: -Math.max(0, it.quantity) },
          });
        } catch (e) {
          console.log("STOCK UPDATE ERROR:", e);
        }
      }

      try {
        await Cart.deleteMany({ userId: order.userId });
      } catch (e) {
        console.log("CART CLEAR ERROR:", e);
      }

      return res.json({ success: true, message: "Payment verified" });
    } catch (error) {
      console.log("VERIFY PAYMENT ERROR:", error);
      return res
        .status(httpCodes.server_error)
        .json({ success: false, message: error.message });
    }
  }
}

module.exports = new PaymentController();
