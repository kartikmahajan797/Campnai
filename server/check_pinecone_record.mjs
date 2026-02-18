import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX || "campnai-influencers";

if (!apiKey) {
    console.error("❌ Missing PINECONE_API_KEY");
    process.exit(1);
}

const pc = new Pinecone({ apiKey });
const index = pc.index(indexName);

async function run() {
    try {
        console.log(`Listing IDs from index: ${indexName}...`);
        // List paginated (default limit 10)
        const listResult = await index.listPaginated({ limit: 10 });
        
        if (!listResult || !listResult.vectors || listResult.vectors.length === 0) {
            console.log("❌ No vectors found in index.");
            return;
        }

        console.log(`✅ Found ${listResult.vectors.length} vectors.`);
        const firstId = listResult.vectors[0].id;
        console.log(`First ID: "${firstId}"`);
        console.log("All IDs found:", listResult.vectors.map(v => v.id).join(", "));

        console.log(`\nFetching full record for ID: "${firstId}"...`);
        const fetchResult = await index.fetch([firstId]);
        
        if (fetchResult && fetchResult.records && fetchResult.records[firstId]) {
            const record = fetchResult.records[firstId];
            console.log("\n✅ Record Details:");
            console.log(JSON.stringify(record, null, 2));
        } else {
            console.log(`❌ Failed to fetch record for ID: "${firstId}"`);
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
