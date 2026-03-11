import { env } from "./env.js";

// ─── Token Expiry ────────────────────────────────────────────────────
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: "15m",               // 15 minutes
  ACCESS_TOKEN_MS: 15 * 60 * 1000,   // 15 minutes in ms
  REFRESH_TOKEN: "7d",               // 7 days
  REFRESH_TOKEN_S: 7 * 24 * 60 * 60, // 7 days in seconds
  REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  CSRF_TOKEN_S: 7 * 24 * 60 * 60,     // 7 days in seconds (match session TTL)
  CSRF_TOKEN_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  SESSION_S: 7 * 24 * 60 * 60,       // 7 days in seconds
  USER_CACHE_S: 3600,                // 1 hour in seconds
};

// ─── Cookie Options ──────────────────────────────────────────────────
export const COOKIE_OPTIONS = {
  // Base options for all auth cookies
  base: {
    httpOnly: true,
    secure: true,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
  },

  // Access token cookie
  accessToken: {
    httpOnly: true,
    secure: true,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    maxAge: TOKEN_EXPIRY.ACCESS_TOKEN_MS,
  },

  // Refresh token cookie
  refreshToken: {
    httpOnly: true,
    secure: true,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_MS,
  },

  // CSRF token cookie (readable by JavaScript)
  csrfToken: {
    httpOnly: false, 
    secure: true,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    maxAge: TOKEN_EXPIRY.CSRF_TOKEN_MS,
  },

  // Options for clearing cookies
  clear: {
    path: "/",
    secure: true,
    sameSite: env.COOKIE_SAME_SITE,
  },
};

// ─── Rate Limit Config ───────────────────────────────────────────────
export const RATE_LIMIT = {
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // 100 requests per window
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // 20 requests per window
  },
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                    // 5 requests per window
  },
  // Redis-based per-action rate limit (in seconds)
  actionCooldown: 60,          // 60 second cooldown per action
};

// ─── CORS Config ─────────────────────────────────────────────────────
export const CORS_ORIGINS = env.isProduction
  ? [env.FRONTEND_URL].filter(Boolean)
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8081",
      env.FRONTEND_URL,
    ].filter(Boolean);

// ─── Redis Key Prefixes ──────────────────────────────────────────────
export const REDIS_KEYS = {
  refreshToken: (userId) => `refresh_token:${userId}`,
  activeSession: (userId) => `active_session:${userId}`,
  session: (sessionId) => `session:${sessionId}`,
  csrf: (userId) => `csrf:${userId}`,
  userCache: (userId) => `user:${userId}`,
  otp: (email) => `otp:${email}`,
  rateLimit: (action, ip, email) => `${action}-rate-limit:${ip}:${email}`,
  verify: (token) => `verify:${token}`,
  resetPassword: (token) => `reset-password:${token}`,
};
