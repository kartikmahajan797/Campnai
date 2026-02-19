import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";

import healthRouter from "./api/routes.js";
import chatRouter from "./api/chat.js";
import influencersRouter from "./api/influencers.js";
import searchRouter from "./api/searchAPI.js";
import brandRouter from "./api/brand.js";
import campaignRouter from "./api/campaigns.js";
import reportRouter from "./api/report.js";
import outreachRouter from "./api/outreach.js";
import { startNegotiationCron } from "./services/negotiationCron.js";
import { debugFetchAll } from "./services/emailService.js";

const app = express();
const PORT = process.env.PORT || 8000;


app.use(helmet());

app.use(hpp());

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8081",
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            if (process.env.NODE_ENV === "production") {
                return cb(new Error("Not allowed by CORS"));
            }
            return cb(null, true);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["X-Session-Id"],
        maxAge: 86400,
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.disable("x-powered-by");

app.use("/", healthRouter);
app.use("/api/v1", chatRouter);
app.use("/api/v1", influencersRouter);
app.use("/api/v1", searchRouter);
app.use("/api/v1", brandRouter);
app.use("/api/v1/campaigns", campaignRouter);
app.use("/api/v1/campaigns", reportRouter);
app.use("/api/v1/campaigns", outreachRouter);

// ── Debug IMAP (dev only) ──────────────────────────────────────────────────────
app.get('/test-imap', async (_req, res) => {
    try {
        const { results, skipped } = await debugFetchAll();
        res.json({ count: results.length, skipped, messages: results.map(r => ({ from: r.from, subject: r.subject, bodyPreview: r.body?.substring(0, 200), date: r.date })) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use((err, _req, res, _next) => {
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ detail: "File too large. Max 10 MB." });
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ detail: "Internal server error" });
});

app.use((_req, res) => {
    res.status(404).json({ detail: "Not found" });
});

app.listen(PORT, () => {
    console.log(`🚀 Campnai server running on http://localhost:${PORT}`);
    startNegotiationCron();
});

export default app;
