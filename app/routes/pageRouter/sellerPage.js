const express = require("express");
const sellerPageController = require("../../controller/pageController/sellerPageController");
const pageAuth = require("../../middleware/pageAuth/pageAuthMiddleware");
const uploadFile = require("../../middleware/cloudinaryMiddleware");
const csvUpload = require("../../middleware/csvUpload");

const Seller = express.Router();

// Register
Seller.get("/register", sellerPageController.registerPage);
Seller.post("/register", sellerPageController.register);

// Verify Seller
Seller.get("/verify", sellerPageController.verifyPage);
Seller.post("/verify", sellerPageController.verify);

// Login
Seller.get("/login", sellerPageController.loginPage);
Seller.post("/login", sellerPageController.login);

// Login With OTP
Seller.post("/login-otp", sellerPageController.loginWithOtp);
Seller.post("/verify-login", sellerPageController.verifyLogin);

// Logout
Seller.get(
  "/logout",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.logout
);

// Dashboard
Seller.get(
  "/dashboard",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.dashboard
);

Seller.get(
  "/categories",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.categories
);

Seller.get(
  "/create/category",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.createCategoryPage
);

Seller.post(
  "/create/category",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.createCategory
);

Seller.get(
  "/products",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.products
);

Seller.get(
  "/create/product",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.createProductPage
);

Seller.post(
  "/create/product",
  pageAuth("/poeme-perfumery/seller/login"),
  uploadFile.array("images", 5),
  sellerPageController.createProduct
);

Seller.get(
  "/product/increase-stock/:id",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.increaseStock
);

Seller.get(
  "/product/decrease-stock/:id",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.decreaseStock
);

Seller.get(
  "/product/out-of-stock/:id",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.outOfStock
);

Seller.get(
  "/bulk-upload",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.bulkUploadPage
);

Seller.post(
  "/bulk-upload",
  pageAuth("/poeme-perfumery/seller/login"),
  csvUpload.single("csv"),
  sellerPageController.bulkUpload
);

Seller.get(
  "/download-template",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.downloadTemplate
);

Seller.get(
  "/upload-image",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.uploadImagePage
);

Seller.post(
  "/upload-image",
  pageAuth("/poeme-perfumery/seller/login"),
  uploadFile.array("images", 5),
  sellerPageController.uploadImage
);

Seller.get(
  "/image-library",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.imageLibrary
);

Seller.post(
  "/delete-image",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.deleteImage
);

Seller.get(
  "/edit-product/:id",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.editPorductPage
);

Seller.post(
  "/edit-product/:id",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.editProduct
);

Seller.get(
  "/deleted-products",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.deletedProductsPage
);

Seller.post(
  "/delete-product/:id",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.deleteProduct
);

Seller.post(
  "/restore-product/:id",
  pageAuth("/poeme-perfumery/seller/login"),
  sellerPageController.restoreProduct
);

module.exports = Seller;
