import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient = null;

export function getPinecone() {
    if (!pineconeClient) {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            console.warn("⚠️  PINECONE_API_KEY not set. Vector search disabled.");
            return null;
        }
        pineconeClient = new Pinecone({ apiKey });
    }
    return pineconeClient;
}

export function getIndex() {
    const pc = getPinecone();
    if (!pc) return null;
    const indexName = process.env.PINECONE_INDEX || "campnai-influencers";
    return pc.index(indexName);
}