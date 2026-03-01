import jwt from "jsonwebtoken";
import { firebaseAdmin } from "../core/config.js";
import { redisClient } from "../config/redis.js";
import { isSessionActive } from "../config/tokenService.js";
import { env } from "../config/env.js";
import { COOKIE_OPTIONS, REDIS_KEYS, TOKEN_EXPIRY } from "../config/security.js";

/**
 * Dual-auth middleware: supports BOTH JWT cookie auth AND Firebase Bearer auth.
 *
 * Priority:
 *   1. JWT accessToken cookie → verify JWT, check Redis session
 *   2. Authorization: Bearer <token> → Firebase ID token verification
 *
 * This ensures full backward compatibility with the existing frontend
 * while enabling the new cookie-based JWT auth system.
 */
export async function authenticate(req, res, next) {
  // ── Strategy 1: JWT Cookie Auth ────────────────────────────────────
  const accessToken = req.cookies?.accessToken;

  if (accessToken) {
    try {
      const decodedData = jwt.verify(accessToken, env.JWT_SECRET);

      if (!decodedData) {
        return res.status(401).json({
          message: "Token expired",
          code: "TOKEN_EXPIRED",
        });
      }

      // Verify session is still active in Redis
      const sessionActive = await isSessionActive(
        decodedData.id,
        decodedData.sessionId
      );

      if (!sessionActive) {
        // Clear all auth cookies
        res.clearCookie("refreshToken", COOKIE_OPTIONS.clear);
        res.clearCookie("accessToken", COOKIE_OPTIONS.clear);
        res.clearCookie("csrfToken", COOKIE_OPTIONS.clear);

        return res.status(401).json({
          message: "Session expired. You have been logged in from another device.",
          code: "SESSION_EXPIRED",
        });
      }

      // Check Redis user cache first
      const cacheUser = await redisClient.get(REDIS_KEYS.userCache(decodedData.id));

      if (cacheUser) {
        req.user = JSON.parse(cacheUser);
        // Ensure uid is always set for downstream routes
        if (!req.user.uid) req.user.uid = req.user._id || decodedData.id;
        req.sessionId = decodedData.sessionId;
        return next();
      }

      // If no cache, set minimal user info from token
      // The auth controller will cache full user data on login
      req.user = { _id: decodedData.id, uid: decodedData.id };
      req.sessionId = decodedData.sessionId;
      return next();
    } catch (err) {
      // JWT verification failed — clear cookies and try Firebase
      if (err.name === "TokenExpiredError") {
        // Don't clear cookies here; let the refresh flow handle it
        return res.status(401).json({
          message: "Access token expired. Please refresh.",
          code: "ACCESS_TOKEN_EXPIRED",
        });
      }

      // Invalid JWT — clear cookies
      res.clearCookie("accessToken", COOKIE_OPTIONS.clear);
    }
  }

  // ── Strategy 2: Firebase Bearer Token Auth ─────────────────────────
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];

    try {
      const decoded = await firebaseAdmin.auth().verifyIdToken(token);
      req.user = decoded;
      return next();
    } catch (err) {
      console.error("Authentication Error:", err.message);

      const code = err.code || "";

      if (code === "auth/id-token-expired") {
        return res.status(401).json({
          message: "Token has expired. Please sign in again.",
          code: "FIREBASE_TOKEN_EXPIRED",
        });
      }
      if (code === "auth/id-token-revoked") {
        return res.status(401).json({
          message: "Token has been revoked. Please sign in again.",
          code: "FIREBASE_TOKEN_REVOKED",
        });
      }
      if (code === "auth/argument-error" || code === "auth/invalid-id-token") {
        return res.status(401).json({
          message: "Invalid authentication token.",
          code: "FIREBASE_TOKEN_INVALID",
        });
      }

      return res.status(401).json({
        message: "Authentication failed.",
        code: "AUTH_FAILED",
      });
    }
  }

  // ── No Auth Provided ──────────────────────────────────────────────
  return res.status(401).json({
    message: "Authentication required. Please login.",
    code: "NO_AUTH",
  });
}