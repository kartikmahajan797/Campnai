import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient = null;

// Cached total record count — refreshed every 5 minutes
let _cachedTotalRecords = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

/**
 * Returns the ACTUAL total number of vectors in the Pinecone index.
 * Cached for 5 minutes so we don't hit the stats API on every search.
 */
export async function getTotalRecordCount() {
    const now = Date.now();
    if (_cachedTotalRecords !== null && (now - _cachedAt) < CACHE_TTL_MS) {
        return _cachedTotalRecords;
    }

    try {
        const index = getIndex();
        if (!index) return 10000; // fallback

        const stats = await index.describeIndexStats();
        // totalRecordCount is the total number of vectors across all namespaces
        const total = stats.totalRecordCount || stats.namespaces?.[""]?.recordCount || 0;
        _cachedTotalRecords = total;
        _cachedAt = now;
        console.log(`📊 Pinecone total records: ${total} (cached for 5 min)`);
        return total;
    } catch (err) {
        console.warn("⚠️  Could not fetch Pinecone stats:", err.message);
        return _cachedTotalRecords || 10000;
    }
}
