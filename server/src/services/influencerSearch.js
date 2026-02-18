/**
 * Influencer Search Service — v3 (Production-Grade)
 * 
 * 5-Factor Weighted Scoring Engine:
 *   FinalScore = 0.35 × RelevanceScore 
 *              + 0.25 × EngagementScore
 *              + 0.20 × AudienceMatch
 *              + 0.10 × HistoricalROI
 *              + 0.10 × ConsistencyIndex
 * 
 * All sub-scores normalized 0–100 before weighting.
 * Hard reject if niche specified but influencer doesn't match category.
 */

import { getIndex } from "../core/pinecone.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Embedding ───────────────────────────────────────────────────────────────
async function getQueryEmbedding(query) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(query);
    return result.embedding.values;
}

// ─── Niche Keyword Map ───────────────────────────────────────────────────────
const NICHE_KEYWORDS = {
    fashion:    ["fashion","style","outfit","clothing","apparel","ootd","wear","wardrobe","streetwear","kurta","ethnic"],
    beauty:     ["beauty","makeup","cosmetics","lipstick","foundation","blush","contour","eyeshadow"],
    skincare:   ["skincare","skin care","serum","moisturizer","sunscreen","acne","glow","derma","spf","retinol"],
    fitness:    ["fitness","gym","workout","health","wellness","yoga","exercise","bodybuilding","protein","run"],
    lifestyle:  ["lifestyle","daily","vlog","routine","living","home","decor","motivation","mindset"],
    food:       ["food","recipe","cooking","chef","baking","restaurant","cuisine","eat","kitchen","foodie"],
    tech:       ["tech","technology","gadget","phone","laptop","review","unboxing","coding","software","ai"],
    travel:     ["travel","wanderlust","explore","destination","trip","adventure","tourism","hotel"],
    gaming:     ["gaming","game","esports","twitch","stream","playstation","xbox","pc","fps"],
    education:  ["education","learning","study","course","tutorial","knowledge","skill","upsc"],
    finance:    ["finance","money","investing","stocks","crypto","budget","savings","wealth","trading"],
    automotive: ["car","auto","vehicle","drive","motorcycle","bike","automobile","ev"],
    luxury:     ["luxury","premium","high-end","elite","exclusive","designer","jewellery","watches"],
    parenting:  ["parenting","mom","dad","baby","kids","family","motherhood","pregnancy"],
    comedy:     ["comedy","funny","humor","meme","entertainment","sketch","roast"],
    dance:      ["dance","choreography","moves","dancing","performance","classical"],
    music:      ["music","singer","artist","song","musician","band","rap","bollywood"],
    science:    ["science","space","rocket","isro","nasa","astronomy","physics","chemistry","biology","research","lab","scientist","tech"],
    art:        ["art","illustration","painting","design","creative","digital art"],
};

function extractNiches(text) {
    const lower = text.toLowerCase();
    const found = new Set();
    for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) found.add(niche);
    }
    return [...found];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING ENGINE — 5 Factor Model (all return 0–100 normalized)
// ═══════════════════════════════════════════════════════════════════════════════

const WEIGHTS = {
    relevance:    0.60, // Boosted to prioritize semantic fit over engagement
    engagement:   0.15,
    audience:     0.15,
    historicalROI: 0.05,
    consistency:  0.05,
};

/**
 * Factor 1: Relevance Score (0–100)
 * Combines niche/category match (60%) + vector similarity (40%)
 * Returns null for HARD REJECT (no niche overlap when niche is specified)
 */
