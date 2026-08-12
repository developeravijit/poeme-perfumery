const faqResponses = [
  {
    keywords: ["hello", "hi", "hey", "good morning", "good evening"],
    reply:
      "Hello! I’m POÈME Assistant. I can help with perfumes, orders, shipping, and support questions.",
  },
  {
    keywords: ["shipping", "delivery", "arrive", "when will my order"],
    reply:
      "Shipping usually takes 3–5 business days. If you need faster help, please contact our support team.",
  },
  {
    keywords: ["return", "refund", "exchange"],
    reply:
      "Returns and exchanges are available within 7 days if the product is unused and sealed.",
  },
  {
    keywords: ["perfume", "fragrance", "recommend", "scent"],
    reply:
      "We offer floral, woody, citrus, and luxury signature fragrances. Tell me your mood and I’ll suggest a few.",
  },
  {
    keywords: ["contact", "support", "help"],
    reply:
      "You can contact our support team through the Contact Us page or use this chat for quick questions.",
  },
];

const getBotReply = (message = "") => {
  if (!message || typeof message !== "string") {
    return "How can I help you today?";
  }

  const normalized = message.toLowerCase();

  for (const item of faqResponses) {
    if (item.keywords.some((keyword) => normalized.includes(keyword))) {
      return item.reply;
    }
  }

  return "I can help with perfumes, orders, shipping, and support. If you need specific assistance, please contact our team.";
};

module.exports = {
  getBotReply,
};
