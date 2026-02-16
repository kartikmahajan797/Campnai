import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

import healthRouter from "../src/api/routes.js";
import chatRouter from "../src/api/chat.js";
import influencersRouter from "../src/api/influencers.js";

const app = express();

// Security
app.use(helmet());
app.use(hpp());
app.use(
    cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { detail: "Too many requests. Please try again later." },
});
app.use(limiter);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.disable("x-powered-by");

// Routes
app.use("/", healthRouter);
app.use("/api/v1", chatRouter);
app.use("/api/v1", influencersRouter);

// Error handlers
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

export default app;
