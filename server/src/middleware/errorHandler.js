import { env } from "../config/env.js";
import { sanitizeErrorMessage, sanitizeString, createSafeErrorResponse } from "../utils/sanitization.js";
import { logAuditEvent, AuditEventType } from "../services/auditLogger.js";

/**
 * Centralized error handler middleware.
 * Must be registered LAST (after all routes).
 */
export const errorHandler = (err, req, res, _next) => {
  // Log full error securely (no sensitive data)
  console.error("❌ Unhandled Error:", {
    message: sanitizeString(err.message),
    stack: env.isProduction ? undefined : err.stack?.split("\n").slice(0, 5).join("\n"),
    code: err.code,
    statusCode: err.statusCode,
  });

  // Audit log critical errors
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    logAuditEvent(AuditEventType.SUSPICIOUS_ACTIVITY, {
      user: req.user,
      req,
      metadata: { errorMessage: sanitizeString(err.message), statusCode },
      severity: "error",
    });
  }

  // Handle specific error types
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "File too large.",
      code: "FILE_TOO_LARGE",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token.",
      code: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired.",
      code: "TOKEN_EXPIRED",
    });
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS policy violation.",
      code: "CORS_ERROR",
    });
  }

  // Default error response - sanitized
  const message = env.isProduction
    ? "Internal server error"
    : sanitizeString(err.message) || "Internal server error";

  res.status(statusCode).json({
    message,
    code: err.code || "INTERNAL_ERROR",
    ...(env.isProduction ? {} : { stack: err.stack?.split("\n").slice(0, 10).join("\n") }),
  });
};

/**
 * 404 handler — must be registered after all routes, before errorHandler.
 */
export const notFoundHandler = (_req, res) => {
  res.status(404).json({
    message: "Not found",
    code: "NOT_FOUND",
  });
};
