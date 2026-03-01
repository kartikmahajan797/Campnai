import crypto from "crypto";
import { redisClient } from "./redis.js";
import { TOKEN_EXPIRY, COOKIE_OPTIONS, REDIS_KEYS } from "./security.js";

// ─── Generate CSRF Token ────────────────────────────────────────────
export const generateCSRFToken = async (userId, res) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  const csrfKey = REDIS_KEYS.csrf(userId);

  await redisClient.setEx(csrfKey, TOKEN_EXPIRY.CSRF_TOKEN_S, csrfToken);

  res.cookie("csrfToken", csrfToken, COOKIE_OPTIONS.csrfToken);

  return csrfToken;
};

// ─── Verify CSRF Token Middleware ───────────────────────────────────
export const verifyCSRFToken = async (req, res, next) => {
  try {
    // Skip CSRF for GET requests (safe/idempotent)
    if (req.method === "GET") {
      return next();
    }

    const userId = req.user?._id || req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        code: "AUTH_REQUIRED",
      });
    }

    // Read CSRF token from header
    const clientToken =
      req.headers["x-csrf-token"] ||
      req.headers["x-xsrf-token"] ||
      req.headers["csrf-token"];

    if (!clientToken) {
      return res.status(403).json({
        message: "CSRF Token missing. Please refresh the page.",
        code: "CSRF_TOKEN_MISSING",
      });
    }

    const csrfKey = REDIS_KEYS.csrf(userId);
    const storedToken = await redisClient.get(csrfKey);

    if (!storedToken) {
      return res.status(403).json({
        message: "CSRF Token expired. Please try again.",
        code: "CSRF_TOKEN_EXPIRED",
      });
    }

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(storedToken, "utf-8"),
      Buffer.from(clientToken, "utf-8")
    )) {
      return res.status(403).json({
        message: "Invalid CSRF Token. Please refresh the page.",
        code: "CSRF_TOKEN_INVALID",
      });
    }

    next();
  } catch (error) {
    console.error("CSRF verification error:", error.message);
    return res.status(500).json({
      message: "CSRF verification failed.",
      code: "CSRF_VERIFICATION_ERROR",
    });
  }
};

// ─── Revoke CSRF Token ──────────────────────────────────────────────
export const revokeCSRFToken = async (userId) => {
  const csrfKey = REDIS_KEYS.csrf(userId);
  await redisClient.del(csrfKey);
};

// ─── Refresh CSRF Token ─────────────────────────────────────────────
export const refreshCSRFToken = async (userId, res) => {
  await revokeCSRFToken(userId);
  return await generateCSRFToken(userId, res);
};