function scoreRelevance(queryNiches, influencer, pineconeScore) {
    // Category matching
    let categoryScore;
    if (queryNiches.length === 0) {
        categoryScore = 50; // No niche filter = neutral
    } else {
        const infText = [
            influencer.niche     || "",
            influencer.brand_fit || "",
            influencer.vibe      || "",
            influencer.text      || "",
        ].join(" ").toLowerCase();

        const infNiches = extractNiches(infText);
        const overlap   = queryNiches.filter(n => infNiches.includes(n));

        // If no overlap, we don't reject anymore. Strict categorization causes 0 results.
        // Instead, we give a low category score (0) but let vector similarity save the match.
        if (overlap.length === 0) {
            categoryScore = 0; 
        } else {
            categoryScore = Math.round((overlap.length / queryNiches.length) * 100);
        }
    }

    // Blend: 30% category + 70% vector
    // Even if categoryScore is 0 (no keyword match), vector similarity (0-1) * 100 gives points.
    return Math.round(categoryScore * 0.3 + (pineconeScore * 100) * 0.7);
}

/**
 * Factor 2: Engagement Score (0–100)
 * Based on engagement rate with follower tier context
 */
function scoreEngagement(inf) {
    const er  = parseFloat(inf.engagement_rate) || 0;
    const flw = parseInt(inf.followers)         || 0;

    let score;
    if (er >= 8)      score = 100;
    else if (er >= 6) score = 90;
    else if (er >= 4) score = 75;
    else if (er >= 3) score = 65;
    else if (er >= 2) score = 55;
    else if (er >= 1) score = 35;
    else if (er > 0)  score = 20;
    else              score = 25; // No data = neutral-low

    // Penalty: mega accounts with zero ER are suspicious
    if (flw > 1_000_000 && er === 0) score = Math.max(0, score - 30);

    // Bonus: micro/nano with high ER = authentic
    if (flw < 100_000 && er >= 5) score = Math.min(100, score + 10);

    // Views-to-followers ratio bonus
    const avgViews = parseInt(inf.avg_views) || 0;
    if (flw > 0 && avgViews > 0) {
        const viewRatio = avgViews / flw;
        if (viewRatio >= 0.3) score = Math.min(100, score + 10);
        else if (viewRatio >= 0.1) score = Math.min(100, score + 5);
    }

    return Math.min(Math.max(score, 0), 100);
}

/**
 * Factor 3: Audience Match (0–100)
 * Gender alignment + age alignment + location signals
 */
