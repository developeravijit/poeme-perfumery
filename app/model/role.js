const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "seller", "admin"],
    default: "user",
  },
});

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
