const jwt = require("jsonwebtoken");
const User = require("../../model/user");
const { generateAccessToken } = require("../../utils/token");
const { getCookieOptions } = require("../../utils/cookieHelpers");

const AUTH_CONFIG = {
  user: {
    access: "accessToken",
    refresh: "refreshToken",
  },

  seller: {
    access: "sellerAccessToken",
    refresh: "sellerRefreshToken",
  },

  admin: {
    access: "adminAccessToken",
    refresh: "adminRefreshToken",
  },
};

const pageAuth = (loginRoute, allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      /*
       * =====================================================
       * VALIDATE ALLOWED ROLES
       * =====================================================
       */

      if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
        return res.redirect(loginRoute);
      }

      const validRoles = allowedRoles.filter((role) => AUTH_CONFIG[role]);

      if (validRoles.length === 0) {
        return res.redirect(loginRoute);
      }

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
       * CLEAR COOKIES FOR A SPECIFIC ROLE
       * =====================================================
       */

      const clearRoleCookies = (role) => {
        const config = AUTH_CONFIG[role];

        if (!config) {
          return;
        }

        res.clearCookie(config.access, getCookieOptions(req));

        res.clearCookie(config.refresh, getCookieOptions(req));
      };

      /*
       * =====================================================
       * AUTHENTICATE ONE ROLE
       * =====================================================
       */

      const authenticateRole = async (role) => {
        const config = AUTH_CONFIG[role];

        const accessToken = req.cookies[config.access];
        const refreshToken = req.cookies[config.refresh];

        /*
         * No cookies for this role.
         */
        if (!accessToken && !refreshToken) {
          return null;
        }

        /*
         * =================================================
         * ACCESS TOKEN
         * =================================================
         */

        if (accessToken) {
          try {
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id).populate("role");

            if (user && verifyRole(user)) {
              return {
                user,
                role,
              };
            }

            /*
             * Token belongs to wrong role.
             */
            clearRoleCookies(role);

            return null;
          } catch (error) {
            /*
             * Access token can be expired.
             * Continue with refresh token.
             */
          }
        }

        /*
         * =================================================
         * REFRESH TOKEN
         * =================================================
         */

        if (!refreshToken) {
          clearRoleCookies(role);
          return null;
        }

        let decodedRefresh;

        try {
          decodedRefresh = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
          );
        } catch (error) {
          clearRoleCookies(role);
          return null;
        }

        /*
         * =================================================
         * FIND USER
         * =================================================
         */

        const user = await User.findById(decodedRefresh.id).populate("role");

        if (!user) {
          clearRoleCookies(role);
          return null;
        }

        /*
         * =================================================
         * CHECK STORED REFRESH TOKEN
         * =================================================
         */

        if (user.refreshToken !== refreshToken) {
          clearRoleCookies(role);
          return null;
        }

        /*
         * =================================================
         * CHECK USER ROLE
         * =================================================
         */

        if (!verifyRole(user)) {
          clearRoleCookies(role);
          return null;
        }

        /*
         * =================================================
         * CREATE NEW ACCESS TOKEN
         * =================================================
         */

        const newAccessToken = generateAccessToken(user);

        res.cookie(
          config.access,
          newAccessToken,
          getCookieOptions(req, { maxAge: 30 * 60 * 1000 })
        );

        return {
          user,
          role,
        };
      };

      /*
       * =====================================================
       * TRY EACH ALLOWED ROLE
       * =====================================================
       *
       * This is important.
       *
       * If a route allows:
       *
       * ["admin", "seller"]
       *
       * the middleware must be able to authenticate either
       * admin OR seller.
       */

      for (const role of validRoles) {
        const result = await authenticateRole(role);

        if (result) {
          req.user = result.user;
          req.authRole = result.role;

          res.locals.user = result.user;
          res.locals.authRole = result.role;

          return next();
        }
      }

      /*
       * =====================================================
       * NO VALID AUTHENTICATION
       * =====================================================
       */

      return res.redirect(loginRoute);
    } catch (error) {
      console.error("Page authentication error:", error);

      /*
       * Clear only cookies belonging to roles allowed
       * on this route.
       */

      for (const role of allowedRoles) {
        clearRoleCookiesSafe(res, role);
      }

      return res.redirect(loginRoute);
    }
  };
};

/*
 * =========================================================
 * SAFE COOKIE CLEAR HELPER
 * =========================================================
 */

function clearRoleCookiesSafe(res, role) {
  const config = AUTH_CONFIG[role];

  if (!config) {
    return;
  }

  res.clearCookie(config.access, getCookieOptions({ headers: {} }));

  res.clearCookie(config.refresh, getCookieOptions({ headers: {} }));
}

module.exports = pageAuth;
