const { verifyToken } = require("../services/authService");

function checkAuthorization(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.substring("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Missing token",
    });
  }

  try {
    const payload = verifyToken(token);
    req.authUser = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
}

module.exports = {
  checkAuthorization,
};
