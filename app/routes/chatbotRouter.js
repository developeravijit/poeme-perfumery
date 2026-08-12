const express = require("express");
const router = express.Router();

const allowedTopics = [
  "poeme",
  "poème",
  "perfume",
  "perfumes",
  "fragrance",
  "fragrances",
  "scent",
  "cologne",
  "eau de parfum",
  "eau de toilette",
  "body mist",
  "gift",
  "gift set",
  "product",
  "products",
  "collection",
  "brand",
  "category",
  "price",
  "cost",
  "stock",
  "available",
  "availability",
  "new arrival",
  "wishlist",
  "cart",
  "checkout",
  "buy",
  "purchase",
  "order",
  "orders",
  "track",
  "tracking",
  "delivery",
  "shipping",
  "return",
  "refund",
  "exchange",
  "payment",
  "coupon",
  "discount",
  "offer",
  "login",
  "register",
  "account",
  "contact",
  "support",
  "customer care",
  "website",
];

router.post("/chatbot", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "Please enter a question.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        reply: "Gemini API Key not found.",
      });
    }

    const question = message.toLowerCase();

    const isRelated = allowedTopics.some((keyword) =>
      question.includes(keyword)
    );

    if (!isRelated) {
      return res.json({
        reply:
          "I'm POÈME AI Assistant. I can only answer questions related to POÈME Perfumery, including our perfumes, products, orders, shipping, returns, payments, and website.",
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are POÈME AI Assistant.

You are the customer support assistant for POÈME Perfumery.

Rules:

1. ONLY answer questions related to POÈME Perfumery.

2. Topics you may answer:
- Perfumes
- Fragrances
- Products
- Categories
- Orders
- Shipping
- Delivery
- Returns
- Refunds
- Payments
- Discounts
- Coupons
- Wishlist
- Cart
- Checkout
- Website navigation
- Customer support

3. If the question is unrelated to POÈME Perfumery, reply ONLY with:

"I'm POÈME AI Assistant. I can only answer questions related to POÈME Perfumery."

4. Keep replies under 120 words.

Customer Question:

${message}
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("STATUS:", response.status);
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        reply: data.error?.message || "Unable to contact AI Assistant.",
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    return res.json({
      reply,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      reply: "Something went wrong.",
    });
  }
});

module.exports = router;
