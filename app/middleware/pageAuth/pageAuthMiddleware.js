const jwt = require("jsonwebtoken");
const User = require("../../model/user");
const { generateAccessToken } = require("../../utils/token");

const pageAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (user) {
          req.user = user;
          res.locals.user = user;
          return next();
        }
      } catch (err) {}
    }

    if (!refreshToken) {
      req.user = null;
      res.locals.user = null;
      return next();
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).populate("role");

    if (!user || user.refreshToken !== refreshToken) {
      req.user = null;
      res.locals.user = null;
      return next();
    }

    // 3. Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 60 * 1000,
    });

    req.user = user;
    res.locals.user = user;

    next();
  } catch (err) {
    req.user = null;
    res.locals.user = null;
    next();
  }
};

module.exports = pageAuth;
