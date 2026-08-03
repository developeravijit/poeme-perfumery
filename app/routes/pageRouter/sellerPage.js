const express = require("express");
const sellerPageController = require("../../controller/pageController/sellerPageController");
const pageAuth = require("../../middleware/pageAuth/pageAuthMiddleware");
const uploadFile = require("../../middleware/cloudinaryMiddleware");
const csvUpload = require("../../middleware/csvUpload");

const Seller = express.Router();
const sellerAuth = pageAuth("/poeme-perfumery/seller/login", ["seller"]);

const uploadImages = (req, res, next) => {
  uploadFile.any()(req, res, (err) => {
    if (err) {
      console.error("Image upload middleware error:", err);
      req.flash("error", err.message);
      return res.redirect("/poeme-perfumery/seller/upload-image");
    }
    next();
  });
};

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
Seller.get("/logout", sellerAuth, sellerPageController.logout);

// Dashboard
Seller.get("/dashboard", sellerAuth, sellerPageController.dashboard);

Seller.get("/chat", sellerAuth, sellerPageController.chatSupport);

Seller.get("/categories", sellerAuth, sellerPageController.categories);

Seller.get(
  "/create/category",
  sellerAuth,
  sellerPageController.createCategoryPage
);

Seller.post(
  "/create/category",
  sellerAuth,
  sellerPageController.createCategory
);

Seller.get("/products", sellerAuth, sellerPageController.products);

Seller.get(
  "/create/product",
  sellerAuth,
  sellerPageController.createProductPage
);

Seller.post(
  "/create/product",
  sellerAuth,
  uploadFile.array("images", 5),
  sellerPageController.createProduct
);

Seller.get(
  "/product/increase-stock/:id",
  sellerAuth,
  sellerPageController.increaseStock
);

Seller.get(
  "/product/decrease-stock/:id",
  sellerAuth,
  sellerPageController.decreaseStock
);

Seller.get(
  "/product/out-of-stock/:id",
  sellerAuth,
  sellerPageController.outOfStock
);

Seller.get("/bulk-upload", sellerAuth, sellerPageController.bulkUploadPage);

Seller.post(
  "/bulk-upload",
  sellerAuth,
  csvUpload.single("csv"),
  sellerPageController.bulkUpload
);

Seller.get(
  "/download-template",
  sellerAuth,
  sellerPageController.downloadTemplate
);

Seller.get("/upload-image", sellerAuth, sellerPageController.uploadImagePage);

Seller.post(
  "/upload-image",
  sellerAuth,
  uploadImages,
  sellerPageController.uploadImage
);

Seller.get("/image-library", sellerAuth, sellerPageController.imageLibrary);

Seller.post("/delete-image/:id", sellerAuth, sellerPageController.deleteImage);

Seller.get(
  "/edit-product/:id",
  sellerAuth,
  sellerPageController.editPorductPage
);

Seller.post("/edit-product/:id", sellerAuth, sellerPageController.editProduct);

Seller.get(
  "/deleted-products",
  sellerAuth,
  sellerPageController.deletedProductsPage
);

Seller.post(
  "/delete-product/:id",
  sellerAuth,
  sellerPageController.deleteProduct
);

Seller.post(
  "/restore-product/:id",
  sellerAuth,
  sellerPageController.restoreProduct
);

module.exports = Seller;
