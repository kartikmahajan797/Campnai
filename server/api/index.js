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

const allowedOrigins = [
    "https://campnai.com",
    "https://www.campnai.com",
    "http://localhost:5173",
    "http://localhost:8080",
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Session-Id"],
    optionsSuccessStatus: 200,
    maxAge: 86400,
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: { policy: "unsafe-none" },
    })
);

app.use(hpp());

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

app.use("/", healthRouter);
app.use("/api/v1", chatRouter);
app.use("/api/v1", influencersRouter);

app.use((err, _req, res, _next) => {
    if (err.message && err.message.startsWith("CORS:")) {
        return res.status(403).json({ detail: err.message });
    }

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