const { generateAccessToken } = require("../utils/token");

class authController {
  // New Access Token
  async newAccessToken(req, res) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Refresh token required",
        });
      }

      const refreshToken = authHeader.split(" ")[1];

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const data = await User.findById(decoded.id);

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "User not found",
        });
      }

      if (data.refreshToken !== refreshToken) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid token",
        });
      }

      const newAccessToken = generateAccessToken(data);

      return res.status(httpCodes.created).json({
        success: true,
        message: "New accesstoken created successfully",
        accessToken: newAccessToken,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new authController();
