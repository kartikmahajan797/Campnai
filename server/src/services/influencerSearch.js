/**
 * Influencer Search Service — v4 (Production)
 *
 * Scoring Model (5 factors, all 0–100):
 *   FinalScore = 0.35 × Relevance
 *              + 0.25 × Engagement
 *              + 0.20 × AudienceMatch
 *              + 0.10 × PricingFit
 *              + 0.10 × Consistency
 *
 * Key fixes vs v3:
 *  - commercials field = ₹ price (not campaign count) → PricingFit score uses it correctly
 *  - india_split (60/40) = India% / ROW% → now used in AudienceMatch
 *  - brand_fit comma-separated brands → exploded into keyword set for richer matching
 *  - fetchK = ALL records from Pinecone (auto via describeIndexStats)
 *  - Brand URL context injected when present
 */

import { getIndex, getTotalRecordCount } from "../core/pinecone.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Embedding ────────────────────────────────────────────────────────────────
async function getQueryEmbedding(query) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(query);
    return result.embedding.values;
}

// ─── Niche → keyword map ──────────────────────────────────────────────────────
const NICHE_KEYWORDS = {
    fashion:     ["fashion","style","outfit","clothing","apparel","ootd","wear","wardrobe","streetwear","kurta","ethnic","clothes","dress","footwear","eyewear"],
    beauty:      ["beauty","makeup","cosmetics","lipstick","foundation","blush","contour","eyeshadow","kajal","kohl","glam"],
    skincare:    ["skincare","skin care","serum","moisturizer","sunscreen","acne","glow","derma","spf","retinol","face wash","cleanser","skin"],
    haircare:    ["haircare","hair care","shampoo","conditioner","hair oil","hair mask","hair growth","hairstyle"],
    fitness:     ["fitness","gym","workout","health","wellness","yoga","exercise","bodybuilding","protein","run","weight loss","nutrition","diet"],
    lifestyle:   ["lifestyle","daily","vlog","routine","living","home","decor","motivation","mindset","productivity","travel"],
    food:        ["food","recipe","cooking","chef","baking","restaurant","cuisine","eat","kitchen","foodie","snack","beverage","drink","delivery","healthy food","fmcg","packaged food","order food","meal","nutrition","homemade","street food","dessert","sweet"],
    tech:        ["tech","technology","gadget","phone","laptop","review","unboxing","coding","software","ai","app","computer","gaming"],
    travel:      ["travel","wanderlust","explore","destination","trip","adventure","tourism","hotel","backpack","trek"],
    gaming:      ["gaming","game","esports","twitch","stream","playstation","xbox","pc","fps","pubg","bgmi","mobile game"],
    education:   ["education","learning","study","course","tutorial","knowledge","skill","upsc","iit","exam","coaching"],
    finance:     ["finance","money","investing","stocks","crypto","budget","savings","wealth","trading","tax","fintech"],
    automotive:  ["car","auto","vehicle","drive","motorcycle","bike","automobile","ev","suv","engine","road"],
    luxury:      ["luxury","premium","high-end","elite","exclusive","designer","jewellery","watches","gold","silver"],
    parenting:   ["parenting","mom","dad","baby","kids","family","motherhood","pregnancy","toddler","child"],
    comedy:      ["comedy","funny","humor","meme","entertainment","sketch","roast","standup","satire"],
    dance:       ["dance","choreography","moves","dancing","performance","classical","reels dance","bhangra"],
    music:       ["music","singer","artist","song","musician","band","rap","bollywood","indie","playlist"],
    science:     ["science","space","rocket","isro","nasa","astronomy","physics","chemistry","biology","research"],
    art:         ["art","illustration","painting","design","creative","digital art","photography","portrait"],
    sports:      ["sports","cricket","football","ipl","athlete","player","match","tournament","champion","fitness"],
    pets:        ["pets","dog","cat","animals","pet care","vet","puppy","kitten"],
    sustainability: ["sustainability","eco","green","organic","environment","natural","vegan","zero waste"],
    events:      ["events","wedding","party","celebration","festival","concerts","nightlife"],
    restaurants: ["restaurant","cafe","dining","food","eatery","bistro","bar","lounge","fmcg","packaged","beverage","café","diner"],

};

function extractNiches(text) {
    const lower = text.toLowerCase();
    const found = new Set();
    for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) found.add(niche);
    }
    return [...found];
}

