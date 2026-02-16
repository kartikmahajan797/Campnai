import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";

import healthRouter from "./api/routes.js";
import chatRouter from "./api/chat.js";
import influencersRouter from "./api/influencers.js";

const app = express();
const PORT = process.env.PORT || 8000;


app.use(helmet());

app.use(hpp());

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
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
});

export default app;
