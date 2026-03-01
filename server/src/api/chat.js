import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { verifyCSRFToken } from "../config/csrfService.js";
import * as chatController from "../controllers/chat.controller.js";

const router = Router();

// ─── POST /chat ─────────────────────────────────────────────────────
router.post("/chat", authenticate, verifyCSRFToken, chatController.sendMessage);

// ─── GET /chat/history/:sessionId ───────────────────────────────────
router.get("/chat/history/:sessionId", authenticate, chatController.getHistory);

// ─── DELETE /chat/history/:sessionId ────────────────────────────────
router.delete("/chat/history/:sessionId", authenticate, verifyCSRFToken, chatController.deleteHistory);

// ─── GET /chat/sessions ─────────────────────────────────────────────
router.get("/chat/sessions", authenticate, chatController.getSessions);

export default router;
