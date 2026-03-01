import rateLimit from "express-rate-limit";
import { RATE_LIMIT } from "../config/security.js";

// ─── Global Rate Limiter ─────────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT.global.windowMs,
  max: RATE_LIMIT.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  keyGenerator: (req) => req.ip,
});

// ─── Auth Route Rate Limiter ─────────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.auth.windowMs,
  max: RATE_LIMIT.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts, please try again later.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  keyGenerator: (req) => req.ip,
});

// ─── Strict Rate Limiter (Password Reset, etc.) ─────────────────────
export const strictLimiter = rateLimit({
  windowMs: RATE_LIMIT.strict.windowMs,
  max: RATE_LIMIT.strict.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many attempts, please try again later.",
    code: "STRICT_RATE_LIMIT_EXCEEDED",
  },
  keyGenerator: (req) => req.ip,
});
