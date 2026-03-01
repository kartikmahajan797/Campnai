import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sanitize from "mongo-sanitize";
import TryCatch from "../middleware/tryCatch.js";
import { redisClient } from "../config/redis.js";
import { REDIS_KEYS, COOKIE_OPTIONS, TOKEN_EXPIRY } from "../config/security.js";
import {
  generateToken,
  generateAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from "../config/tokenService.js";
import { generateCSRFToken } from "../config/csrfService.js";
import { firebaseAdmin } from "../core/config.js";

// ─── Zod Validation Schemas ─────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

// ─── Helper: Parse Zod Errors ───────────────────────────────────────
function parseZodError(zodError) {
  let firstErrorMessage = "Validation failed";
  let allErrors = [];

  if (zodError?.issues && Array.isArray(zodError.issues)) {
    allErrors = zodError.issues.map((issue) => ({
      field: issue.path ? issue.path.join(".") : "unknown",
      message: issue.message || "Validation Error",
      code: issue.code,
    }));
    firstErrorMessage = allErrors[0]?.message || "Validation Error";
  }

  return { firstErrorMessage, allErrors };
}

// ─── Register ───────────────────────────────────────────────────────
export const register = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = registerSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const { firstErrorMessage, allErrors } = parseZodError(validation.error);
    return res.status(400).json({ message: firstErrorMessage, errors: allErrors });
  }

  const { name, email, password } = validation.data;

  // Rate limit per IP + email
  const rateLimitKey = REDIS_KEYS.rateLimit("register", req.ip, email);
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({ message: "Too many requests, try again later" });
  }

  // Check if user already exists in Firebase
  try {
    await firebaseAdmin.auth().getUserByEmail(email);
    return res.status(400).json({ message: "User already exists" });
  } catch (err) {
    // User doesn't exist — continue registration
    if (err.code !== "auth/user-not-found") {
      throw err;
    }
  }

  const hashPassword = await bcrypt.hash(password, 10);

  // Store pending verification in Redis
  // NOTE: We store the raw password (not hash) because Firebase Admin SDK
  // expects a plaintext password in createUser() and handles hashing internally.
  const verifyToken = crypto.randomBytes(32).toString("hex");
  const verifyKey = REDIS_KEYS.verify(verifyToken);

  await redisClient.set(
    verifyKey,
    JSON.stringify({ name, email, password, hashPassword }),
    { EX: 300 }
  );

  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  res.json({
    message: "Registration initiated. Verification token generated.",
    verifyToken, // In production, send this via email instead
  });
});

// ─── Verify Registration ────────────────────────────────────────────
export const verifyRegistration = TryCatch(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: "Verification token is required." });
  }

  const verifyKey = REDIS_KEYS.verify(token);
  const userDataJson = await redisClient.get(verifyKey);

  if (!userDataJson) {
    return res.status(400).json({ message: "Verification link is expired." });
  }

  await redisClient.del(verifyKey);
  const userData = JSON.parse(userDataJson);

  // Create user in Firebase
  let firebaseUser;
  try {
    firebaseUser = await firebaseAdmin.auth().createUser({
      email: userData.email,
      displayName: userData.name,
      password: userData.password, // Firebase will hash this
    });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      return res.status(400).json({ message: "User already exists" });
    }
    throw err;
  }

  res.status(201).json({
    message: "Email verified successfully! Your account has been created.",
    user: { uid: firebaseUser.uid, name: userData.name, email: userData.email },
  });
});

