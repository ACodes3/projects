import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Check for token in the header (format: "Bearer <token>")
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
