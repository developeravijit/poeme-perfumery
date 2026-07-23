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
  verifySchema,
} = require("../../validation/authValidation");
const bcrypt = require("bcrypt");

class userPageController {
  // Home Page
  async landingPage(req, res) {
    const products = [];
    res.render("landingPage", {
      user: req.user || null,
      products,
      cartCount: 0,
    });
  }

  // Perfume Page
  async perfumes(req, res) {
    const products = [];

    res.render("perfumes", {
      user: req.user || null,
      products,
      filters: {},
      currentPage: 1,
      totalPages: 1,
      cartCount: 0,
    });
  }

  // Register Page
  async registerpage(req, res) {
    res.render("register", {
      user: req.user || null,
      message: req.flash("error"),
      cartCount: 0,
    });
  }

  // Verify Page
  async verifyPage(req, res) {
    res.render("verify", {
      user: null,
      message: req.flash("error"),
    });
  }

  // Login Page
  async loginPage(req, res) {
    res.render("login", {
      user: req.user || null,
      message: req.flash("error"),
      cartCount: 0,
    });
  }

  // Google Login
  async googleLogin(req, res) {
    try {
      if (!req.user) {
        req.flash("error", "Google Authentication Failed");
        return res.redirect("/poeme-perfumery/login");
      }

      const user = req.user;

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect("/poeme-perfumery/home");
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).render("login", {
        success: false,
        message: error.message,
      });
    }
  }

  // Register User
  async register(req, res) {
    try {
      const { error, value } = registerValidation.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).render("error", {
          success: false,
          message: error.details[0].message,
        });
      }

      const { name, phone, email, password, confirmPassword, terms } = value;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        req.flash("error", "Email already exists");
        return res.redirect("/poeme-perfumery/register");
      }

      const roleData = await Role.findOne({ role: "user" });

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

      return res.redirect("/poeme-perfumery/verify");
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

      const user = await User.findOne({ email });

      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/poeme-perfumery/register");
      }

      if (user.isVerified) {
        req.flash("error", "Account already verified");
        return res.redirect("/poeme-perfumery/login");
      }

      const otpData = await Otp.findOne({ userID: user._id });

      if (!otpData) {
        req.flash("error", "OTP expired");
        return res.redirect("/poeme-perfumery/register");
      }

      if (otpData.otp !== otp) {
        req.flash("error", "Invalid OTP");
        return res.redirect("/poeme-perfumery/verify");
      }

      user.isVerified = true;
      await user.save();

      await Otp.deleteOne({ _id: otpData._id });

      delete req.session.email;

      req.flash("success", "Account verified successfully");
      return res.redirect("/poeme-perfumery/login");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Login User
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

      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "Invalid email id");
        return res.redirect("/poeme-perfumery/login");
      }

      if (!user.isVerified) {
        req.flash("error", "Please verify your email first");
        return res.redirect("/poeme-perfumery/verify");
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        req.flash("error", "Invalid Password");
        return res.redirect("/poeme-perfumery/login");
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

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

      return res.redirect("/poeme-perfumery/home");
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Logout User
  async logout(req, res) {
    try {
      if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
          refreshToken: "",
        });
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.redirect("/poeme-perfumery/login");
    } catch (error) {
      console.log(error);

      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Add To Cart Page
  async addToCart(req, res) {
    try {
      const cartItems = [];

      const subtotal = 0;
      const shipping = 0;
      const tax = 0;
      const total = 0;

      res.render("cart", {
        user: req.user || null,
        cartItems,
        subtotal,
        shipping,
        tax,
        total,
        cartCount: 0,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Orders
  async orders(req, res) {
    try {
      const orders = [];

      return res.render("order", {
        orders,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // User Settings
  async settings(req, res) {
    try {
      const user = await User.findById(req.user._id);

      const lastOrder = [];
      const address = [];

      return res.render("settings", {
        user,
        address,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }

  // Contact Page
  async chatSupport(req, res) {
    try {
      return res.render("contactUs", {
        user: req.user,
        cartCount: 0,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("error", {
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new userPageController();
