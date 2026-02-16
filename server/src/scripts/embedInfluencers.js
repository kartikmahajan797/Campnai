/**
 * Embedding Script — Run this ONCE to upload all influencers from Firestore to Pinecone.
 * 
 * Usage:  node src/scripts/embedInfluencers.js
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Dynamic imports — load AFTER dotenv so env vars are available
const { db } = await import("../core/config.js");
const { getIndex } = await import("../core/pinecone.js");
const { GoogleGenerativeAI } = await import("@google/generative-ai");

const CAMPAIGN_ID = "test_campaign_001";
const PINECONE_BATCH = 50;       // Pinecone upsert batch size
const EMBED_CHUNK   = 90;        // Stay under Gemini's 100 RPM free-tier limit
const EMBED_DELAY   = 200;       // ms between individual embed calls within a chunk
const CHUNK_PAUSE   = 62_000;    // ms to wait between 90-request chunks (~62s)

// ─── Build a text description for each influencer ────────────────────
function buildInfluencerText(data) {
    const profile = data.profile || {};
    const metrics = data.metrics || {};
    const audience = data.audience || {};
    const brand = data.brand || {};

    const parts = [];
    if (profile.name) parts.push(`Name: ${profile.name}`);
    if (profile.location) parts.push(`Location: ${profile.location}`);
    if (profile.gender) parts.push(`Gender: ${profile.gender}`);
    if (profile.type) parts.push(`Type: ${profile.type}`);
    if (brand.niche) parts.push(`Niche: ${brand.niche}`);
    if (brand.brand_fit) parts.push(`Brand Fit: ${brand.brand_fit}`);
    if (brand.vibe) parts.push(`Vibe: ${brand.vibe}`);
    if (metrics.followers) parts.push(`Followers: ${metrics.followers}`);
    if (metrics.avg_views) parts.push(`Average Views: ${metrics.avg_views}`);
    if (metrics.engagement_rate) parts.push(`Engagement Rate: ${metrics.engagement_rate}%`);
    if (audience.mf_split) parts.push(`Male/Female Split: ${audience.mf_split}`);
    if (audience.india_split) parts.push(`India Split: ${audience.india_split}`);
    if (audience.age_concentration) parts.push(`Age Concentration: ${audience.age_concentration}`);
    if (data.commercials) parts.push(`Commercials: ${data.commercials}`);

    return parts.join(". ") || "Influencer profile";
}

// ─── Generate embedding with retry for 429 rate-limit errors ─────────
async function getEmbeddingWithRetry(genAI, text, maxRetries = 3) {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.embedContent(text);
            const values = result?.embedding?.values;

            if (!values || values.length === 0) {
                throw new Error("Embedding returned empty values");
            }
            // Ensure plain JS array (Gemini SDK may return typed arrays)
            return Array.from(values);
        } catch (err) {
            const is429 = err.message?.includes("429") || err.message?.includes("Too Many Requests");
            if (is429 && attempt < maxRetries) {
                const wait = attempt * 20_000; // 20s, 40s, 60s backoff
                console.log(`  ⏳ Rate limited, waiting ${wait / 1000}s before retry ${attempt}/${maxRetries}...`);
                await new Promise((r) => setTimeout(r, wait));
                continue;
            }
            throw err;
        }
    }
}

// ─── Helper: sleep with a countdown log ──────────────────────────────
function sleep(ms, label) {
    return new Promise((resolve) => {
        console.log(`  ⏳ ${label} — pausing ${Math.round(ms / 1000)}s to respect rate limits...`);
        setTimeout(resolve, ms);
    });
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
    console.log("🚀 Starting influencer embedding...\n");

    const index = getIndex();
    if (!index) {
        console.error("❌ Pinecone not configured. Set PINECONE_API_KEY and PINECONE_INDEX in .env");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 1. Fetch all influencers from Firestore
    console.log(`📂 Fetching influencers from Firestore (campaign: ${CAMPAIGN_ID})...`);
    const snap = await db
        .collection("campaigns")
        .doc(CAMPAIGN_ID)
        .collection("influencers")
        .get();

    if (snap.empty) {
        console.log("⚠️  No influencers found in Firestore.");
        process.exit(0);
    }

    const total = snap.size;
    const totalChunks = Math.ceil(total / EMBED_CHUNK);
    console.log(`📊 Found ${total} influencers. Will embed in ${totalChunks} chunk(s) of ${EMBED_CHUNK} (Gemini free tier = 100 RPM).\n`);

    const vectors = [];
    let successCount = 0;
    let failCount = 0;

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const start = chunkIdx * EMBED_CHUNK;
        const end = Math.min(start + EMBED_CHUNK, total);
        const chunkDocs = snap.docs.slice(start, end);

        // Pause between chunks (skip first)
        if (chunkIdx > 0) {
            await sleep(CHUNK_PAUSE, `Chunk ${chunkIdx + 1}/${totalChunks}`);
        }

        console.log(`\n📦 Embedding chunk ${chunkIdx + 1}/${totalChunks}  (influencers ${start + 1}–${end})...`);

        for (const doc of chunkDocs) {
            const data = doc.data();
            const text = buildInfluencerText(data);

            try {
                const embedding = await getEmbeddingWithRetry(genAI, text);

                // Debug: log shape of very first embedding
                if (successCount === 0) {
                    console.log(`  🔍 First embedding: dimension=${embedding.length}, type=${typeof embedding[0]}, isArray=${Array.isArray(embedding)}`);
                }

                const profile = data.profile || {};
                const metrics = data.metrics || {};
                const audience = data.audience || {};
                const brand = data.brand || {};
                const contact = data.contact || {};

                vectors.push({
                    id: doc.id,
                    values: embedding,    // Already a plain Array from Array.from()
                    metadata: {
                        name: profile.name || "Unknown",
                        instagram: profile.link || "",
                        gender: profile.gender || "",
                        location: profile.location || "",
                        type: profile.type || "",
                        niche: brand.niche || "",
                        brand_fit: brand.brand_fit || "",
                        vibe: brand.vibe || "",
                        followers: metrics.followers || 0,
                        avg_views: metrics.avg_views || 0,
                        engagement_rate: metrics.engagement_rate || 0,
                        mf_split: audience.mf_split || "",
                        india_split: audience.india_split || "",
                        age_concentration: audience.age_concentration || "",
                        commercials: data.commercials || "",
                        contact_no: contact.contact_no || "",
                        email: contact.email || "",
                        text: text,
                    },
                });

                successCount++;
                if (successCount % 10 === 0) console.log(`  ✅ Embedded ${successCount}/${total}`);

                await new Promise((r) => setTimeout(r, EMBED_DELAY));
            } catch (err) {
                failCount++;
                console.error(`  ❌ Failed to embed ${data.profile?.name || doc.id}: ${err.message}`);
            }
        }
    }

    // 2. Upload to Pinecone
    console.log(`\n📤 Uploading ${vectors.length} vectors to Pinecone (${failCount} failed during embedding)...`);

    if (vectors.length === 0) {
        console.error("❌ No vectors to upload. All embeddings failed.");
        process.exit(1);
    }

    // Debug: inspect first vector before upsert
    const sample = vectors[0];
    console.log(`  🔍 Sample vector — id: "${sample.id}", values length: ${sample.values.length}, isArray: ${Array.isArray(sample.values)}, first value: ${sample.values[0]}`);

    for (let i = 0; i < vectors.length; i += PINECONE_BATCH) {
        const batch = vectors.slice(i, i + PINECONE_BATCH);
        await index.upsert({ records: batch });
        console.log(`  📦 Uploaded batch ${Math.floor(i / PINECONE_BATCH) + 1} (${batch.length} vectors)`);
    }

    console.log(`\n🎉 Done! ${vectors.length} influencers embedded and uploaded to Pinecone.`);
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
});
