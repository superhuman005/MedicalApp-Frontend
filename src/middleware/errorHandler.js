const ApiError = require("../utils/ApiError");

// 404 handler for unmatched routes
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};

// Central error-handling middleware. Converts known Mongoose/JWT errors into
// clean ApiError-style responses and hides internal details in production.
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Something went wrong";

    // Mongoose bad ObjectId
    if (error.name === "CastError") {
      statusCode = 400;
      message = `Invalid value for ${error.path}: ${error.value}`;
    }

    // Mongoose duplicate key
    if (error.code === 11000) {
      statusCode = 409;
      const field = Object.keys(error.keyValue || {})[0];
      message = field ? `${field} is already in use` : "Duplicate field value";
    }

    // Mongoose validation error
    if (error.name === "ValidationError") {
      statusCode = 400;
      message = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
    }

    // JWT errors
    if (error.name === "JsonWebTokenError") {
      statusCode = 401;
      message = "Invalid token";
    }
    if (error.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Token expired";
    }

    error = new ApiError(statusCode, message);
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
