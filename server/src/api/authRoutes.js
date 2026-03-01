import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { verifyCSRFToken } from "../config/csrfService.js";
import { authLimiter, strictLimiter } from "../middleware/rateLimiter.js";
import {
  register,
  verifyRegistration,
  login,
  verifyOtp,
  googleAuth,
  refreshTokenHandler,
  logout,
  refreshCSRF,
  myProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// ─── Public Routes (No Auth Required) ──────────────────────────────
router.post("/register", authLimiter, register);
router.post("/verify/:token", authLimiter, verifyRegistration);
router.post("/login", authLimiter, login);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/google-auth", authLimiter, googleAuth);
router.post("/forgot-password", strictLimiter, forgotPassword);
router.post("/reset-password", strictLimiter, resetPassword);

// ─── Token Management (Partial Auth) ───────────────────────────────
router.post("/refresh", refreshTokenHandler);

// ─── Protected Routes (Auth Required) ──────────────────────────────
router.get("/me", authenticate, myProfile);
router.post("/refresh-csrf", authenticate, refreshCSRF);
router.post("/logout", authenticate, logout);

// ─── Auth Health Check ─────────────────────────────────────────────
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "auth",
    timestamp: new Date().toISOString(),
  });
});

export default router;
