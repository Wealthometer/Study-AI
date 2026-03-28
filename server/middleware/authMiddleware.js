const { verifyToken } = require("../config/jwt");

function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. Token missing." });
    }
    const token   = header.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid or expired. Please log in again." });
  }
}

module.exports = { protect };
