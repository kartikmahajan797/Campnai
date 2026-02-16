/**
 * Embedding Script — Reads from influencers_data.json (no Firebase needed).
 * 
 * Usage:  node src/scripts/embedFromJSON.js
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { getIndex } = await import("../core/pinecone.js");
const { GoogleGenerativeAI } = await import("@google/generative-ai");

const JSON_PATH = path.resolve(__dirname, "../../influencers_data.json");
const PINECONE_BATCH = 50;
const EMBED_CHUNK   = 90;
const EMBED_DELAY   = 200;
const CHUNK_PAUSE   = 62_000;


function getFollowerTier(followers) {
    if (!followers || followers <= 0) return "unknown";
    if (followers < 10000) return "nano";
    if (followers < 100000) return "micro";
    if (followers < 500000) return "mid";
    if (followers < 1000000) return "macro";
    return "mega";
}

// ─── Check if influencer has enough useful data to embed ──────────────
function hasUsefulData(data) {
    const profile = data.profile || {};
    const brand = data.brand || {};
    const metrics = data.metrics || {};
    const hasName = profile.name && profile.name.trim() !== "";
    const hasNiche = brand.niche && brand.niche.trim() !== "";
    const hasFollowers = metrics.followers && metrics.followers > 0;
    const hasBrandFit = brand.brand_fit && brand.brand_fit.trim() !== "";
    return hasName && (hasNiche || hasFollowers || hasBrandFit);
}

// ─── Build a rich text description ────────────────────────────────────
function buildInfluencerText(data) {
    const profile = data.profile || {};
    const metrics = data.metrics || {};
    const audience = data.audience || {};
    const brand = data.brand || {};

    const parts = [];
    if (profile.name) parts.push(`${profile.name} is an influencer`);
    if (profile.location) parts.push(`based in ${profile.location}`);
    if (profile.gender) parts.push(`(${profile.gender})`);
    if (profile.type) parts.push(`classified as a ${profile.type} creator`);
    if (brand.niche) parts.push(`specializing in ${brand.niche}`);
    if (brand.brand_fit) parts.push(`suited for brands in ${brand.brand_fit}`);
    if (brand.vibe) parts.push(`with a ${brand.vibe} content style`);

    const metricParts = [];
    if (metrics.followers) metricParts.push(`${Number(metrics.followers).toLocaleString()} followers`);
    if (metrics.avg_views) metricParts.push(`averaging ${Number(metrics.avg_views).toLocaleString()} views per post`);
    if (metrics.engagement_rate) metricParts.push(`${metrics.engagement_rate}% engagement rate`);
    if (metricParts.length) parts.push(`with ${metricParts.join(", ")}`);

    const demoParts = [];
    if (audience.mf_split) demoParts.push(`male/female split of ${audience.mf_split}`);
    if (audience.india_split) demoParts.push(`India audience split of ${audience.india_split}`);
    if (audience.age_concentration) demoParts.push(`audience concentrated in age group ${audience.age_concentration}`);
    if (demoParts.length) parts.push(`Audience demographics: ${demoParts.join(", ")}`);

    if (data.commercials && data.commercials.trim() !== "" && data.commercials !== "-") {
        parts.push(`Past campaign performance and commercials: ${data.commercials}`);
    }

    return parts.join(". ") || "Influencer profile";
}

// ─── Generate embedding with retry ───────────────────────────────────
async function getEmbeddingWithRetry(genAI, text, maxRetries = 3) {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.embedContent(text);
            const values = result?.embedding?.values;
            if (!values || values.length === 0) throw new Error("Embedding returned empty values");
            return Array.from(values);
        } catch (err) {
            const is429 = err.message?.includes("429") || err.message?.includes("Too Many Requests");
            if (is429 && attempt < maxRetries) {
                const wait = attempt * 20_000;
                console.log(`  ⏳ Rate limited, waiting ${wait / 1000}s before retry ${attempt}/${maxRetries}...`);
                await new Promise((r) => setTimeout(r, wait));
                continue;
            }
            throw err;
        }
    }
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
    console.log("🚀 Starting influencer embedding from JSON...\n");

    const index = getIndex();
    if (!index) {
        console.error("❌ Pinecone not configured. Set PINECONE_API_KEY and PINECONE_INDEX in .env");
        process.exit(1);
    }

    if (!fs.existsSync(JSON_PATH)) {
        console.error(`❌ JSON file not found at ${JSON_PATH}`);
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const allInfluencers = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));

    // Filter to only influencers with useful data
    const influencers = allInfluencers.filter(hasUsefulData);
    const total = influencers.length;
    const totalChunks = Math.ceil(total / EMBED_CHUNK);

    console.log(`📊 ${allInfluencers.length} total influencers, ${total} with useful data. Embedding in ${totalChunks} chunk(s).\n`);

    const vectors = [];
    let successCount = 0;
    let failCount = 0;

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const start = chunkIdx * EMBED_CHUNK;
        const end = Math.min(start + EMBED_CHUNK, total);
        const chunk = influencers.slice(start, end);

        if (chunkIdx > 0) {
            console.log(`  ⏳ Chunk ${chunkIdx + 1}/${totalChunks} — pausing ${Math.round(CHUNK_PAUSE / 1000)}s for rate limits...`);
            await new Promise((r) => setTimeout(r, CHUNK_PAUSE));
        }

        console.log(`\n📦 Embedding chunk ${chunkIdx + 1}/${totalChunks} (${start + 1}–${end})...`);

        for (const inf of chunk) {
            const text = buildInfluencerText(inf);
            try {
                const embedding = await getEmbeddingWithRetry(genAI, text);

                if (successCount === 0) {
                    console.log(`  🔍 First embedding: dim=${embedding.length}`);
                }

                const profile = inf.profile || {};
                const metrics = inf.metrics || {};
                const audience = inf.audience || {};
                const brand = inf.brand || {};
                const contact = inf.contact || {};

                vectors.push({
                    id: inf.id,
                    values: embedding,
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
                        follower_tier: getFollowerTier(metrics.followers),
                        avg_views: metrics.avg_views || 0,
                        engagement_rate: metrics.engagement_rate || 0,
                        mf_split: audience.mf_split || "",
                        india_split: audience.india_split || "",
                        age_concentration: audience.age_concentration || "",
                        commercials: inf.commercials || "",
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
                console.error(`  ❌ Failed to embed ${inf.profile?.name || inf.id}: ${err.message}`);
            }
        }
    }

    // Upload to Pinecone
    console.log(`\n📤 Uploading ${vectors.length} vectors to Pinecone (${failCount} failed)...`);

    if (vectors.length === 0) {
        console.error("❌ No vectors to upload.");
        process.exit(1);
    }

    for (let i = 0; i < vectors.length; i += PINECONE_BATCH) {
        const batch = vectors.slice(i, i + PINECONE_BATCH);
        await index.upsert({ records: batch });
        console.log(`  📦 Uploaded batch ${Math.floor(i / PINECONE_BATCH) + 1} (${batch.length} vectors)`);
    }

    console.log(`\n🎉 Done! ${vectors.length} influencers embedded and uploaded.`);
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
});
