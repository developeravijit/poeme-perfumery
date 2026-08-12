const isHttpsRequest = (req) => {
  const forwardedProto = req.headers["x-forwarded-proto"];

  return (
    req.secure ||
    req.protocol === "https" ||
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ===
      "https"
  );
};

const getCookieOptions = (req, { maxAge } = {}) => ({
  httpOnly: true,
  secure: isHttpsRequest(req),
  sameSite: "lax",
  path: "/",
  ...(maxAge !== undefined ? { maxAge } : {}),
});

module.exports = {
  isHttpsRequest,
  getCookieOptions,
};
