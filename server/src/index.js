import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";

import { validateEnv, env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";
import { CORS_ORIGINS } from "./config/security.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { auditAuthFailureMiddleware } from "./services/auditLogger.js";

import healthRouter from "./api/routes.js";
import authRouter from "./api/authRoutes.js";
import chatRouter from "./api/chat.js";
import influencersRouter from "./api/influencers.js";
import searchRouter from "./api/searchAPI.js";
import brandRouter from "./api/brand.js";
import campaignRouter from "./api/campaigns.js";
import reportRouter from "./api/report.js";
import outreachRouter from "./api/outreach.js";
import { startNegotiationCron } from "./services/negotiationCron.js";
import { debugFetchAll } from "./services/emailService.js";

validateEnv();

const app = express();
const PORT = process.env.PORT || 8000;

app.set("trust proxy", env.TRUST_PROXY === "true" || env.TRUST_PROXY === "1" ? 1 : false);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

app.use(hpp());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-csrf-token",
      "x-xsrf-token",
      "csrf-token",
    ],
    exposedHeaders: ["X-Session-Id", "set-cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  })
);

app.use(cookieParser());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.disable("x-powered-by");

app.use(globalLimiter);

// Add audit logging for auth failures
app.use(auditAuthFailureMiddleware);


app.use("/", healthRouter);

app.use("/api/v1/auth", authRouter);

app.use("/api/v1", chatRouter);
app.use("/api/v1", influencersRouter);
app.use("/api/v1", searchRouter);
app.use("/api/v1", brandRouter);
app.use("/api/v1/campaigns", campaignRouter);
app.use("/api/v1/campaigns", reportRouter);
app.use("/api/v1/campaigns", outreachRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`🚀 Campnai server running on http://localhost:${PORT}`);
    console.log(`🔒 Security: Helmet, HPP, CORS, Rate Limiting, CSRF enabled`);
    console.log(`🔑 Auth: Dual-mode (JWT cookies + Firebase Bearer)`);
    startNegotiationCron();
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  process.exit(1);
});

export default app;
