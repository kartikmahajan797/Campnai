import { Router } from "express";
import { db } from "../core/config.js";

const router = Router();

/** Health check */
router.get("/", (_req, res) => {
    res.json({ message: "Backend is running" });
});

/** Detailed health check */
router.get("/health", (_req, res) => {
    if (db) {
        return res.json({ status: "ok", database: "connected" });
    }
    res.json({ status: "ok", database: "disconnected (check credentials)" });
});

export default router;
