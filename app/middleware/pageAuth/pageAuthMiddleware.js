const jwt = require("jsonwebtoken");
const User = require("../../model/user");
const { generateAccessToken } = require("../../utils/token");

const pageAuth = (loginRoute) => {
  return async (req, res, next) => {
    try {
      const accessToken = req.cookies.accessToken;
      const refreshToken = req.cookies.refreshToken;

      // 1. Access Token Exists
      if (accessToken) {
        try {
          const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

          const user = await User.findById(decoded.id).populate("role");

          if (user) {
            req.user = user;
            res.locals.user = user;
            return next();
          }
        } catch (err) {
          // Access token expired
        }
      }

      // 2. No Refresh Token -> Logout
      if (!refreshToken) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.redirect(loginRoute);
      }

      let decoded;

      // 3. Verify Refresh Token
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (err) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.redirect(loginRoute);
      }

      // 4. Find User
      const user = await User.findById(decoded.id).populate("role");

      if (!user || user.refreshToken !== refreshToken) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.redirect(loginRoute);
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

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.redirect(loginRoute);
    }
  };
};

module.exports = pageAuth;
