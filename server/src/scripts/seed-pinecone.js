import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "../influencers_data.json");

async function seedPinecone() {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX || "campnai-influencers";
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || !geminiKey) {
        console.error("❌ Missing API keys (PINECONE_API_KEY or GEMINI_API_KEY).");
        process.exit(1);
    }

    console.log("Reading data file...");
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const influencers = JSON.parse(rawData);

    console.log(`Total records in file: ${influencers.length}`);

    // Filter valid influencers
    const validInfluencers = influencers.filter(inf => {
        const followers = inf.metrics?.followers;
        const name = inf.profile?.name;
        // Check for non-empty name and non-zero followers
        return name && followers > 0;
    });

    console.log(`Valid records (followers > 0): ${validInfluencers.length}`);
    console.log(`Skipped (empty/invalid): ${influencers.length - validInfluencers.length}`);

    if (validInfluencers.length === 0) {
        console.log("❌ No valid data to upload.");
        return;
    }

    // Initialize clients
    const pc = new Pinecone({ apiKey });
    const index = pc.index(indexName);
    const genAI = new GoogleGenerativeAI(geminiKey);
    const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    const vectors = [];
    console.log("Generating embeddings...");

    for (const inf of validInfluencers) {
        const profile = inf.profile || {};
        const brand = inf.brand || {};
        const audience = inf.audience || {};
        const metrics = inf.metrics || {};

        // Construct text for embedding
        // We want to capture the "essence" of the influencer
        const textToEmbed = `
            Influencer: ${profile.name || ""}
            Niche: ${brand.niche || ""}
            Location: ${profile.location || ""}
            Vibe: ${brand.vibe || ""}
            Brand Fit: ${brand.brand_fit || ""}
            Type: ${profile.type || ""}
        `.trim().replace(/\s+/g, " ");

        try {
            const result = await embedModel.embedContent(textToEmbed);
            const embedding = result.embedding.values;

            // Flatten metadata for Pinecone (Pinecone prefers string/number/boolean/array of strings)
            // Complex objects like "profile" need to be flattened or stored as specific fields
            const metadata = {
                id: inf.id,
                name: profile.name,
                username: profile.link ? profile.link.split("instagram.com/")[1]?.split("?")[0] : "",
                link: profile.link,
                gender: profile.gender,
                location: profile.location,
                niche: brand.niche,
                vibe: brand.vibe,
                brand_fit: brand.brand_fit,
                followers: metrics.followers,
                engagement_rate: metrics.engagement_rate,
                avg_views: metrics.avg_views,
                email: inf.contact?.email,
                contact_no: inf.contact?.contact_no,
                // Store created_at if needed, but Pinecone metadata is flat
                text_representation: textToEmbed
            };

            vectors.push({
                id: inf.id,
                values: embedding,
                metadata: metadata
            });
            
            // Progress log
            console.log(`Processed ${vectors.length} / ${validInfluencers.length}: ${profile.name}`);
        } catch (err) {
            console.error(`\n❌ Error embedding ${profile.name}:`, err.message);
        }
        
        // Add delay to avoid rate limits (approx 1s)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n\nPrepared ${vectors.length} vectors.`);

    if (vectors.length > 0) {
        console.log("Upserting to Pinecone (Existing IDs will be updated)...");
        const BATCH_SIZE = 50;
        for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
            const batch = vectors.slice(i, i + BATCH_SIZE);
            await index.upsert(batch);
            console.log(`Upserted batch ${i / BATCH_SIZE + 1} (${batch.length} records)`);
        }
        console.log("✅ Upload complete!");
    }
}

seedPinecone();