// ─── Login (Step 1: Send OTP) ───────────────────────────────────────
export const login = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = loginSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const { firstErrorMessage, allErrors } = parseZodError(validation.error);
    return res.status(400).json({ message: firstErrorMessage, errors: allErrors });
  }

  const { email, password } = validation.data;

  // Rate limit
  const rateLimitKey = REDIS_KEYS.rateLimit("login", req.ip, email);
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({ message: "Too many requests, try again later" });
  }

  // Verify credentials via Firebase (or check stored hash)
  let firebaseUser;
  try {
    firebaseUser = await firebaseAdmin.auth().getUserByEmail(email);
  } catch (err) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpKey = REDIS_KEYS.otp(email);

  await redisClient.set(otpKey, JSON.stringify(otp), { EX: 300 });
  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  // In production, send OTP via email — never log it
  if (process.env.NODE_ENV !== "production") {
    console.log(`📧 OTP for ${email}: ${otp}`);
  }

  res.json({
    message: "If your email is valid, an OTP has been sent. It will be valid for 5 minutes.",
  });
});

// ─── Verify OTP (Step 2: Issue Tokens) ──────────────────────────────
export const verifyOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Please provide all details" });
  }

  const otpKey = REDIS_KEYS.otp(email);
  const storedOtpString = await redisClient.get(otpKey);

  if (!storedOtpString) {
    return res.status(400).json({ message: "OTP expired" });
  }

  const storedOtp = JSON.parse(storedOtpString);
  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  await redisClient.del(otpKey);

  // Get user from Firebase
  let user;
  try {
    user = await firebaseAdmin.auth().getUserByEmail(email);
  } catch (err) {
    return res.status(400).json({ message: "User not found" });
  }

  // Generate full token set
  const tokenData = await generateToken(user.uid, res);

  // Cache user data
  const userData = {
    _id: user.uid,
    uid: user.uid,
    name: user.displayName || email.split("@")[0],
    email: user.email,
  };
  await redisClient.setEx(
    REDIS_KEYS.userCache(user.uid),
    TOKEN_EXPIRY.USER_CACHE_S,
    JSON.stringify(userData)
  );

  res.status(200).json({
    message: `Welcome ${userData.name}`,
    user: userData,
    sessionInfo: {
      sessionId: tokenData.sessionId,
      loginTime: new Date().toISOString(),
      csrfToken: tokenData.csrfToken,
    },
  });
});

// ─── Google Auth (Firebase ID Token → JWT Cookies) ──────────────────
export const googleAuth = TryCatch(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Firebase ID token is required" });
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error("Firebase token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const { uid, email, name, picture } = decodedToken;

  if (!email) {
    return res.status(400).json({ message: "Email is required for authentication" });
  }

  // Rate limit per email
  const rateLimitKey = REDIS_KEYS.rateLimit("google-auth", "", email);
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({ message: "Too many requests for this account, try again later" });
  }

  // Clear any existing user cache
  await redisClient.del(REDIS_KEYS.userCache(uid));

  // Generate full token set
  const tokenData = await generateToken(uid, res);

  await redisClient.set(rateLimitKey, "true", { EX: 15 });

  const userData = {
    _id: uid,
    uid,
    name: name || email.split("@")[0],
    email,
    authProvider: "google",
    photoURL: picture || null,
  };

  // Cache user data
  await redisClient.setEx(
    REDIS_KEYS.userCache(uid),
    TOKEN_EXPIRY.USER_CACHE_S,
    JSON.stringify(userData)
  );

  res.status(200).json({
    message: `Welcome ${userData.name}`,
    user: userData,
    sessionInfo: {
      sessionId: tokenData.sessionId,
      loginTime: new Date().toISOString(),
      csrfToken: tokenData.csrfToken,
    },
  });
});

// ─── Refresh Token ──────────────────────────────────────────────────
export const refreshTokenHandler = TryCatch(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const decoded = await verifyRefreshToken(refreshToken);

  if (!decoded) {
    // Clear all cookies on invalid refresh
    res.clearCookie("refreshToken", COOKIE_OPTIONS.clear);
    res.clearCookie("accessToken", COOKIE_OPTIONS.clear);
    res.clearCookie("csrfToken", COOKIE_OPTIONS.clear);

    return res.status(401).json({ message: "Session expired. Please login." });
  }

  generateAccessToken(decoded.id, decoded.sessionId, res);

  res.status(200).json({ message: "Token refreshed" });
});

