import dotenv from 'dotenv';
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

async function test() {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.index(process.env.PINECONE_INDEX || "campnai-influencers");
    
    console.log("Fetching stats...");
    const stats = await index.describeIndexStats();
    console.log("Stats:", stats);

    const total = stats.totalRecordCount || 5000;
    
    console.log(`Querying with topK: ${total}`);
    // Create a dummy embedded vector (like Gemini embedding 0s)
    const res = await index.query({
        vector: Array(3072).fill(0),
        topK: total,
        includeMetadata: true
    });
    
    console.log(`Returned match count: ${res.matches.length}`);
    
    let techCount = 0;
    let businessCount = 0;
    for (let m of res.matches) {
        let niche = (m.metadata.niche || "").toLowerCase();
        let brandFit = (m.metadata.brand_fit || "").toLowerCase();
        if (niche.includes("tech") || brandFit.includes("tech")) {
            techCount++;
        }
        if (niche.includes("business")) {
            businessCount++;
        }
    }
    
    console.log(`Found ${techCount} tech creators and ${businessCount} business creators in the returned matches.`);
}

test().catch(console.error);