// ─── Parse ₹ price string → number ───────────────────────────────────────────
// commercials field = "₹43,000.00" → 43000
function parsePrice(str) {
    if (!str || str === "-" || str === "NA" || str === "") return null;
    const num = parseFloat(str.replace(/[₹,\s]/g, ""));
    return isNaN(num) ? null : num;
}

// ─── Parse india_split "60/40" → India% ──────────────────────────────────────
// india_split means India% / Rest-of-World%
function parseIndiaSplit(str) {
    if (!str) return null;
    const parts = str.split("/").map(s => parseInt(s.trim()));
    if (parts.length >= 1 && !isNaN(parts[0])) return parts[0]; // India %
    return null;
}

// ─── Parse mf_split "60/40" → female% ────────────────────────────────────────
// Assumption: mf_split = Male% / Female% based on field name "mf_split"
function parseMfSplit(str) {
    if (!str) return { male: null, female: null };
    const parts = str.split("/").map(s => parseInt(s.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { male: parts[0], female: parts[1] };
    }
    return { male: null, female: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const WEIGHTS = {
    relevance:   0.35,
    engagement:  0.25,
    audience:    0.20,
    pricingFit:  0.10,
    consistency: 0.10,
};

// ─── Direct brand_fit tag matching ───────────────────────────────────────────
// Extracts brand's required niche categories from brandContext, normalizes them.
// Two-pass approach:
//   Pass 1 — raw comma-separated tags from "brand_fit: ..." (e.g. ["food","restaurants"])
//   Pass 2 — extractNiches() expansion of each tag to handle verbose phrases
//             e.g. "online food delivery" → ['food', 'restaurants']
// Returns a deduped array of known niche keyword strings.
function extractBrandCategories(brandContext) {
    if (!brandContext) return [];

    let rawTags = [];

    // Parse "brand_fit: food,restaurants,lifestyle" from brandContext
    const m = brandContext.match(/brand_fit:\s*([^|\n]+)/i);
    if (m) {
        rawTags = m[1].split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    } else {
        // No brand_fit prefix — treat whole context as free text
        rawTags = [brandContext.toLowerCase()];
    }

    // For each raw tag, also run extractNiches() to normalize verbose phrases
    // e.g. "online food delivery" → ['food', 'restaurants']
    const expanded = new Set(rawTags);
    for (const tag of rawTags) {
        const niches = extractNiches(tag);
        niches.forEach(n => expanded.add(n));
    }

    return [...expanded].filter(Boolean);
}

// ─── Factor 1: Relevance (0–100) ─────────────────────────────────────────────
// Combines:
//   A. Direct brand_fit tag overlap (brand category ∩ influencer brand_fit)  — 50%
//   B. Niche keyword match (query niches ∩ influencer niches)                — 20%
//   C. Vector similarity from Pinecone                                        — 30%
//
// Key fix: brand_fit direct match is now the PRIMARY signal.
// If an influencer's brand_fit has ZERO direct tags matching the brand's categories,
// they receive a heavy penalty even if Pinecone vector score is high.
function scoreRelevance(queryNiches, influencer, pineconeScore, brandContext) {
    // ── A. Direct brand_fit tag overlap ──────────────────────────────────────
    const brandCategories = extractBrandCategories(brandContext || "");
    const infBrandFitTags = (influencer.brand_fit || "")
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    // Also check influencer.niche directly
    const infNicheTag = (influencer.niche || "").toLowerCase().trim();

    let directOverlapScore;
    if (brandCategories.length === 0) {
        directOverlapScore = 50; // No brand context = neutral
    } else {
        // Count how many brand categories appear in influencer's brand_fit or niche
        const matches = brandCategories.filter(cat => {
            // Check exact or partial match in brand_fit tags
            if (infBrandFitTags.some(tag => tag.includes(cat) || cat.includes(tag))) return true;
            // Check against influencer niche
            if (infNicheTag.includes(cat) || cat.includes(infNicheTag)) return true;
            // Check using NICHE_KEYWORDS expansion (e.g. "food" → ["foodie","recipe","restaurant"])
            const kwSet = NICHE_KEYWORDS[cat] || [];
            const fullText = [...infBrandFitTags, infNicheTag, (influencer.vibe || "").toLowerCase()].join(" ");
            if (kwSet.some(kw => fullText.includes(kw))) return true;
            return false;
        });

        if (matches.length === 0) {
            // Zero overlap: hard penalty — wrong category influencer
            directOverlapScore = 5;
        } else {
            directOverlapScore = Math.round((matches.length / brandCategories.length) * 100);
            directOverlapScore = Math.max(directOverlapScore, 40); // At least 1 match = acceptable
        }
    }

    // ── B. Niche keyword match ────────────────────────────────────────────────
    let keywordScore;
    if (queryNiches.length === 0) {
        keywordScore = 50;
    } else {
        const brandFitExpanded = infBrandFitTags.join(" ");
        const infText = [
            infNicheTag,
            brandFitExpanded,
            (influencer.vibe  || "").toLowerCase(),
            (influencer.text  || "").toLowerCase(),
        ].join(" ");
        const infNiches = extractNiches(infText);
        const overlap   = queryNiches.filter(n => infNiches.includes(n));
        keywordScore = overlap.length === 0
            ? 15
            : Math.round((overlap.length / queryNiches.length) * 100);
    }

    // ── C. Combined: 50% direct brand_fit + 20% keyword + 30% vector ─────────
    return Math.round(
        directOverlapScore   * 0.50 +
        keywordScore         * 0.20 +
        (pineconeScore * 100) * 0.30
    );
}

// ─── Factor 2: Engagement (0–100) ────────────────────────────────────────────
// ER-based tiered scoring + views/follower ratio signal
function scoreEngagement(inf) {
    const er       = parseFloat(inf.engagement_rate) || 0;
    const flw      = parseInt(inf.followers)         || 0;
    const avgViews = parseInt(inf.avg_views)         || 0;

    let score;
    if      (er >= 10) score = 100;
    else if (er >= 8)  score = 95;
    else if (er >= 6)  score = 88;
    else if (er >= 4)  score = 75;
    else if (er >= 3)  score = 65;
    else if (er >= 2)  score = 52;
    else if (er >= 1)  score = 38;
    else if (er > 0)   score = 22;
    else               score = 20; // No ER data = low but not zero

    // Penalty: mega accounts with no ER are likely fake/inactive
    if (flw > 1_000_000 && er === 0) score = Math.max(0, score - 35);

    // Bonus: micro/nano with strong ER = highly authentic
    if (flw < 100_000 && er >= 5) score = Math.min(100, score + 10);

    // Views-to-followers ratio: healthy = 10–50%
    if (flw > 0 && avgViews > 0) {
        const vr = avgViews / flw;
        if      (vr >= 0.5)  score = Math.min(100, score + 12);
        else if (vr >= 0.3)  score = Math.min(100, score + 8);
        else if (vr >= 0.1)  score = Math.min(100, score + 4);
        else if (vr < 0.02)  score = Math.max(0,   score - 10); // Very low views ratio
    }

    return Math.min(Math.max(score, 0), 100);
}

// ─── Factor 3: Audience Match (0–100) ────────────────────────────────────────
// Gender from mf_split + age + location + india_split
function scoreAudience(queryText, inf, brandContext = "") {
    let score = 50; // Base = neutral
    const q   = `${queryText} ${brandContext}`.toLowerCase();

    // --- Gender alignment using mf_split "M%/F%" ---
    const { male: malePct, female: femalePct } = parseMfSplit(inf.mf_split);
    const wantsFemale = /\b(women|female|girl|ladies)\b/.test(q);
    const wantsMale   = /\b(men|male|boy|guys)\b/.test(q);

    if (malePct !== null && femalePct !== null) {
        if (wantsFemale) {
            // Want female audience: reward if female% > 50
            if      (femalePct >= 70) score += 25;
            else if (femalePct >= 50) score += 15;
            else if (femalePct < 30)  score -= 20;
        } else if (wantsMale) {
            // Want male audience: reward if male% > 50
            if      (malePct >= 70) score += 25;
            else if (malePct >= 50) score += 15;
            else if (malePct < 30)  score -= 20;
        }
    } else {
        // Fallback: text-based gender signals
        const genderText = (inf.mf_split || "").toLowerCase();
        if (wantsFemale && /\bf\b|female|woman/.test(genderText)) score += 20;
        else if (wantsMale && /\bm\b|male|man/.test(genderText)) score += 20;
    }

    // --- Age alignment ---
    const age = (inf.age_concentration || "").toLowerCase();
    const ageReq = q.match(/(\d{2})\s*[-–to]\s*(\d{2})/);
    if (ageReq && age) {
        const lo = parseInt(ageReq[1]);
        const hi = parseInt(ageReq[2]);
        const nums = [...age.matchAll(/\d+/g)].map(m => parseInt(m[0]));
        const inRange = nums.some(a => a >= lo - 5 && a <= hi + 5);
        if (inRange) score += 15;
        else         score -= 8;
    }

    // --- Location alignment ---
    const loc = (inf.location || "").toLowerCase();
    const cityMatch = q.match(/\b(delhi|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|surat|ahmedabad|gurgaon|noida)\b/gi);
    const wantsPanIndia = /\b(pan[- ]?india|india|nationwide|all india|national)\b/i.test(q);

    if (cityMatch && loc) {
        const matched = cityMatch.some(c => loc.includes(c.toLowerCase()));
        if (matched) score += 12;
    } else if (wantsPanIndia) {
        // india_split: India% — higher India% = better for India campaigns
        const indiaPct = parseIndiaSplit(inf.india_split);
        if (indiaPct !== null) {
            if      (indiaPct >= 80) score += 15;
            else if (indiaPct >= 60) score += 10;
            else if (indiaPct >= 40) score += 3;
            else                     score -= 8; // Mostly non-India audience
        } else {
            score += 5; // Unknown but no penalty for pan-India requests
        }
    }

    // --- India split bonus regardless of pan-India mention ---
    // For Indian brands, prefer influencers with majority India audience
    const indiaPct = parseIndiaSplit(inf.india_split);
    if (indiaPct !== null && !wantsPanIndia && !cityMatch) {
        // No explicit geo filter but india_split available — mild bonus for India-heavy
        if (indiaPct >= 70) score += 5;
    }

    return Math.min(Math.max(score, 0), 100);
}

// ─── Factor 4: Pricing Fit (0–100) ────────────────────────────────────────────
// commercials = quoted price in ₹ (e.g. "₹43,000.00")
// If brand budget is in context → compare. Otherwise score on price reasonableness.
function scorePricingFit(inf, brandContext = "") {
    const price = parsePrice(inf.commercials);
    let score = 50; // Base = unknown price = neutral

    if (price === null) {
        // No price data — infer from tier
        const tier = (inf.follower_tier || "").toLowerCase();
        if      (tier === "mega")  score = 30; // Likely expensive
        else if (tier === "macro") score = 45;
        else if (tier === "mid")   score = 60;
        else if (tier === "micro") score = 70;
        else if (tier === "nano")  score = 75;
        return score;
    }

    // Parse budget from brand context if available
    const budgetMatch = brandContext.match(/budget[:\s]*(?:inr|₹|rs\.?)?\s*([\d,]+(?:\s*(?:k|l|lac|lakh|cr|crore))?)/i);
    let budgetINR = null;
    if (budgetMatch) {
        let raw = budgetMatch[1].replace(/,/g, "").trim();
        if (/k$/i.test(raw))        budgetINR = parseFloat(raw) * 1_000;
        else if (/l|lac|lakh/i.test(raw)) budgetINR = parseFloat(raw) * 100_000;
        else if (/cr|crore/i.test(raw))   budgetINR = parseFloat(raw) * 10_000_000;
        else                              budgetINR = parseFloat(raw);
    }

    if (budgetINR && budgetINR > 0) {
        // Compare per-influencer price against per-influencer budget
        const ratio = price / budgetINR;
        if      (ratio <= 0.5)  score = 100; // Well within budget
        else if (ratio <= 0.8)  score = 85;
        else if (ratio <= 1.0)  score = 70;  // Right at budget
        else if (ratio <= 1.3)  score = 45;  // Slightly over
        else if (ratio <= 2.0)  score = 25;  // Over budget
        else                    score = 10;  // Way over budget
    } else {
        // No budget context — score based on price tier reasonableness
        if      (price <= 5_000)    score = 80; // Nano pricing
        else if (price <= 20_000)   score = 75; // Micro pricing
        else if (price <= 80_000)   score = 68; // Mid pricing
        else if (price <= 300_000)  score = 55; // Macro pricing
        else if (price <= 1_000_000) score = 40; // Mega pricing
        else                        score = 25; // Celebrity pricing
    }

    // Bonus: has contact info → easier to negotiate
    if (inf.email || inf.contact_no) score = Math.min(100, score + 5);

    return Math.min(Math.max(score, 0), 100);
}

// ─── Factor 5: Consistency Index (0–100) ─────────────────────────────────────
// Profile completeness + healthy ER range + views consistency
function scoreConsistency(inf) {
    let score = 40; // Base

    const er    = parseFloat(inf.engagement_rate) || 0;
    const flw   = parseInt(inf.followers)         || 0;
    const views = parseInt(inf.avg_views)         || 0;

    // Healthy ER range = 1–15% = consistent creator
    if      (er >= 1  && er <= 15) score += 25;
    else if (er > 15)              score += 10; // Viral but may be spike-driven
    else if (er > 0)               score += 5;

    // Profile completeness: each field filled = active/professional creator
    const completeness = [
        inf.niche, inf.brand_fit, inf.vibe,
        inf.location, inf.mf_split, inf.age_concentration,
        inf.india_split, inf.email || inf.contact_no,
    ].filter(Boolean).length;
    score += Math.min(completeness * 3, 24); // max +24

    // Views/followers ratio in healthy range (5%–60%)
    if (flw > 0 && views > 0) {
        const vr = views / flw;
        if (vr >= 0.05 && vr <= 0.6) score += 11;
        else if (vr > 0)              score += 3;
    }

    return Math.min(Math.max(score, 0), 100);
}

// ─── Main Scoring Function ────────────────────────────────────────────────────
export function computeMatchScore(queryText, influencer, pineconeScore, brandContext = "") {
    const qNiches = extractNiches(`${queryText} ${brandContext}`);

    const relevance   = scoreRelevance(qNiches, influencer, pineconeScore, brandContext);
    const engagement  = scoreEngagement(influencer);
    const audience    = scoreAudience(queryText, influencer, brandContext);
    const pricing     = scorePricingFit(influencer, brandContext);
    const consistency = scoreConsistency(influencer);

    const total = Math.round(
        WEIGHTS.relevance   * relevance   +
        WEIGHTS.engagement  * engagement  +
        WEIGHTS.audience    * audience    +
        WEIGHTS.pricingFit  * pricing     +
        WEIGHTS.consistency * consistency
    );

    const finalScore = Math.min(total, 100);

    return {
        total: finalScore,
        breakdown: {
            relevance:   { score: relevance,   weight: "35%", max: 100 },
            engagement:  { score: engagement,   weight: "25%", max: 100 },
            audience:    { score: audience,     weight: "20%", max: 100 },
            pricingFit:  { score: pricing,      weight: "10%", max: 100 },
            consistency: { score: consistency,  weight: "10%", max: 100 },
        },
        tier: finalScore >= 80 ? "A" : finalScore >= 60 ? "B" : "C",
        confidence: relevance >= 50 ? "high" : relevance >= 30 ? "medium" : "low",
    };
}

// ─── Query Builder ────────────────────────────────────────────────────────────
export function buildSearchQuery(message, context = "") {
    const c = `${message} ${context}`.toLowerCase();
    const parts = [];

    const niches = c.match(/\b(fashion|beauty|skincare|haircare|fitness|lifestyle|food|tech|travel|gaming|education|finance|health|automotive|luxury|parenting|comedy|dance|music|art|photography|vlog|review|sports|pets|sustainability|events|restaurant)\b/gi);
    if (niches) parts.push(`niche: ${[...new Set(niches)].join(", ")}`);

    const locs = c.match(/\b(delhi|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|surat|ahmedabad|pan[- ]?india|india|gurgaon|noida)\b/gi);
    if (locs) parts.push(`location: ${[...new Set(locs)].join(", ")}`);

    const genders = c.match(/\b(male|female|women|men|girls|boys|ladies)\b/gi);
    if (genders) parts.push(`audience: ${[...new Set(genders)].join(", ")}`);

    const tiers = c.match(/\b(nano|micro|mid[- ]?tier|mid|macro|mega)\b/gi);
    if (tiers) parts.push(`tier: ${[...new Set(tiers)].join(", ")}`);

    return parts.length > 0
        ? `Find influencers: ${parts.join(". ")}. Context: ${message}`
        : message;
}

export function getDynamicTopK(msg, ctx = "") {
    const t = `${msg} ${ctx}`.toLowerCase();
    if (/\b(show all|list all|every|browse|explore|sabhi|sab|all of them)\b/i.test(t)) return 50;
    if (/\b(show|list|all|many|multiple)\b/i.test(t))                                  return 20;
    if (/\b(more|filter|refine|another|similar)\b/i.test(t))                           return 15;
    if (/\b(best|top|one|perfect|ideal|exact|single)\b/i.test(t))                      return 5;
    return 10;
}

export function buildMetadataFilter(msg, ctx = "") {
    const t = `${msg} ${ctx}`.toLowerCase();
    const tierMap = {
        nano: "nano", micro: "micro", mid: "mid",
        macro: "macro", mega: "mega",
        small: "nano", big: "macro", large: "mega",
    };
    for (const [k, v] of Object.entries(tierMap)) {
        if (new RegExp(`\\b${k}\\b`).test(t)) return { follower_tier: { $eq: v } };
    }
    return undefined;
}

// ─── Main Search ──────────────────────────────────────────────────────────────
export async function searchInfluencers(query, topK = 10, context = "", explicitFilter = null, brandContext = "") {
    const index = getIndex();
    if (!index) { console.warn("⚠️  Pinecone not configured"); return []; }

    try {
        const sq          = buildSearchQuery(query, context);
        const builtFilter = buildMetadataFilter(query, context);
        const filter      = { ...builtFilter, ...explicitFilter };

        // Fetch ALL records — auto-detected from Pinecone stats (cached 5 min)
        const totalRecords = await getTotalRecordCount();
        const fetchK       = Math.min(totalRecords, 10000);

        console.log(`🔍 Query: "${sq.slice(0, 120)}"`);
        console.log(`🔍 Fetching ${fetchK}/${totalRecords} candidates | filters: ${JSON.stringify(filter)}`);

        const embedding = await getQueryEmbedding(sq);
        const qp = { vector: embedding, topK: fetchK, includeMetadata: true };
        if (Object.keys(filter).length > 0) qp.filter = filter;

        const res = await index.query(qp);
        const all = res.matches || [];

        if (all.length) {
            console.log(`📊 Pinecone returned ${all.length} | score range: ${all[0]?.score?.toFixed(3)} → ${all[all.length - 1]?.score?.toFixed(3)}`);
        } else {
            console.log("⚠️  Pinecone returned 0 matches");
        }

        // Score every candidate
        const fullQ  = `${query} ${context}`;
        const scored = [];
        let rejected = 0;

        for (const m of all) {
            const inf    = m.metadata || {};
            const result = computeMatchScore(fullQ, inf, m.score, brandContext);

            // Soft reject: very low relevance only
            if (result.breakdown.relevance.score < 10) {
                rejected++;
                continue;
            }
            // Minimum overall quality bar
            if (result.total < 10) {
                rejected++;
                continue;
            }

            scored.push({
                ...inf,
                pinecone_score:   m.score,
                match_score:      result.total,
                score_breakdown:  result.breakdown,
                tier_rank:        result.tier,
                match_confidence: result.confidence,
            });
        }

        scored.sort((a, b) => b.match_score - a.match_score);
        const final = scored.slice(0, topK);

        console.log(`✅ Passed: ${scored.length} | Rejected: ${rejected} | Returning top ${final.length}`);
        return final;

    } catch (err) {
        console.error("❌ searchInfluencers error:", err.message);
        return [];
    }
}

// ─── Format for Chat Context (sent to Gemini as system prompt addition) ───────
export function formatSearchResults(results) {
    if (!results.length) return "\n[No matching influencers found in the database.]";

    let ctx = `\n\n--- TOP ${results.length} MATCHING INFLUENCERS FROM DATABASE ---\n(Use ONLY this data. Do NOT invent any details.)\n`;

    results.forEach((inf, i) => {
        const bd    = inf.score_breakdown || {};
        const price = parsePrice(inf.commercials);
        const indiaPct = parseIndiaSplit(inf.india_split);
        const { male: mPct, female: fPct } = parseMfSplit(inf.mf_split);

        ctx += `\n═══ INFLUENCER ${i + 1} ═══`;
        ctx += `\n  Name:          ${inf.name || "Unknown"}`;
        ctx += `\n  Match Score:   ${inf.match_score}%  (Tier: ${inf.tier_rank || "C"}, Confidence: ${inf.match_confidence || "low"})`;
        ctx += `\n  Score Detail:  Relevance ${bd.relevance?.score ?? 0}/100 | Engagement ${bd.engagement?.score ?? 0}/100 | Audience ${bd.audience?.score ?? 0}/100 | Pricing ${bd.pricingFit?.score ?? 0}/100 | Consistency ${bd.consistency?.score ?? 0}/100`;

        if (inf.instagram)         ctx += `\n  Instagram:     ${inf.instagram}`;
        if (inf.location)          ctx += `\n  Location:      ${inf.location}`;
        if (inf.gender)            ctx += `\n  Gender:        ${inf.gender}`;
        if (inf.type)              ctx += `\n  Creator Type:  ${inf.type}`;
        if (inf.niche)             ctx += `\n  Niche:         ${inf.niche}`;
        if (inf.brand_fit)         ctx += `\n  Brand Fit:     ${inf.brand_fit}`;
        if (inf.vibe)              ctx += `\n  Content Vibe:  ${inf.vibe}`;

        if (inf.followers)         ctx += `\n  Followers:     ${Number(inf.followers).toLocaleString("en-IN")}`;
        if (inf.follower_tier)     ctx += `\n  Tier:          ${inf.follower_tier}`;
        if (inf.avg_views)         ctx += `\n  Avg Views:     ${Number(inf.avg_views).toLocaleString("en-IN")}`;
        if (inf.engagement_rate)   ctx += `\n  ER:            ${inf.engagement_rate}%`;

        // Audience demographics — parsed for clarity
        if (mPct !== null && fPct !== null) {
            ctx += `\n  Audience M/F:  ${mPct}% Male / ${fPct}% Female`;
        } else if (inf.mf_split) {
            ctx += `\n  M/F Split:     ${inf.mf_split}`;
        }
        if (indiaPct !== null) {
            ctx += `\n  India Audience:${indiaPct}% India / ${100 - indiaPct}% Global`;
        }
        if (inf.age_concentration) ctx += `\n  Age Group:     ${inf.age_concentration}`;

        // Pricing
        if (price !== null) {
            ctx += `\n  Quoted Price:  ₹${price.toLocaleString("en-IN")} per post`;
        } else if (inf.commercials && inf.commercials !== "-") {
            ctx += `\n  Commercials:   ${inf.commercials}`;
        }

        // Contact
        if (inf.contact_no) ctx += `\n  Phone:         ${inf.contact_no}`;
        if (inf.email)       ctx += `\n  Email:         ${inf.email}`;
    });

    ctx += `\n\n--- END OF INFLUENCER DATA ---`;
    return ctx;
}

// ─── Format for Frontend Search API ──────────────────────────────────────────
export function formatForSearchAPI(results) {
    return results.map((inf, idx) => {
        const price    = parsePrice(inf.commercials);
        const indiaPct = parseIndiaSplit(inf.india_split);
        const { male: mPct, female: fPct } = parseMfSplit(inf.mf_split);

        // Clean Instagram handle
        const rawHandle = (inf.instagram || "")
            .replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, "")
            .replace(/\/$/, "")
            .replace(/^@/, "");

        return {
            id:              inf.id || String(idx + 1),
            name:            inf.name || "Unknown",
            handle:          rawHandle ? `@${rawHandle}` : null,
            instagram_url:   inf.instagram || null,
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
            audience: {
                male_pct:   mPct,
                female_pct: fPct,
                india_pct:  indiaPct,
                age_group:  inf.age_concentration || null,
                mf_split:   inf.mf_split || null,
                india_split: inf.india_split || null,
            },
            pricing: {
                quoted_price_inr: price,
                display:          price ? `₹${price.toLocaleString("en-IN")}` : null,
                raw:              inf.commercials || null,
            },
            contact: {
                phone: inf.contact_no || null,
                email: inf.email || null,
            },
            match: {
                score:      inf.match_score || 0,
                tier:       inf.tier_rank || "C",
                confidence: inf.match_confidence || "low",
            },
            score_breakdown: inf.score_breakdown || {},
        };
    });
}
