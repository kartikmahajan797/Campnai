/**
 * Influencer Search Service — Uses Pinecone to find matching influencers.
 */

import { getIndex } from "../core/pinecone.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Generate query embedding ────────────────────────────────────────
async function getQueryEmbedding(query) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(query);
    return result.embedding.values;
}

// ─── Search influencers by query ─────────────────────────────────────
export async function searchInfluencers(query, topK = 5) {
    const index = getIndex();
    if (!index) {
        console.warn("Pinecone not available, falling back to empty results");
        return [];
    }

    try {
        const embedding = await getQueryEmbedding(query);

        const results = await index.query({
            vector: embedding,
            topK,
            includeMetadata: true,
        });

        // Format results for the AI prompt
        return (results.matches || []).map((match) => ({
            score: match.score,
            ...match.metadata,
        }));
    } catch (err) {
        console.error("Pinecone search error:", err.message);
        return [];
    }
}

// ─── Format search results for AI context ─────────────────────────────
export function formatSearchResults(results) {
    if (!results.length) return "\n[No matching influencers found in the database.]";

    let context = `\n\n--- TOP ${results.length} MATCHING INFLUENCERS ---\n`;
    results.forEach((inf, i) => {
        const score = ((inf.score || 0) * 100).toFixed(1);
        context += `\n[${i + 1}] ${inf.name} (Match: ${score}%)`;
        if (inf.instagram) context += ` | IG: ${inf.instagram}`;
        if (inf.location) context += ` | Location: ${inf.location}`;
        if (inf.gender) context += ` | Gender: ${inf.gender}`;
        if (inf.type) context += ` | Type: ${inf.type}`;
        if (inf.niche) context += ` | Niche: ${inf.niche}`;
        if (inf.brand_fit) context += ` | Brand Fit: ${inf.brand_fit}`;
        if (inf.vibe) context += ` | Vibe: ${inf.vibe}`;
        if (inf.followers) context += ` | Followers: ${Number(inf.followers).toLocaleString()}`;
        if (inf.avg_views) context += ` | Avg Views: ${Number(inf.avg_views).toLocaleString()}`;
        if (inf.engagement_rate) context += ` | ER: ${inf.engagement_rate}%`;
        if (inf.mf_split) context += ` | M/F Split: ${inf.mf_split}`;
        if (inf.india_split) context += ` | India Split: ${inf.india_split}`;
        if (inf.age_concentration) context += ` | Age: ${inf.age_concentration}`;
        if (inf.commercials) context += ` | Commercials: ${inf.commercials}`;
        if (inf.contact_no) context += ` | Phone: ${inf.contact_no}`;
        if (inf.email) context += ` | Email: ${inf.email}`;
    });
    context += `\n--- END OF MATCHES ---`;
    return context;
}