function scoreAudience(queryText, inf) {
    let score = 50; // Base = neutral
    const q   = queryText.toLowerCase();
    const mf  = (inf.mf_split          || "").toLowerCase();
    const age = (inf.age_concentration || "").toLowerCase();
    const loc = (inf.location          || "").toLowerCase();

    // Gender alignment
    const wantsFemale = /\b(women|female|girl)\b/.test(q);
    const wantsMale   = /\b(men|male|boy)\b/.test(q);
    const hasFemale   = /\bf\b|female|woman/.test(mf);
    const hasMale     = /\bm\b|male|man/.test(mf);

    if      (wantsFemale && hasFemale) score += 25;
    else if (wantsFemale && hasMale)   score -= 20;
    else if (wantsMale   && hasMale)   score += 25;
    else if (wantsMale   && hasFemale) score -= 20;

    // Age alignment
    const ageReq = q.match(/(\d{2})\s*[-–]\s*(\d{2})/);
    if (ageReq && age) {
        const targetLow  = parseInt(ageReq[1]);
        const targetHigh = parseInt(ageReq[2]);
        const nums = [...age.matchAll(/\d+/g)].map(m => parseInt(m[0]));
        const inRange = nums.some(a => a >= targetLow - 5 && a <= targetHigh + 5);
        if (inRange) score += 15;
        else         score -= 10;
    }

    // Location alignment
    const locationKeywords = q.match(/\b(delhi|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|india|usa|uk|dubai|global)\b/gi);
    if (locationKeywords && loc) {
        const locMatch = locationKeywords.some(lk => loc.includes(lk.toLowerCase()));
        if (locMatch) score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
}

/**
 * Factor 4: Historical ROI (0–100)
 * Inferred from available metadata since explicit ROI data isn't in Pinecone
 */
function scoreHistoricalROI(inf) {
    let score = 40; // Base = unknown history

    // Has commercials/campaign history?
    const commercials = (inf.commercials || "").trim();
    if (commercials && commercials !== "-" && commercials !== "NA") {
        const campaignCount = commercials.split(/[,;|]/).filter(c => c.trim()).length;
        if (campaignCount >= 5) score = 90;
        else if (campaignCount >= 3) score = 75;
        else if (campaignCount >= 1) score = 60;
    }

    // Tier-based reliability factor
    const tier = (inf.follower_tier || "").toLowerCase();
    if (tier === "mega" || tier === "macro") score = Math.min(100, score + 10);

    // Contact info = brand-ready professional
    if (inf.email && inf.contact_no) score = Math.min(100, score + 10);
    else if (inf.email || inf.contact_no) score = Math.min(100, score + 5);

    return Math.min(Math.max(score, 0), 100);
}

/**
 * Factor 5: Consistency Index (0–100)
 * Signals of consistent content creation and engagement stability
 */
function scoreConsistency(inf) {
    let score = 50; // Base = unknown

    const er      = parseFloat(inf.engagement_rate) || 0;
    const flw     = parseInt(inf.followers)         || 0;
    const views   = parseInt(inf.avg_views)         || 0;

    // Engagement rate in healthy range = consistent creator
    if (er >= 1 && er <= 10) score += 20;  // Healthy ER range
    else if (er > 10) score += 10;         // Viral but potentially inconsistent

    // Has profile data filled = active creator
    const profileCompleteness = [
        inf.niche, inf.brand_fit, inf.vibe, inf.location,
        inf.mf_split, inf.age_concentration
    ].filter(Boolean).length;
    score += Math.min(profileCompleteness * 5, 20);

    // Views consistency signal
    if (flw > 0 && views > 0) {
        const ratio = views / flw;
        if (ratio >= 0.05 && ratio <= 0.5) score += 10; // Healthy views ratio
    }

    return Math.min(Math.max(score, 0), 100);
}

// ─── Main Scoring Function ───────────────────────────────────────────────────
export function computeMatchScore(queryText, influencer, pineconeScore) {
    const qNiches = extractNiches(queryText);

    // Factor 1: Relevance (returns null = HARD REJECT)
    const relevance = scoreRelevance(qNiches, influencer, pineconeScore);
    if (relevance === null) return null;

    // Factors 2–5
    const engagement  = scoreEngagement(influencer);
    const audience    = scoreAudience(queryText, influencer);
    const roi         = scoreHistoricalROI(influencer);
    const consistency = scoreConsistency(influencer);

    // Weighted sum
    const total = Math.round(
        WEIGHTS.relevance     * relevance +
        WEIGHTS.engagement    * engagement +
        WEIGHTS.audience      * audience +
        WEIGHTS.historicalROI * roi +
        WEIGHTS.consistency   * consistency
    );

    const finalScore = Math.min(total, 100);

    return {
        total: finalScore,
        breakdown: {
            relevance:     { score: relevance,   weight: "35%", max: 100 },
            engagement:    { score: engagement,   weight: "25%", max: 100 },
            audience:      { score: audience,     weight: "20%", max: 100 },
            historicalROI: { score: roi,          weight: "10%", max: 100 },
            consistency:   { score: consistency,  weight: "10%", max: 100 },
        },
        tier: finalScore >= 80 ? "A" : finalScore >= 60 ? "B" : "C",
        confidence: relevance >= 50 ? "high" : relevance >= 30 ? "medium" : "low",
    };
}

// ─── Query Builder ───────────────────────────────────────────────────────────
export function buildSearchQuery(message, context = "") {
    const c = `${message} ${context}`.toLowerCase();
    const p = [];
    const n = c.match(/\b(fashion|beauty|skincare|fitness|lifestyle|food|tech|travel|gaming|education|finance|health|automotive|luxury|parenting|comedy|dance|music|art|photography|vlog|review)\b/gi);
    if (n) p.push(`niche: ${[...new Set(n)].join(", ")}`);
    const l = c.match(/\b(delhi|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|pan[- ]?india|india|gurgaon|noida)\b/gi);
    if (l) p.push(`location: ${[...new Set(l)].join(", ")}`);
    const g = c.match(/\b(male|female|women|men|girls|boys)\b/gi);
    if (g) p.push(`audience: ${[...new Set(g)].join(", ")}`);
    const t = c.match(/\b(nano|micro|mid[- ]?tier|macro|mega)\b/gi);
    if (t) p.push(`tier: ${[...new Set(t)].join(", ")}`);
    return p.length > 0 ? `Find influencers: ${p.join(". ")}. Context: ${message}` : message;
}

export function getDynamicTopK(msg, ctx = "") {
    const t = `${msg} ${ctx}`.toLowerCase();
    if (/\b(show|all|list|every|many|browse|explore)\b/i.test(t)) return 15;
    if (/\b(more|filter|refine|another|similar)\b/i.test(t))      return 10;
    if (/\b(best|top|one|perfect|ideal|exact)\b/i.test(t))        return 5;
    return 10;
}

export function buildMetadataFilter(msg, ctx = "") {
    const t = `${msg} ${ctx}`.toLowerCase();
    const m = { nano:"nano", micro:"micro", mid:"mid", macro:"macro", mega:"mega", small:"nano", big:"macro", large:"mega" };
    for (const [k, v] of Object.entries(m)) {
        if (t.includes(k)) return { follower_tier: { $eq: v } };
    }
    return undefined;
}

// ─── Main Search Function ────────────────────────────────────────────────────
export async function searchInfluencers(query, topK = 10, context = "", explicitFilter = null) {
    const index = getIndex();
    if (!index) { console.warn("⚠️  Pinecone not configured"); return []; }

    try {
        const sq        = buildSearchQuery(query, context);
        const embedding = await getQueryEmbedding(sq);
        const builtFilter = buildMetadataFilter(query, context);
        const fetchK    = Math.min(topK * 4, 100);

        const qp = { vector: embedding, topK: fetchK, includeMetadata: true };
        
        // Merge explicit filter with built filter (explicit takes precedence)
        const filter = { ...builtFilter, ...explicitFilter };
        if (Object.keys(filter).length > 0) qp.filter = filter;

        console.log(`🔍 Search Query: "${sq}"`);
        if (Object.keys(filter).length > 0) console.log(`🔍 Filters:`, JSON.stringify(filter));

        console.log(`🔍 Fetching ${fetchK} candidates from Pinecone…`);
        const res = await index.query(qp);
        const all = res.matches || [];
        if (all.length)
            console.log(`📊 Score range: ${all[0]?.score?.toFixed(3)} → ${all[all.length-1]?.score?.toFixed(3)}`);

        const fullQ  = `${query} ${context}`;
        const scored = [];

        for (const m of all) {
            const inf    = m.metadata || {};
            const result = computeMatchScore(fullQ, inf, m.score);
            if (!result)           { console.log(`  ❌ Rejected (niche): ${inf.name}`);            continue; }

            // STRICT RELEVANCE CHECK: Even if total score is high due to engagement, 
            // if relevance is too low (< 25), filter it out. 
            // This prevents "Fashion" influencers showing up for "ISRO".
            if (result.breakdown.relevance.score < 25) { 
                console.log(`  ❌ Low relevance (${result.breakdown.relevance.score}): ${inf.name}`); 
                continue; 
            }

            if (result.total < 20) { console.log(`  ⚠️  Low score (${result.total}): ${inf.name}`); continue; }
            scored.push({
                ...inf,
                pinecone_score: m.score,
                match_score: result.total,
                score_breakdown: result.breakdown,
                tier_rank: result.tier,
                match_confidence: result.confidence,
            });
        }

        scored.sort((a, b) => b.match_score - a.match_score);
        const final = scored.slice(0, topK);
        console.log(`✅ Returning ${final.length} influencers (from ${all.length} candidates)`);
        return final;

    } catch (err) {
        console.error("❌ Search error:", err.message);
        return [];
    }
}

// ─── Format for Chat Context ─────────────────────────────────────────────────
export function formatSearchResults(results) {
    if (!results.length) return "\n[No matching influencers found in the database.]";

    let ctx = `\n\n--- TOP ${results.length} MATCHING INFLUENCERS FROM DATABASE ---\n(Use ONLY this data.)\n`;
    results.forEach((inf, i) => {
        const bd = inf.score_breakdown || {};
        ctx += `\n═══ INFLUENCER ${i+1} ═══`;
        ctx += `\n  Name: ${inf.name || "Unknown"}`;
        ctx += `\n  Match Score: ${inf.match_score}%  (Tier: ${inf.tier_rank || "-"})`;
        ctx += `\n  Breakdown: Relevance ${bd.relevance?.score||0}/100 | Engagement ${bd.engagement?.score||0}/100 | Audience ${bd.audience?.score||0}/100 | ROI ${bd.historicalROI?.score||0}/100 | Consistency ${bd.consistency?.score||0}/100`;
        if (inf.instagram)         ctx += `\n  Instagram: ${inf.instagram}`;
        if (inf.location)          ctx += `\n  Location: ${inf.location}`;
        if (inf.gender)            ctx += `\n  Gender: ${inf.gender}`;
        if (inf.type)              ctx += `\n  Type/Tier: ${inf.type}`;
        if (inf.niche)             ctx += `\n  Niche: ${inf.niche}`;
        if (inf.brand_fit)         ctx += `\n  Brand Fit: ${inf.brand_fit}`;
        if (inf.vibe)              ctx += `\n  Vibe: ${inf.vibe}`;
        if (inf.followers)         ctx += `\n  Followers: ${Number(inf.followers).toLocaleString()}`;
        if (inf.follower_tier)     ctx += `\n  Tier: ${inf.follower_tier}`;
        if (inf.avg_views)         ctx += `\n  Avg Views: ${Number(inf.avg_views).toLocaleString()}`;
        if (inf.engagement_rate)   ctx += `\n  ER: ${inf.engagement_rate}%`;
        if (inf.mf_split)          ctx += `\n  M/F Split: ${inf.mf_split}`;
        if (inf.age_concentration) ctx += `\n  Age Group: ${inf.age_concentration}`;
        if (inf.commercials && inf.commercials !== "-") ctx += `\n  Past Campaigns: ${inf.commercials}`;
        if (inf.contact_no)        ctx += `\n  Phone: ${inf.contact_no}`;
        if (inf.email)             ctx += `\n  Email: ${inf.email}`;
    });
    ctx += `\n\n--- END ---`;
    return ctx;
}

// ─── Format for Frontend API ─────────────────────────────────────────────────
export function formatForSearchAPI(results) {
    return results.map((inf, idx) => ({
        id:              inf.id || String(idx + 1),
        name:            inf.name || "Unknown",
        handle:          inf.instagram ? `@${inf.instagram.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, "").replace(/\/$/, "").replace("@", "")}` : null,
        instagram_url:   inf.instagram || null,
        youtube_url:     inf.youtube || null,
        tiktok_url:      inf.tiktok || null,
        location:        inf.location || null,
        gender:          inf.gender || null,
        type:            inf.type || null,
        niche:           inf.niche || null,
        brand_fit:       inf.brand_fit || null,
        vibe:            inf.vibe || null,
        followers:       parseInt(inf.followers) || 0,
        follower_tier:   inf.follower_tier || null,
        avg_views:       parseInt(inf.avg_views) || 0,
        engagement_rate: parseFloat(inf.engagement_rate) || 0,
        mf_split:        inf.mf_split || null,
        age_concentration: inf.age_concentration || null,
        commercials:     inf.commercials || null,
        contact: {
            phone: inf.contact_no || null,
            email: inf.email || null,
        },
        match: {
            score:      inf.match_score || 0,
            tier:       inf.tier_rank || "C",
            confidence: inf.match_confidence || "low",
            reasons:    [],
            warnings:   [],
        },
        score_breakdown: inf.score_breakdown || {},
    }));
}