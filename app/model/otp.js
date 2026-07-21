const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    otp: {
      type: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: "10m",
    },
  },
  { versionKey: false }
);

const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;
