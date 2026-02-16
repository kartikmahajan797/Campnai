import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Firebase ────────────────────────────────────────────────────────
function initializeFirebase() {
    try {
        if (admin.apps.length) return admin.firestore();

        const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (jsonEnv) {
            const cert = JSON.parse(jsonEnv);
            admin.initializeApp({ credential: admin.credential.cert(cert) });
            return admin.firestore();
        }

        const candidates = [
            process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
            join(__dirname, "..", "serviceAccountKey.json"),
            join(__dirname, "..", "..", "serviceAccountKey.json"),
            join(__dirname, "..", "..", "backend", "serviceAccountKey.json"),
        ].filter(Boolean);

        for (const p of candidates) {
            if (existsSync(p)) {
                const cert = JSON.parse(readFileSync(p, "utf-8"));
                admin.initializeApp({ credential: admin.credential.cert(cert) });
                console.log(`✅ Firebase initialized from ${p}`);
                return admin.firestore();
            }
        }

        console.warn("⚠️  No Firebase credentials found");
        return null;
    } catch (err) {
        console.error("Firebase init error:", err.message);
        return null;
    }
}

// ─── Gemini AI ───────────────────────────────────────────────────────
function initializeGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("⚠️  GEMINI_API_KEY not set");
        return null;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

export const db = initializeFirebase();
export const geminiModel = initializeGemini();
export const firebaseAdmin = admin;
