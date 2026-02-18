import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function clearIndex() {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX || "campnai-influencers";

    if (!apiKey) {
        console.error("❌ PINECONE_API_KEY not found in environment variables.");
        process.exit(1);
    }

    console.log(`⚠️  WARNING: You are about to DELETE ALL VECTORS from index: ${indexName}`);
    console.log("Starting deletion...");

    try {
        const pc = new Pinecone({ apiKey });
        const index = pc.index(indexName);

        // Delete all vectors in the namespace (default namespace usually)
        await index.deleteAll();
        
        console.log("✅ Successfully cleared all vectors from Pinecone index.");
    } catch (error) {
        console.error("❌ Error clearing index:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
        process.exit(1);
    }
}

clearIndex();