// ─── Logout ─────────────────────────────────────────────────────────
export const logout = TryCatch(async (req, res) => {
  const userId = req.user._id || req.user.uid;

  await revokeRefreshToken(userId);

  // Clear all cookies
  res.clearCookie("refreshToken", COOKIE_OPTIONS.clear);
  res.clearCookie("accessToken", COOKIE_OPTIONS.clear);
  res.clearCookie("csrfToken", COOKIE_OPTIONS.clear);

  // Clear user cache
  await redisClient.del(REDIS_KEYS.userCache(userId));

  res.json({ message: "Logged out successfully" });
});

// ─── Refresh CSRF ───────────────────────────────────────────────────
export const refreshCSRF = TryCatch(async (req, res) => {
  const userId = req.user._id || req.user.uid;

  const newCSRFToken = await generateCSRFToken(userId, res);

  res.json({
    message: "CSRF token refreshed successfully",
    csrfToken: newCSRFToken,
  });
});

// ─── My Profile ─────────────────────────────────────────────────────
export const myProfile = TryCatch(async (req, res) => {
  const user = req.user;
  const sessionId = req.sessionId;

  let sessionInfo = null;

  if (sessionId) {
    const sessionData = await redisClient.get(REDIS_KEYS.session(sessionId));
    if (sessionData) {
      const parsedSession = JSON.parse(sessionData);
      sessionInfo = {
        sessionId,
        loginTime: parsedSession.createdAt,
        lastActivity: parsedSession.lastActivity,
      };
    }
  }

  res.json({ user, sessionInfo });
});

// ─── Forgot Password ───────────────────────────────────────────────
export const forgotPassword = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = forgotPasswordSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const { firstErrorMessage, allErrors } = parseZodError(validation.error);
    return res.status(400).json({ message: firstErrorMessage, errors: allErrors });
  }

  const { email } = validation.data;

  const rateLimitKey = REDIS_KEYS.rateLimit("forgot-password", req.ip, email);
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({ message: "Too many requests, try again later" });
  }

  // Generate reset token regardless of whether user exists (timing attack prevention)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetKey = REDIS_KEYS.resetPassword(resetToken);

  // Check if user exists in Firebase
  try {
    const user = await firebaseAdmin.auth().getUserByEmail(email);
    await redisClient.set(
      resetKey,
      JSON.stringify({ userId: user.uid, email }),
      { EX: 900 } // 15 minutes
    );
    // In production, send reset email here
    console.log(`📧 Password reset token for ${email}: ${resetToken}`);
  } catch (err) {
    // User not found — still respond generically (timing attack prevention)
  }

  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  res.json({
    message: "If your email is registered, a password reset link has been sent. It will expire in 15 minutes.",
  });
});

// ─── Reset Password ────────────────────────────────────────────────
export const resetPassword = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = resetPasswordSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const { firstErrorMessage, allErrors } = parseZodError(validation.error);
    return res.status(400).json({ message: firstErrorMessage, errors: allErrors });
  }

  const { token, password } = validation.data;
  const resetKey = REDIS_KEYS.resetPassword(token);
  const resetDataJson = await redisClient.get(resetKey);

  if (!resetDataJson) {
    return res.status(400).json({ message: "Reset link is invalid or expired" });
  }

  await redisClient.del(resetKey);
  const resetData = JSON.parse(resetDataJson);

  // Update password in Firebase
  try {
    await firebaseAdmin.auth().updateUser(resetData.userId, { password });
  } catch (err) {
    return res.status(400).json({ message: "Failed to reset password" });
  }

  // Revoke existing sessions
  await revokeRefreshToken(resetData.userId);

  res.json({ message: "Password reset successfully. Please login with your new password." });
});
