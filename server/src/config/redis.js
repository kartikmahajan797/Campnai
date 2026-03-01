import { createClient } from "redis";
import { env } from "./env.js";

if (!env.REDIS_URL) {
  console.error("❌ Missing REDIS_URL environment variable");
  process.exit(1);
}

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err.message);
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  } catch (error) {
    console.error("❌ Redis connection FAILED:", error.message);
    console.error("   Server cannot run without Redis (auth, sessions, rate limiting).");
    process.exit(1);
  }
};

export default redisClient;
