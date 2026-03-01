import dotenv from "dotenv";
dotenv.config();

// ─── Required Environment Variables ──────────────────────────────────
const REQUIRED_VARS = [
  "JWT_SECRET",
  "REFRESH_SECRET",
  "REDIS_URL",
];

const OPTIONAL_VARS = [
  "GEMINI_API_KEY",
  "PORT",
  "NODE_ENV",
  "FRONTEND_URL",
  "PINECONE_API_KEY",
  "PINECONE_INDEX",
];

// ─── Validate Required Vars ─────────────────────────────────────────
export function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nPlease add them to server/.env");
    process.exit(1);
  }

  const optionalMissing = OPTIONAL_VARS.filter((key) => !process.env[key]);
  if (optionalMissing.length > 0) {
    console.warn("⚠️  Optional environment variables not set:");
    optionalMissing.forEach((key) => console.warn(`   - ${key}`));
  }

  console.log("✅ Environment variables validated");
}

// ─── Export Config Object ────────────────────────────────────────────
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8000", 10),
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  
  get isProduction() {
    return this.NODE_ENV === "production";
  },
};
