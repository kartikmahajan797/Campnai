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
export async function searchInfluencers(query, topK = 10, conversationContext = "", explicitFilter = null) {
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
        let filter = buildMetadataFilter(query, conversationContext);
        
        // Merge explicit filter (e.g., from Brand Analysis)
        if (explicitFilter) {
            filter = filter || {};
            
            // Handle Niche Mapping:
            // Pinecone data only has: "Fashion", "Tech", "Food", "Lifestyle".
            // If AI says "Nutrition", we should map to "Food" or "Health" if available.
            // Since we know we have NO Health/Fitness data, we have two choices:
            // 1. Strict: Return 0 results (User asked for "better precision").
            // 2. Fuzzy: Map to "Lifestyle" or "Food".
            
            // Let's go with Strict for now as per user request ("why fashion for nutrition?").
            // But we can do some basic mapping to available categories.
            let targetNiche = explicitFilter.niche?.toLowerCase();
            
            // Map common AI outputs to our limited DB categories
            // FIX: Nutrition should map to 'fitness', not 'food' (supplements != recipes)
            const categoryMap = {
                "nutrition": "fitness",
                "diet": "fitness",
                "health": "fitness",
                "wellness": "lifestyle",
                "apparel": "fashion",
                "clothing": "fashion",
                "wear": "fashion",
                "technology": "tech",
                "software": "tech",
                "gadgets": "tech",
                "electronics": "tech",
                "audio": "tech",
                "headphones": "tech",
                "ai": "tech"
            };

            if (categoryMap[targetNiche]) {
                targetNiche = categoryMap[targetNiche];
            }
        }

        const queryParams = {
            vector: embedding,
            topK,
            includeMetadata: true,
        };
        // We do NOT use Pinecone's strict filter because data is messy (csv strings).
        // Instead we allow broad fetch and filter/penalize in JS.
        // if (filter && Object.keys(filter).length > 0) queryParams.filter = filter;

        console.log(`🔍 Pinecone search: topK=${topK}, query="${searchQuery.slice(0, 80)}..."`);

        const results = await index.query(queryParams);
        const allMatches = results.matches || [];
        
        let processedMatches = allMatches.map(match => {
            let finalScore = match.score || 0;
            const metaNiche = (match.metadata?.niche || "").toLowerCase();
            const metaFit = (match.metadata?.brand_fit || "").toLowerCase();
            const combinedMeta = metaNiche + " " + metaFit;

            // NICHE PENALTY LOGIC
            if (explicitFilter?.niche) {
                let target = explicitFilter.niche.toLowerCase();
                 // Re-map target again if needed (duplicate logic but safe)
                const categoryMap = {
                    "nutrition": "fitness", 
                    "diet": "fitness",
                    "health": "fitness",
                    "apparel": "fashion", "clothing": "fashion", "wear": "fashion",
                    "technology": "tech", "software": "tech", "gadgets": "tech", "electronics": "tech", "audio": "tech", "ai": "tech"
                };
                if (categoryMap[target]) target = categoryMap[target];

                // Check for match
                const isMatch = combinedMeta.includes(target);
                
                if (isMatch) {
                    // Boost exact niche matches
                    finalScore += 0.2; 
                } else {
                    // HEAVY PENALTY for mismatch
                    
                    // 1. Check if the TARGET itself is supported in our DB
                    // We only have: Tech, Fashion, Fitness, Food, Travel, Lifestyle.
                    // If the user wants "Pet Care", "Real Estate", "Automotive" -> We should show NOTHING.
                    const SUPPORTED_NICHES = ['tech', 'fashion', 'fitness', 'food', 'travel', 'lifestyle', 'finance'];
                    
                    // Simple check: Is the meaningful part of the target in our supported list?
                    // (We already mapped nutrition->fitness, etc.)
                    const isSupported = SUPPORTED_NICHES.some(s => target.includes(s));
                    
                    if (!isSupported) {
                        // UNKNOWN CATEGORY -> KILL IT
                        // If we don't support "Pet Care", don't show "Fashion".
                        // Apply massive penalty to force 0 results.
                        finalScore -= 0.9; 
                        console.log(`⚠️ Unsupported Niche '${target}': Applying kill penalty.`);
                    } else {
                         // Supported category, just wrong influencer? (e.g. Tech vs Fashion)
                        if (target === 'tech' && !combinedMeta.includes('tech') && !combinedMeta.includes('ai')) {
                            finalScore -= 0.4; // Tech is distinct.
                        }
                        else if (target === 'food' && !combinedMeta.includes('food')) {
                            finalScore -= 0.4; // Food is distinct.
                        }
                         else if (target === 'fitness' && !combinedMeta.includes('fitness') && !combinedMeta.includes('health')) {
                            finalScore -= 0.4; // Fitness is distinct.
                        }
                        else {
                            // General mismatch
                            finalScore -= 0.2;
                        }
                    }
                }
            }
            
            return {
                ...match,
                score: Math.max(0, Math.min(0.99, finalScore)) // Clamp between 0 and 0.99
            };
        });

        // Re-sort after penalty
        processedMatches.sort((a, b) => b.score - a.score);

        const SCORE_THRESHOLD = 0.5; // High threshold for production precision
        const matches = processedMatches
            .filter((match) => match.score >= SCORE_THRESHOLD)
            .map((match) => ({
                score: match.score,
                ...match.metadata,
            }));

        console.log(`📊 Pinecone returned ${allMatches.length} raw, ${matches.length} after Niche Logic (Threshold ${SCORE_THRESHOLD})`);

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
