const jwt = require("jsonwebtoken");
const User = require("../../model/user");
const { generateAccessToken } = require("../../utils/token");

const optionalAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // Default guest user
    req.user = null;
    res.locals.user = null;

    // 1. Verify Access Token
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).populate("role");

        if (user) {
          req.user = user;
          res.locals.user = user;
        }

        return next();
      } catch (err) {
        // Access token expired or invalid
      }
    }

    // 2. No Refresh Token -> Continue as Guest
    if (!refreshToken) {
      return next();
    }

    // 3. Verify Refresh Token
    let decoded;

    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return next();
    }

    // 4. Find User
    const user = await User.findById(decoded.id).populate("role");

    if (!user || user.refreshToken !== refreshToken) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return next();
    }

    // 5. Generate New Access Token
    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000,
    });

    req.user = user;
    res.locals.user = user;

    return next();
  } catch (err) {
    console.log(err);

    req.user = null;
    res.locals.user = null;

    return next();
  }
};

module.exports = optionalAuth;
