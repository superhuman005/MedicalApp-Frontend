const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/User");

// Verifies the JWT (from Authorization header or cookie) and attaches req.user
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, "Not authorized. Please log in.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "The user belonging to this token no longer exists.");
  }
  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated.");
  }

  req.user = user;
  next();
});

// Restricts a route to specific roles, e.g. restrictTo("doctor", "admin")
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action.");
    }
    next();
  };
};

module.exports = { protect, restrictTo };
