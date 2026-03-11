/**
 * Influencer Search Service — v5 (India-City Model)
 *
 * Scoring Model (4 factors, total 100):
 *   Category Match  = 40 pts  (exact niche OR brand_fit match)
 *   City Match      = 40 pts  (audience % in brand's target cities)
 *   Gender Match    = 10 pts  (audience gender alignment)
 *   Engagement      = 10 pts  (ER-based bucket)
 *
 * Commercial Estimation:
 *   EstimatedCommercial = PS × MBR × EQB × NDM × RA
 *   PS  = (AvgViews × 0.75) + (Followers × ER × 0.25)
 *   MBR = ₹2.0 per effective view (configurable)
 *   EQB = Engagement Quality Boost (tiered)
 *   NDM = Niche Demand Multiplier
 *   RA  = Reliability Adjustment (ViewRatio-based)
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

// ─── Category keyword map (for brand_fit matching) ────────────────────────────
const CATEGORY_KEYWORDS = {
    fashion: ["fashion", "style", "outfit", "clothing", "apparel", "ootd", "wear", "wardrobe", "streetwear", "kurta", "ethnic", "clothes", "dress", "footwear", "eyewear"],
    beauty: ["beauty", "makeup", "cosmetics", "lipstick", "foundation", "blush", "contour", "eyeshadow", "kajal", "glam"],
    skincare: ["skincare", "skin care", "serum", "moisturizer", "sunscreen", "acne", "glow", "derma", "spf", "retinol", "face wash", "cleanser"],
    haircare: ["haircare", "hair care", "shampoo", "conditioner", "hair oil", "hair mask", "hair growth", "hairstyle"],
    fitness: ["fitness", "gym", "workout", "health", "wellness", "yoga", "exercise", "bodybuilding", "protein", "weight loss", "nutrition", "diet"],
    lifestyle: ["lifestyle", "daily", "vlog", "routine", "living", "home", "decor", "motivation", "mindset", "productivity"],
    food: ["food", "recipe", "cooking", "chef", "baking", "restaurant", "cuisine", "eat", "kitchen", "foodie", "snack", "beverage", "drink", "delivery", "fmcg", "packaged food", "meal", "dessert"],
    "f&b": ["restaurant", "cafe", "dining", "eatery", "bistro", "bar", "lounge", "café", "diner", "food", "beverage"],
    tech: ["tech", "technology", "gadget", "phone", "laptop", "review", "unboxing", "coding", "software", "ai", "app", "computer"],
    travel: ["travel", "wanderlust", "explore", "destination", "trip", "adventure", "tourism", "hotel", "backpack", "trek"],
    gaming: ["gaming", "game", "esports", "twitch", "stream", "playstation", "xbox", "pc", "fps", "pubg", "bgmi"],
    education: ["education", "learning", "study", "course", "tutorial", "knowledge", "skill", "upsc", "iit", "exam", "coaching"],
    finance: ["finance", "money", "investing", "stocks", "crypto", "budget", "savings", "wealth", "trading", "tax", "fintech"],
    luxury: ["luxury", "premium", "high-end", "elite", "exclusive", "designer", "jewellery", "watches"],
    parenting: ["parenting", "mom", "dad", "baby", "kids", "family", "motherhood", "pregnancy", "toddler", "child"],
    comedy: ["comedy", "funny", "humor", "meme", "entertainment", "sketch", "roast", "standup", "satire"],
    sports: ["sports", "cricket", "football", "ipl", "athlete", "player", "match", "tournament", "champion"],
    pets: ["pets", "dog", "cat", "animals", "pet care", "vet", "puppy", "kitten"],
    events: ["events", "wedding", "party", "celebration", "festival", "concerts", "nightlife"],
};

// ─── Parse helpers ────────────────────────────────────────────────────────────

function parseMfSplit(str) {
    if (!str) return { male: null, female: null };
    const parts = str.split("/").map(s => parseInt(s.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { male: parts[0], female: parts[1] };
    }
    return { male: null, female: null };
}

function parseIndiaSplit(str) {
    if (!str) return null;
    const parts = str.split("/").map(s => parseInt(s.trim()));
    if (parts.length >= 1 && !isNaN(parts[0])) return parts[0];
    return null;
}

function parsePrice(str) {
    if (!str || str === "-" || str === "NA" || str === "") return null;
    const num = parseFloat(str.replace(/[₹,\s]/g, ""));
    return isNaN(num) ? null : num;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY MATCHING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Score how well an influencer matches the brand category.
 * Returns 40 for a direct niche match.
 * Returns 20 for a brand_fit tag or keyword match.
 * Returns 0 for no match.
 */
