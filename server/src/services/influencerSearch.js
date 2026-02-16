/**
 * Influencer Search Service — Uses Pinecone to find matching influencers.
 * All recommendations are fetched dynamically — no hardcoded data.
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

// ─── Build search query from campaign context ─────────────────────────
export function buildSearchQuery(message, conversationContext = "") {
    const combined = `${message} ${conversationContext}`.toLowerCase();

    // Extract structured requirements from conversation
    const parts = [];

    // Niche detection
    const nicheKeywords = combined.match(
        /\b(fashion|beauty|skincare|fitness|lifestyle|food|tech|travel|gaming|education|finance|health|automotive|luxury|parenting|comedy|dance|music|art|photography|vlog|review)\b/gi
    );
    if (nicheKeywords) parts.push(`niche: ${[...new Set(nicheKeywords)].join(", ")}`);

    // Location detection
    const locationMatch = combined.match(
        /\b(delhi|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|lucknow|ahmedabad|pan[- ]?india|india|gurgaon|noida|chandigarh)\b/gi
    );
    if (locationMatch) parts.push(`location: ${[...new Set(locationMatch)].join(", ")}`);

    // Audience detection
    const genderMatch = combined.match(/\b(male|female|women|men|girls|boys)\b/gi);
    if (genderMatch) parts.push(`target audience: ${[...new Set(genderMatch)].join(", ")}`);

    const ageMatch = combined.match(/\b(\d{2}[-–]\d{2})\b/g);
    if (ageMatch) parts.push(`age group: ${ageMatch.join(", ")}`);

    // Tier detection
    const tierMatch = combined.match(/\b(nano|micro|mid[- ]?tier|macro|mega|big|small|large)\b/gi);
    if (tierMatch) parts.push(`influencer size: ${[...new Set(tierMatch)].join(", ")}`);

    // Build the query — use extracted parts + original message
    const structuredQuery = parts.length > 0
        ? `Find influencers: ${parts.join(". ")}. Context: ${message}`
        : message;

    return structuredQuery;
}

// ─── Build Pinecone metadata filter from context ──────────────────────
export function buildMetadataFilter(message, conversationContext = "") {
    const combined = `${message} ${conversationContext}`.toLowerCase();
    const filters = {};

    // Follower tier filter
    const tierMap = {
        nano: "nano", micro: "micro", mid: "mid", macro: "macro", mega: "mega",
        small: "nano", big: "macro", large: "mega",
    };
    for (const [keyword, tier] of Object.entries(tierMap)) {
        if (combined.includes(keyword)) {
            filters.follower_tier = { $eq: tier };
            break;
        }
    }

    // Only return filters if we have meaningful ones
    return Object.keys(filters).length > 0 ? filters : undefined;
}

// ─── Determine dynamic topK based on query specificity ────────────────
export function getDynamicTopK(message, conversationContext = "") {
    const combined = `${message} ${conversationContext}`.toLowerCase();

    // Broad queries get more results
    const broadPatterns = /\b(show|all|list|every|many|several|lots|browse|explore|discover)\b/i;
    // Specific queries get fewer, more precise results
    const specificPatterns = /\b(best|top|one|single|perfect|ideal|specific|exact)\b/i;
    // Follow-up / refinement queries
    const refinementPatterns = /\b(more|filter|narrow|refine|different|another|also|similar)\b/i;

    if (broadPatterns.test(combined)) return 15;
    if (refinementPatterns.test(combined)) return 10;
    if (specificPatterns.test(combined)) return 5;
    return 10; // default
}

// ─── Search influencers by query ─────────────────────────────────────
export async function searchInfluencers(query, topK = 10, conversationContext = "") {
    const index = getIndex();
    if (!index) {
        console.warn("Pinecone not available, falling back to empty results");
        return [];
    }

    try {
        // Build an optimized search query from campaign context
        const searchQuery = buildSearchQuery(query, conversationContext);
        const embedding = await getQueryEmbedding(searchQuery);

        // Build optional metadata filters
        const filter = buildMetadataFilter(query, conversationContext);

        const queryParams = {
            vector: embedding,
            topK,
            includeMetadata: true,
        };
        if (filter) queryParams.filter = filter;

        console.log(`🔍 Pinecone search: topK=${topK}, filter=${JSON.stringify(filter || "none")}, query="${searchQuery.slice(0, 80)}..."`);

        const results = await index.query(queryParams);

        // Filter out very low-relevance matches (below 0.2 threshold)
        // NOTE: 0.4 was too aggressive — many relevant results for generic queries
        // (e.g. "fashion", "D2C apparel") score between 0.2-0.4 with embeddings.
        const SCORE_THRESHOLD = 0.2;
        const allMatches = results.matches || [];
        if (allMatches.length > 0) {
            console.log(`📊 Score range: ${allMatches[0]?.score?.toFixed(3)} (best) → ${allMatches[allMatches.length - 1]?.score?.toFixed(3)} (worst)`);
        }
        const matches = allMatches
            .filter((match) => match.score >= SCORE_THRESHOLD)
            .map((match) => ({
                score: match.score,
                ...match.metadata,
            }));

        console.log(`📊 Pinecone returned ${results.matches?.length || 0} results, ${matches.length} above threshold`);

        return matches;
    } catch (err) {
        console.error("Pinecone search error:", err.message);
        return [];
    }
}

// ─── Format search results for AI context ─────────────────────────────
export function formatSearchResults(results) {
    if (!results.length) return "\n[No matching influencers found in the database.]";

    let context = `\n\n--- TOP ${results.length} MATCHING INFLUENCERS FROM DATABASE ---\n`;
    context += `(All data below is from the pre-embedded influencer database. Use ONLY this data.)\n`;

    results.forEach((inf, i) => {
        const score = ((inf.score || 0) * 100).toFixed(1);
        context += `\n═══ INFLUENCER ${i + 1} ═══`;
        context += `\n  Name: ${inf.name || "Unknown"}`;
        context += `\n  Match Score: ${score}%`;
        if (inf.instagram) context += `\n  Instagram: ${inf.instagram}`;
        if (inf.location) context += `\n  Location: ${inf.location}`;
        if (inf.gender) context += `\n  Gender: ${inf.gender}`;
        if (inf.type) context += `\n  Type/Tier: ${inf.type}`;
        if (inf.niche) context += `\n  Niche: ${inf.niche}`;
        if (inf.brand_fit) context += `\n  Brand Fit: ${inf.brand_fit}`;
        if (inf.vibe) context += `\n  Vibe/Style: ${inf.vibe}`;
        if (inf.followers) context += `\n  Followers: ${Number(inf.followers).toLocaleString()}`;
        if (inf.follower_tier) context += `\n  Follower Tier: ${inf.follower_tier}`;
        if (inf.avg_views) context += `\n  Avg Views: ${Number(inf.avg_views).toLocaleString()}`;
        if (inf.engagement_rate) context += `\n  Engagement Rate: ${inf.engagement_rate}%`;
        if (inf.mf_split) context += `\n  M/F Split: ${inf.mf_split}`;
        if (inf.india_split) context += `\n  India Split: ${inf.india_split}`;
        if (inf.age_concentration) context += `\n  Age Concentration: ${inf.age_concentration}`;
        if (inf.commercials && inf.commercials !== "-") context += `\n  Past Campaigns: ${inf.commercials}`;
        if (inf.contact_no) context += `\n  Phone: ${inf.contact_no}`;
        if (inf.email) context += `\n  Email: ${inf.email}`;
    });

    context += `\n\n--- END OF DATABASE RESULTS ---`;
    context += `\n\nIMPORTANT: The above influencer profiles are the ONLY ones you may reference. Do NOT fabricate or invent additional profiles.`;
    return context;
}
