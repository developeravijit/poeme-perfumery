const Otp = require("../../model/otp");
const Role = require("../../model/role");
const User = require("../../model/user");
const httpCodes = require("../../utils/httpCodes");
const { otpEmail } = require("../../utils/sendEmail");
const {
  registerValidation,
  loginSchema,
} = require("../../validation/authValidation");

class sellerPageController {
  // Register Page
  async registerPage(req, res) {
    return res.render("seller/register", {
      error: req.flash("error"),
      success: req.flash("success"),
    });
  }

  // Login Page
  async loginPage(req, res) {
    return res.render("seller/login", {
      error: req.flash("error"),
      success: req.flash("success"),
    });
  }

  // Seller Register
  async register(req, res) {
    try {
      const { error, value } = registerValidation.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).render("error", {
          success: false,
          message: error.details[0].message,
        });
      }

      const { name, phone, email, password } = value;

      const existingSeller = await User.findOne({ email });

      if (existingSeller) {
        req.flash("error", "Email already exists");
        return res.redirect("/poeme-perfumery/seller/register");
      }

      const roleData = await Role.findOne({ role: "seller" });

      if (!roleData) {
        return res.status(httpCodes.bad_request).render("error", {
          success: false,
          message: "Invalid role",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const data = new User({
        name,
        phone,
        email,
        password: hashedPassword,
        role: roleData._id,
      });

      await data.save();

      await otpEmail(data);

      req.session.email = email;

      return res.redirect("/poeme-perfumery/seller/verify");
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
        return res.redirect("/poeme-perfumery/verify");
      }

      // Get email from session
      const email = req.session.email;

      if (!email) {
        req.flash("error", "Session expired. Please register again.");
        return res.redirect("/poeme-perfumery/register");
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
        return res.redirect("/poeme-perfumery/verify");
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

  async loginWithOtp(req, res) {
    try {
      const { email } = req.body;

      const seller = await User.findOne({ email });

      if (!seller) {
        req.flash("error", "Invalid email id");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      if (!seller.isVerified) {
        req.flash("error", "Seller is not verified");
        return res.redirect("/poeme-perfumery/seller/verify");
      }

      await Otp.deleteMany({
        userID: seller._id,
      });

      await otpEmail(seller);

      req.session.email = email;
      req.flash("success", "OTP sent successfully");

      return res.redirect("/poeme-perfumery/seller/otpLogin");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  async verifyLogin(req, res) {
    try {
      const { otp } = req.body;

      const seller = await User.findOne({
        email: req.session.email,
      });

      if (!seller) {
        req.flash("error", "Seller not found");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      const otpData = await Otp.findOne({
        userID: seller._id,
      });

      if (!otpData) {
        req.flash("error", "OTP expired");
        return res.redirect("/poeme-perfumery/seller/login");
      }

      if (otpData.otp !== otp) {
        req.flash("error", "Invalid OTP");
        return res.redirect("/poeme-perfumery/seller/login/verify");
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