function scoreCategoryMatch(brandCategory, influencer) {
    if (!brandCategory || brandCategory.trim().toLowerCase() === "general") return 40; // No brand category = max category score
    const bc = brandCategory.toLowerCase().trim();

    const infNiche = (influencer.niche || "").toLowerCase().trim();
    const nicheList = infNiche.split(",").map(s => s.trim()).filter(Boolean);

    // 1. Direct Primary Niche match (Full 40 points)
    if (nicheList.includes(bc)) return 40;
    
    // Check if brand category itself exists as an isolated word/phrase in Niche
    const fullNicheText = " " + nicheList.join(" ") + " ";
    if (fullNicheText.includes(" " + bc + " ")) return 40;

    // 2. Secondary Brand Fit Match (20 points -> means they do this on the side, e.g. Business creator talking about Tech)
    const brandFitTags = (influencer.brand_fit || "")
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

    if (brandFitTags.includes(bc)) return 20;

    const fullBrandFitText = " " + brandFitTags.join(" ") + " ";
    if (fullBrandFitText.includes(" " + bc + " ")) return 20;

    // 3. Keyword expansion check across both
    const categoryKws = CATEGORY_KEYWORDS[bc] || [];
    const combinedText = fullNicheText + fullBrandFitText;
    if (categoryKws.some(kw => combinedText.includes(" " + kw + " "))) return 20;

    return 0; // No match
}

// ═══════════════════════════════════════════════════════════════════════════════
// CITY MATCHING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate city match score.
 * Uses top_cities (with %) if available, falls back to single location field.
 */
function scoreCityMatch(brandCities, influencer) {
    if (!brandCities || brandCities.length === 0) return 40; // No target cities = full score

    const topCities = influencer.top_cities || {};
    const hasTopCities = Object.keys(topCities).length > 0;

    if (hasTopCities) {
        // Use actual city % data
        let totalPct = 0;
        for (const city of brandCities) {
            totalPct += (topCities[city.toLowerCase()] || 0);
        }
        return Math.min(40, Math.round(totalPct * 0.4));
    }

    // Fallback: use single location field as proxy (100% in that city)
    const infLocation = (influencer.location || "").toLowerCase().trim();
    if (!infLocation) return 0;

    for (const city of brandCities) {
        if (infLocation.includes(city.toLowerCase()) || city.toLowerCase().includes(infLocation)) {
            return 40; // Location matches one of the target cities
        }
    }
    return 0;
}

// removed hasCityOverlap function since we are removing the city hard filter

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING ENGINE — India-City Model
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * New match score: 4 factors, total 100.
 *   Category (40) + City (40) + Gender (10) + Engagement (10)
 */
