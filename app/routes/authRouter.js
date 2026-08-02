const express = require("express");
const authController = require("../controller/authController");

const Auth = express.Router();

Auth.post("/new-accessToken", authController.newAccessToken);

module.exports = Auth;
