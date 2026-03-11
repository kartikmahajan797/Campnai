import jwt from "jsonwebtoken";
import crypto from "crypto";
import { redisClient } from "./redis.js";
import { generateCSRFToken, revokeCSRFToken } from "./csrfService.js";
import { env } from "./env.js";
import { TOKEN_EXPIRY, COOKIE_OPTIONS, REDIS_KEYS } from "./security.js";

// ─── Generate Full Token Set (Login/Register) ───────────────────────
export const generateToken = async (userId, res) => {
  const sessionId = crypto.randomBytes(16).toString("hex");

  // Create refresh token
  const refreshToken = jwt.sign(
    { id: userId, sessionId },
    env.REFRESH_SECRET,
    { expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN }
  );

  // Invalidate any existing session (single-device enforcement)
  const existingSessionId = await redisClient.get(REDIS_KEYS.activeSession(userId));
  if (existingSessionId) {
    await redisClient.del(REDIS_KEYS.session(existingSessionId));
  }
  await redisClient.del(REDIS_KEYS.refreshToken(userId));

  // Store session data in Redis
  const sessionData = {
    userId,
    sessionId,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  await redisClient.setEx(
    REDIS_KEYS.refreshToken(userId),
    TOKEN_EXPIRY.REFRESH_TOKEN_S,
    refreshToken
  );

  await redisClient.setEx(
    REDIS_KEYS.activeSession(userId),
    TOKEN_EXPIRY.SESSION_S,
    sessionId
  );

  await redisClient.setEx(
    REDIS_KEYS.session(sessionId),
    TOKEN_EXPIRY.SESSION_S,
    JSON.stringify(sessionData)
  );

  // Set refresh token cookie
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS.refreshToken);

  // Generate access token
  generateAccessToken(userId, sessionId, res);

  // Generate CSRF token
  const csrfToken = await generateCSRFToken(userId, res);

  return { sessionId, csrfToken };
};

// ─── Generate Access Token Only (Refresh Flow) ─────────────────────
export const generateAccessToken = (userId, sessionId, res) => {
  const accessToken = jwt.sign(
    { id: userId, sessionId },
    env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN }
  );

  res.cookie("accessToken", accessToken, COOKIE_OPTIONS.accessToken);

  return accessToken;
};

// ─── Verify Refresh Token ───────────────────────────────────────────
export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, env.REFRESH_SECRET);

    // Check if refresh token matches stored value
    const storedToken = await redisClient.get(REDIS_KEYS.refreshToken(decoded.id));
    if (storedToken !== refreshToken) {
      return null;
    }

    // Verify session is still the active one
    const activeSessionId = await redisClient.get(REDIS_KEYS.activeSession(decoded.id));
    if (activeSessionId !== decoded.sessionId) {
      return null;
    }

    // Verify session data exists
    const sessionData = await redisClient.get(REDIS_KEYS.session(decoded.sessionId));
    if (!sessionData) {
      return null;
    }

    // Update last activity
    const parsedSessionData = JSON.parse(sessionData);
    parsedSessionData.lastActivity = new Date().toISOString();
    await redisClient.setEx(
      REDIS_KEYS.session(decoded.sessionId),
      TOKEN_EXPIRY.SESSION_S,
      JSON.stringify(parsedSessionData)
    );

    return decoded;
  } catch (error) {
    return null;
  }
};

// ─── Revoke Refresh Token (Logout) ──────────────────────────────────
export const revokeRefreshToken = async (userId, currentSessionId = null) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Logout] Revoking all sessions for userId: ${userId}`);
  }

  const activeSessionId = await redisClient.get(REDIS_KEYS.activeSession(userId));

  // Delete all user-level keys
  await redisClient.del(REDIS_KEYS.refreshToken(userId));
  await redisClient.del(REDIS_KEYS.activeSession(userId));

  // Delete active session data
  if (activeSessionId) {
    await redisClient.del(REDIS_KEYS.session(activeSessionId));
  }

  // Also delete the current request's session if different from active
  if (currentSessionId && currentSessionId !== activeSessionId) {
    await redisClient.del(REDIS_KEYS.session(currentSessionId));
  }

  await revokeCSRFToken(userId);
};

// ─── Check if Session is Active ─────────────────────────────────────
export const isSessionActive = async (userId, sessionId) => {
  const sessionKey = REDIS_KEYS.session(sessionId);
  const sessionData = await redisClient.get(sessionKey);

  if (!sessionData) {
    return false;
  }

  const session = JSON.parse(sessionData);

  // Update last activity timestamp
  session.lastActivity = new Date().toISOString();
  await redisClient.setEx(sessionKey, TOKEN_EXPIRY.SESSION_S, JSON.stringify(session));

  return session.userId === userId;
};