export function computeMatchScore(brandCategory, brandCities, brandGender, influencer) {
    // 1. Category (40 pts max) — Niche match -> 40, Brand Fit match -> 20, else -> 0
    const categoryScore = scoreCategoryMatch(brandCategory, influencer);

    // 2. City (40 pts)
    const cityScore = scoreCityMatch(brandCities, influencer);

    // 3. Gender (10 pts)
    let genderScore = 10; // default = unisex
    const bg = (brandGender || "unisex").toLowerCase();
    if (bg === "female") {
        const { female: fPct } = parseMfSplit(influencer.mf_split);
        genderScore = fPct !== null ? Math.round((fPct / 100) * 10) : 5;
    } else if (bg === "male") {
        const { male: mPct } = parseMfSplit(influencer.mf_split);
        genderScore = mPct !== null ? Math.round((mPct / 100) * 10) : 5;
    }

    // 4. Engagement (10 pts) — simple ER buckets
    const er = parseFloat(influencer.engagement_rate) || 0;
    let engagementScore;
    if (er > 3) engagementScore = 10;
    else if (er >= 2) engagementScore = 7;
    else engagementScore = 4;

    const total = Math.min(categoryScore + cityScore + genderScore + engagementScore, 100);

    return {
        total,
        breakdown: {
            category: { score: categoryScore, max: 40 },
            city: { score: cityScore, max: 40 },
            gender: { score: genderScore, max: 10 },
            engagement: { score: engagementScore, max: 10 },
        },
        tier: total >= 75 ? "A" : total >= 55 ? "B" : "C",
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMERCIAL ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════════

const COMMERCIAL_CONFIG = {
    MBR: 2.0, // ₹ per effective view — adjustable
    EQB: [[2, 0.85], [4, 1.0], [6, 1.15], [8, 1.3], [Infinity, 1.4]],
    NDM: {
        finance: 1.6, luxury: 1.7, tech: 1.3, fashion: 1.2, beauty: 1.15,
        skincare: 1.15, haircare: 1.1, fitness: 1.1, lifestyle: 1.05,
        "f&b": 1.0, food: 1.0, restaurants: 1.0, travel: 1.1,
        education: 1.1, parenting: 1.0, comedy: 0.9, meme: 0.9,
        events: 1.0, gaming: 1.0, sports: 1.0, pets: 0.95,
    },
    RA: [[0.12, 0.8], [0.25, 1.0], [0.40, 1.1], [Infinity, 1.2]],
    rangePercent: 0.10,
};

/**
 * Estimate commercial value for an influencer.
 * Formula: PS × MBR × EQB × NDM × RA
 */
export function estimateCommercial({ followers = 0, avgViews = 0, engagementRate = 0, niche = "" }) {
    const { MBR, EQB, NDM, RA, rangePercent } = COMMERCIAL_CONFIG;

    // Performance Score
    const ps = (avgViews * 0.75) + (followers * (engagementRate / 100) * 0.25);
    if (ps <= 0) return { min: 0, max: 0, raw: 0, display: "N/A" };

    // Engagement Quality Boost
    let eqb = 0.85;
    for (const [threshold, value] of EQB) {
        if (engagementRate < threshold) { eqb = value; break; }
    }

    // Niche Demand Multiplier
    const nicheLower = niche.toLowerCase();
    let ndm = 1.0;
    for (const [key, mult] of Object.entries(NDM)) {
        if (nicheLower.includes(key)) { ndm = mult; break; }
    }

    // Reliability Adjustment
    let ra = 1.0;
    if (followers > 0) {
        const viewRatio = avgViews / followers;
        for (const [threshold, value] of RA) {
            if (viewRatio < threshold) { ra = value; break; }
        }
    }

    const rawCommercial = ps * MBR * eqb * ndm * ra;
    const roundTo500 = (n) => Math.round(n / 500) * 500;
    const min = Math.max(1000, roundTo500(rawCommercial * (1 - rangePercent)));
    const max = Math.max(1500, roundTo500(rawCommercial * (1 + rangePercent)));

    return {
        min, max,
        raw: Math.round(rawCommercial),
        display: `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`,
    };
}

// ─── Query Builder (simplified) ───────────────────────────────────────────────
export function buildSearchQuery(brandCategory, context = "") {
    const parts = [];
    if (brandCategory) parts.push(`niche: ${brandCategory}`);
    if (context) parts.push(context);
    return parts.length > 0
        ? `Find influencers: ${parts.join(". ")}`
        : "Find Indian influencers";
}

export function getDynamicTopK(msg, ctx = "") {
    const t = `${msg} ${ctx}`.toLowerCase();
    if (/\b(show all|list all|every|browse|explore|sabhi|sab|all of them)\b/i.test(t)) return 50;
    if (/\b(show|list|all|many|multiple)\b/i.test(t)) return 20;
    if (/\b(more|filter|refine|another|similar)\b/i.test(t)) return 15;
    if (/\b(best|top|one|perfect|ideal|exact|single)\b/i.test(t)) return 5;
    return 10;
}

export function buildMetadataFilter(msg, ctx = "") {
    const t = `${msg} ${ctx}`.toLowerCase();
    const tierMap = {
        nano: "nano", micro: "micro", mid: "mid",
        macro: "macro", mega: "mega"
    };
    for (const [k, v] of Object.entries(tierMap)) {
        if (new RegExp(`\\b${k}\\s+(tier|influencer|creator|level)\\b`).test(t)) return { follower_tier: { $eq: v } };
    }
    return undefined;
}

// ─── Main Search ──────────────────────────────────────────────────────────────
export async function searchInfluencers(query, topK = 10, context = "", explicitFilter = null, brandContext = "") {
    const index = getIndex();
    if (!index) { console.warn("⚠️  Pinecone not configured"); return []; }

    // Parse brand context for new scoring model
    let brandCategory = null;
    let brandCities = [];
    let brandGender = "unisex";

    if (brandContext) {
        if (typeof brandContext === 'object') {
            // New format: Object directly passed from API
            brandCategory = brandContext.category || null;
            brandGender = brandContext.gender || "unisex";
            brandCities = brandContext.cities || [];
        } else if (typeof brandContext === 'string') {
            // Old format: Extract from string "category:Fashion|gender:Female|cities:Mumbai,Delhi"
            const catMatch = brandContext.match(/category:\s*([^|]+)/i);
            if (catMatch) brandCategory = catMatch[1].trim();

            const genderMatch = brandContext.match(/gender:\s*([^|]+)/i);
            if (genderMatch) brandGender = genderMatch[1].trim();

            const citiesMatch = brandContext.match(/cities:\s*([^|]+)/i);
            if (citiesMatch) brandCities = citiesMatch[1].split(",").map(s => s.trim()).filter(Boolean);
        }
    }

    try {
        const sq = buildSearchQuery(brandCategory, context);
        const builtFilter = buildMetadataFilter(query, context);
        const filter = { ...builtFilter, ...explicitFilter };

        // Fetch ALL records from Pinecone
        const totalRecords = await getTotalRecordCount();
        const fetchK = Math.min(totalRecords, 10000);

        console.log(`🔍 Query: "${sq.slice(0, 120)}"`);
        console.log(`🔍 Brand: category=${brandCategory}, gender=${brandGender}, cities=[${brandCities.join(",")}]`);
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

        // Score every candidate with new India-City model
        const scored = [];
        let hardFiltered = 0;

        for (const m of all) {
            const inf = m.metadata || {};

            // ── Hard Filter 1: Category mismatch ──
            const catScore = scoreCategoryMatch(brandCategory, inf);
            if (brandCategory && catScore === 0) {
                hardFiltered++;
                continue;
            }

            // We PREVIOUSLY had a Hard Filter 2 for zero city overlap here.
            // We removed it because treating 'location' as 100% proxy means 
            // 90% of perfectly good matching creators were hidden just because they 
            // lived in Bangalore instead of Mumbai. 
            // Now, they just get 0 City points and rank lower!

            // ── Score ──
            const result = computeMatchScore(brandCategory, brandCities, brandGender, inf);

            // Skip very low scores
            if (result.total < 10) {
                hardFiltered++;
                continue;
            }

            // ── Commercial estimate ──
            const commercial = estimateCommercial({
                followers: parseInt(inf.followers) || 0,
                avgViews: parseInt(inf.avg_views) || 0,
                engagementRate: parseFloat(inf.engagement_rate) || 0,
                niche: inf.niche || brandCategory || "",
            });

            scored.push({
                id: m.id,
                ...inf,
                pinecone_score: m.score,
                match_score: result.total,
                score_breakdown: result.breakdown,
                tier_rank: result.tier,
                estimated_commercial: commercial,
            });
        }

        scored.sort((a, b) => b.match_score - a.match_score);
        const final = scored.slice(0, topK);

        console.log(`✅ Passed: ${scored.length} | Hard-filtered: ${hardFiltered} | Returning top ${final.length}`);
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
        const bd = inf.score_breakdown || {};
        const price = parsePrice(inf.commercials);
        const indiaPct = parseIndiaSplit(inf.india_split);
        const { male: mPct, female: fPct } = parseMfSplit(inf.mf_split);
        const comm = inf.estimated_commercial || {};

        ctx += `\n═══ INFLUENCER ${i + 1} ═══`;
        ctx += `\n  Name:          ${inf.name || "Unknown"}`;
        ctx += `\n  Match Score:   ${inf.match_score}/100  (Tier: ${inf.tier_rank || "C"})`;
        ctx += `\n  Score Detail:  Category ${bd.category?.score ?? 0}/40 | City ${bd.city?.score ?? 0}/40 | Gender ${bd.gender?.score ?? 0}/10 | ER ${bd.engagement?.score ?? 0}/10`;

        if (inf.instagram) ctx += `\n  Instagram:     ${inf.instagram}`;
        if (inf.location) ctx += `\n  Location:      ${inf.location}`;
        if (inf.gender) ctx += `\n  Gender:        ${inf.gender}`;
        if (inf.niche) ctx += `\n  Niche:         ${inf.niche}`;
        if (inf.brand_fit) ctx += `\n  Brand Fit:     ${inf.brand_fit}`;

        if (inf.followers) ctx += `\n  Followers:     ${Number(inf.followers).toLocaleString("en-IN")}`;
        if (inf.follower_tier) ctx += `\n  Tier:          ${inf.follower_tier}`;
        if (inf.avg_views) ctx += `\n  Avg Views:     ${Number(inf.avg_views).toLocaleString("en-IN")}`;
        if (inf.engagement_rate) ctx += `\n  ER:            ${inf.engagement_rate}%`;

        if (mPct !== null && fPct !== null) {
            ctx += `\n  Audience M/F:  ${mPct}% Male / ${fPct}% Female`;
        }
        if (indiaPct !== null) {
            ctx += `\n  India Audience:${indiaPct}% India / ${100 - indiaPct}% Global`;
        }
        if (inf.age_concentration) ctx += `\n  Age Group:     ${inf.age_concentration}`;

        if (price !== null) {
            ctx += `\n  Quoted Price:  ₹${price.toLocaleString("en-IN")} per post`;
        }
        if (comm.display && comm.display !== "N/A") {
            ctx += `\n  Est. Budget:   ${comm.display}`;
        }

        if (inf.contact_no) ctx += `\n  Phone:         ${inf.contact_no}`;
        if (inf.email) ctx += `\n  Email:         ${inf.email}`;
    });

    ctx += `\n\n--- END OF INFLUENCER DATA ---`;
    return ctx;
}

// ─── Format for Frontend Search API ──────────────────────────────────────────
export function formatForSearchAPI(results) {
    return results.map((inf, idx) => {
        const price = parsePrice(inf.commercials);
        const indiaPct = parseIndiaSplit(inf.india_split);
        const { male: mPct, female: fPct } = parseMfSplit(inf.mf_split);

        const rawHandle = (inf.instagram || "")
            .replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, "")
            .replace(/\/$/, "")
            .replace(/^@/, "");

        const fallbackId = inf.id || `inf_${Date.now()}_${idx}_${(rawHandle || inf.name || "unknown").replace(/[^a-z0-9]/gi, "_").substring(0, 20)}`;

        return {
            id: fallbackId,
            name: inf.name || "Unknown",
            handle: rawHandle ? `@${rawHandle}` : null,
            instagram_url: inf.instagram || null,
            location: inf.location || null,
            gender: inf.gender || null,
            type: inf.type || null,
            niche: inf.niche || null,
            brand_fit: inf.brand_fit || null,
            vibe: inf.vibe || null,
            followers: parseInt(inf.followers) || 0,
            follower_tier: inf.follower_tier || null,
            avg_views: parseInt(inf.avg_views) || 0,
            engagement_rate: parseFloat(inf.engagement_rate) || 0,
            audience: {
                male_pct: mPct,
                female_pct: fPct,
                india_pct: indiaPct,
                age_group: inf.age_concentration || null,
                mf_split: inf.mf_split || null,
                india_split: inf.india_split || null,
            },
            pricing: {
                quoted_price_inr: price,
                display: price ? `₹${price.toLocaleString("en-IN")}` : null,
                raw: inf.commercials || null,
            },
            estimated_commercial: inf.estimated_commercial || { min: 0, max: 0, raw: 0, display: "N/A" },
            contact: {
                phone: inf.contact_no || null,
                email: inf.email || null,
            },
            match: {
                score: inf.match_score || 0,
                tier: inf.tier_rank || "C",
            },
            score_breakdown: inf.score_breakdown || {},
        };
    });
}
