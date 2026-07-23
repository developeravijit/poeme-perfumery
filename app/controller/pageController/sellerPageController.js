const Otp = require("../../model/otp");
const Role = require("../../model/role");
const User = require("../../model/user");
const httpCodes = require("../../utils/httpCodes");
const { otpEmail } = require("../../utils/sendEmail");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/token");
const {
  registerValidation,
  loginSchema,
} = require("../../validation/authValidation");
const bcrypt = require("bcrypt");

class sellerPageController {
  // Register Page
  async registerPage(req, res) {
    return res.render("seller/register", {
      error: req.flash("error"),
      success: req.flash("success"),
    });
  }

  // Verify Page
  async verifyPage(req, res) {
    return res.render("seller/verify", {
      error: req.flash("error"),
      success: req.flash("success"),
    });
  }

  // Login Page
  async loginPage(req, res) {
    const showOtp = req.session.showOtp || false;

    return res.render("seller/login", {
      error: req.flash("error"),
      success: req.flash("success"),
      email: req.session.email || "",
      showOtp,
    });
  }

  // Seller Register
  async register(req, res) {
    try {
      const { error, value } = registerValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);
        return res.redirect("/poeme-perfumery/seller/register");
      }

      const { name, phone, email, password } = value;

      // Check existing seller
      const existingSeller = await User.findOne({ email });

      if (existingSeller) {
        if (existingSeller.isVerified) {
          req.flash("error", "Account already exists. Please login.");
          return res.redirect("/poeme-perfumery/seller/login");
        }

        await Otp.deleteMany({
          userID: existingSeller._id,
        });

        await otpEmail(existingSeller);

        req.session.email = existingSeller.email;

        req.flash(
          "success",
          "Your account already exists but is not verified. A new OTP has been sent."
        );

        return req.session.save((err) => {
          if (err) {
            console.error(err);
            req.flash("error", "Session error");
            return res.redirect("/poeme-perfumery/seller/register");
          }

          return res.redirect("/poeme-perfumery/seller/verify");
        });
      }
      console.log("All Roles:", await Role.find());

      let roleData = await Role.findOne({
        role: "seller",
      });

      if (!roleData) {
        roleData = await Role.create({
          role: "seller",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const seller = new User({
        name,
        phone,
        email,
        password: hashedPassword,
        role: roleData._id,
      });

      await seller.save();

      await otpEmail(seller);

      req.session.email = seller.email;

      req.flash(
        "success",
        "Registration successful. Please verify your email."
      );

      return req.session.save((err) => {
        if (err) {
          console.error(err);
          req.flash("error", "Session error");
          return res.redirect("/poeme-perfumery/seller/register");
        }

        return res.redirect("/poeme-perfumery/seller/verify");
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Verify User
  async verify(req, res) {
    try {
      const { otp } = req.body;

      if (!otp) {
        req.flash("error", "OTP is required");
        return res.redirect("/poeme-perfumery/seller/verify");
      }

      // Get email from session
      const email = req.session.email;

      if (!email) {
        req.flash("error", "Session expired. Please register again.");
        return res.redirect("/poeme-perfumery/seller/register");
      }

      const seller = await User.findOne({ email });

      if (!seller) {
        req.flash("error", "User not found");
        return res.redirect("/poeme-perfumery/seller/register");
      }

      if (seller.isVerified) {
        req.flash("error", "Account already verified");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      const otpData = await Otp.findOne({ userID: seller._id });

      if (!otpData) {
        req.flash("error", "OTP expired");
        return res.redirect("/poeme-perfumery/seller/register");
      }

      if (otpData.otp !== otp) {
        req.flash("error", "Invalid OTP");
        return res.redirect("/poeme-perfumery/seller/verify");
      }

      seller.isVerified = true;
      await seller.save();

      await Otp.deleteOne({ _id: otpData._id });

      delete req.session.email;

      req.flash("success", "Account verified successfully");
      return res.redirect("/poeme-perfumery/seller/login");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Seller Login
  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).render("error", {
          success: false,
          message: error.details[0].message,
        });
      }
      const { email, password } = value;
      const remember = req.body.remember;

      const seller = await User.findOne({ email });
      if (!seller) {
        req.flash("error", "Invalid email id");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      if (!seller.isVerified) {
        req.flash("error", "Please verify your email first");
        return res.redirect("/poeme-perfumery/seller/verify");
      }

      const isMatch = await bcrypt.compare(password, seller.password);

      if (!isMatch) {
        req.flash("error", "Invalid Password");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      const accessToken = generateAccessToken(seller);
      const refreshToken = generateRefreshToken(seller);

      seller.refreshToken = refreshToken;
      await seller.save();

      const rememberMe = remember === "on";

      const accessMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 30 * 60 * 1000;

      const refreshMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: accessMaxAge,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: refreshMaxAge,
      });

      return res.redirect("/poeme-perfumery/seller/home");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Send Login OTP
  async loginWithOtp(req, res) {
    try {
      const { email } = req.body;

      const seller = await User.findOne({ email });

      if (!seller) {
        req.flash("error", "Invalid email id");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      if (!seller.isVerified) {
        req.flash("error", "Please verify your account first");
        return res.redirect("/poeme-perfumery/seller/verify");
      }

      await Otp.deleteMany({
        userID: seller._id,
      });

      await otpEmail(seller);

      req.session.email = email;
      req.session.showOtp = true;

      return req.session.save((err) => {
        if (err) {
          console.error(err);
          req.flash("error", "Something went wrong");
          return res.redirect("/poeme-perfumery/seller/login");
        }

        return res.redirect("/poeme-perfumery/seller/login");
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Verify Login
  async verifyLogin(req, res) {
    try {
      const { otp } = req.body;

      if (!otp) {
        req.session.showOtp = true;

        req.flash("error", "OTP is required");

        return res.redirect("/poeme-perfumery/seller/login");
      }

      const seller = await User.findOne({
        email: req.session.email,
      });

      if (!seller) {
        delete req.session.showOtp;
        delete req.session.email;

        req.flash("error", "Seller not found");

        return res.redirect("/poeme-perfumery/seller/login");
      }

      const otpData = await Otp.findOne({
        userID: seller._id,
      });

      if (!otpData) {
        req.session.showOtp = true;

        req.flash("error", "OTP expired");

        return res.redirect("/poeme-perfumery/seller/login");
      }

      if (otpData.otp !== otp) {
        req.session.showOtp = true;

        req.flash("error", "Invalid OTP");

        return res.redirect("/poeme-perfumery/seller/login");
      }

      await Otp.deleteOne({
        _id: otpData._id,
      });

      const accessToken = generateAccessToken(seller);
      const refreshToken = generateRefreshToken(seller);

      seller.refreshToken = refreshToken;

      await seller.save();

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      delete req.session.showOtp;
      delete req.session.email;

      return res.redirect("/poeme-perfumery/seller/home");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new sellerPageController();
