const jwt = require("jsonwebtoken");
const User = require("../model/user");
const { generateAccessToken } = require("../utils/token");

const AUTH_CONFIG = {
  user: {
    refresh: "refreshToken",
  },

  seller: {
    refresh: "sellerRefreshToken",
  },

  admin: {
    refresh: "adminRefreshToken",
  },
};

const Auth = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      /*
       * =====================================================
       * VALIDATE ALLOWED ROLES
       * =====================================================
       */

      if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const validRoles = allowedRoles.filter((role) => AUTH_CONFIG[role]);

      if (validRoles.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Invalid authentication role",
        });
      }

      /*
       * =====================================================
       * GET ACCESS TOKEN
       * =====================================================
       *
       * Expected:
       *
       * Authorization: Bearer <accessToken>
       *
       */

      const authHeader = req.headers.authorization;

      let accessToken = null;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.split(" ")[1];
      }

      /*
       * =====================================================
       * GET REFRESH TOKEN
       * =====================================================
       *
       * Expected:
       *
       * x-refresh-token: <refreshToken>
       *
       */

      const refreshToken = req.headers["x-refresh-token"];

      /*
       * =====================================================
       * ROLE CHECK
       * =====================================================
       */

      const verifyRole = (user) => {
        if (!user) {
          return false;
        }

        const roleName = user.role?.role || user.role;

        if (!roleName) {
          return false;
        }

        return allowedRoles.includes(roleName);
      };

      /*
       * =====================================================
       * ACCESS TOKEN
       * =====================================================
       */

      if (accessToken) {
        try {
          const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

          const user = await User.findById(decoded.id).populate("role");

          if (!user) {
            return res.status(401).json({
              success: false,
              message: "User not found",
            });
          }

          if (!verifyRole(user)) {
            return res.status(403).json({
              success: false,
              message: "You do not have permission to access this resource",
            });
          }

          req.user = user;
          req.authRole = user.role?.role || user.role;

          return next();
        } catch (error) {
          /*
           * Access token may be expired.
           *
           * Continue to refresh-token authentication.
           */
        }
      }

      /*
       * =====================================================
       * NO REFRESH TOKEN
       * =====================================================
       */

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      /*
       * =====================================================
       * VERIFY REFRESH TOKEN
       * =====================================================
       */

      let decodedRefresh;

      try {
        decodedRefresh = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token",
        });
      }

      /*
       * =====================================================
       * FIND USER
       * =====================================================
       */

      const user = await User.findById(decodedRefresh.id).populate("role");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      /*
       * =====================================================
       * CHECK STORED REFRESH TOKEN
       * =====================================================
       */

      if (user.refreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      /*
       * =====================================================
       * CHECK USER ROLE
       * =====================================================
       */

      if (!verifyRole(user)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource",
        });
      }

      /*
       * =====================================================
       * GENERATE NEW ACCESS TOKEN
       * =====================================================
       */

      const newAccessToken = generateAccessToken(user);

      /*
       * Send new access token to client.
       *
       * Client should replace its old access token
       * with this one.
       */

      res.setHeader("X-Access-Token", newAccessToken);

      /*
       * =====================================================
       * SET REQUEST USER
       * =====================================================
       */

      req.user = user;

      req.authRole = user.role?.role || user.role;

      return next();
    } catch (error) {
      console.error("API authentication error:", error);

      return res.status(500).json({
        success: false,
        message: "Authentication failed",
      });
    }
  };
};

module.exports = Auth;
