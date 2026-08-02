const mongoose = require("mongoose");

const imageLibrarySchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    imageCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      default: 0,
    },

    format: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


imageLibrarySchema.index(
  {
    sellerId: 1,
    imageCode: 1,
  },
  {
    unique: true,
  }
);

const ImageLibrary = mongoose.model("ImageLibrary", imageLibrarySchema);

module.exports = ImageLibrary;
