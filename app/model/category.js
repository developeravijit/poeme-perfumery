const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    categoryName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

categorySchema.index(
  {
    sellerId: 1,
    categoryName: 1,
  },
  {
    unique: true,
  }
);

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
