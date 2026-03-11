import { Router } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchInfluencers, formatForSearchAPI } from "../services/influencerSearch.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { verifyCSRFToken } from "../config/csrfService.js";
import { validateUrl } from "../config/urlValidator.js";
import { env } from "../config/env.js";

const router = Router();
const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_UPLOAD_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_UPLOAD_TYPES.join(", ")}`));
        }
    },
});

// Initialize Gemini (singleton)
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// ─── Strip HTML tags from scraped web content ────────────────────────────────
const cleanHtml = (html) =>
    html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 20000);

// ─── Category keyword buckets (auto-detect) ──────────────────────────────────
const CATEGORY_KEYWORDS = {
    fashion: ["kurti", "saree", "outfits", "collection", "fashion", "clothing", "apparel", "dress", "ethnic", "wardrobe", "wear", "streetwear", "footwear", "eyewear", "accessories", "designer", "boutique"],
    beauty: ["skincare", "facewash", "serum", "beauty", "makeup", "cosmetics", "lipstick", "foundation", "blush", "kajal", "glam", "moisturizer", "sunscreen", "cleanser"],
    fitness: ["protein", "gym", "whey", "fitness", "workout", "wellness", "yoga", "exercise", "supplements", "bodybuilding", "health"],
    "f&b": ["cafe", "dine", "restaurant", "food", "recipe", "kitchen", "menu", "order", "delivery", "cuisine", "bistro", "bakery", "beverage", "drink", "bar"],
    finance: ["fintech", "payments", "loan", "finance", "banking", "insurance", "credit", "invest", "mutual fund", "trading", "wallet", "upi"],
    tech: ["tech", "software", "app", "saas", "cloud", "ai", "coding", "laptop", "gadget", "phone", "startup", "platform"],
    education: ["education", "course", "learning", "coaching", "tutorial", "exam", "study", "skill", "upsc", "iit"],
    travel: ["travel", "hotel", "tourism", "destination", "resort", "trip", "booking", "flight", "stay"],
    luxury: ["luxury", "premium", "high-end", "exclusive", "designer", "jewellery", "watches", "diamond"],
    lifestyle: ["lifestyle", "home", "decor", "living", "interior", "furniture"],
    gaming: ["gaming", "game", "esports", "stream", "playstation", "xbox"],
};

// ─── Indian city names for extraction ─────────────────────────────────────────
const INDIAN_CITIES = [
    "mumbai", "delhi", "delhi ncr", "bangalore", "bengaluru", "hyderabad",
    "chennai", "kolkata", "pune", "jaipur", "ahmedabad", "surat",
    "lucknow", "chandigarh", "kochi", "gurgaon", "noida", "indore",
    "bhopal", "nagpur", "visakhapatnam", "patna", "goa", "coimbatore",
    "thiruvananthapuram", "mysore", "vadodara", "rajkot", "ludhiana",
    "amritsar", "agra", "varanasi", "dehradun", "shimla", "udaipur",
    "jodhpur", "ranchi", "bhubaneswar", "guwahati",
];

// ─── City name normalization ──────────────────────────────────────────────────
function normalizeCity(city) {
    const c = city.toLowerCase().trim();
    if (c === "bengaluru") return "bangalore";
    if (c === "delhi ncr" || c === "new delhi" || c === "ncr") return "delhi";
    if (c === "gurgaon" || c === "gurugram") return "gurgaon";
    return c;
}

// ─── Simple Brand Analysis Prompt (3 fields only) ─────────────────────────────
const BRAND_ANALYSIS_PROMPT = `You are a Brand Analyzer for an Indian influencer marketing platform.

Analyze the provided website content and extract ONLY these 3 things:

1. BRAND CATEGORY — Pick exactly ONE from this list:
   fashion, beauty, fitness, f&b, finance, tech, education, travel, luxury, lifestyle, gaming
   If the brand doesn't fit any category exactly, pick the closest one.

2. TARGET GENDER — Who is this brand mainly for?
   Options: "Male", "Female", or "Unisex"
   Look for keywords like "for women", "men's collection", "girls", "boys", etc.
   Default to "Unisex" if unclear.

3. TARGET CITIES — Which Indian cities is this brand targeting?
   Extract from:
   - Shipping mentions ("Delivering in Mumbai, Delhi NCR")
   - Store locations ("Our stores in Bangalore, Hyderabad")
   - Contact address
   - "Now live in" mentions
   - Any city names on the website
   Return max 5 cities. If no cities found, return empty array.
   Use standard city names: Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Jaipur, etc.

4. BRAND NAME — The name of the brand.

OUTPUT FORMAT — STRICT JSON ONLY:
{
  "brand_name": "",
  "brand_category": "fashion|beauty|fitness|f&b|finance|tech|education|travel|luxury|lifestyle|gaming",
  "target_gender": "Male|Female|Unisex",
  "target_cities": ["Mumbai", "Delhi"]
}

RULES:
- Output ONLY valid JSON. No explanations. No markdown. No extra text.
- Pick ONE category only.
- Max 5 cities only.
- If no cities detected, return target_cities as empty array [].
- Only include Indian cities.`;

// ─── Local keyword-based extraction (fallback / augmentation) ──────────────
function extractFromKeywords(text) {
    const lower = text.toLowerCase();

    // Category detection
    let detectedCategory = null;
    let maxMatches = 0;
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const matches = keywords.filter(kw => lower.includes(kw)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedCategory = category;
        }
    }

    // Gender detection
    let detectedGender = "Unisex";
    const femaleSignals = /\b(for women|women's|ladies|girls|her|she|feminine|brides|bridal|saree|kurti|lehenga)\b/i;
    const maleSignals = /\b(for men|men's|guys|boys|his|he|masculine|groom)\b/i;
    const hasFemale = femaleSignals.test(lower);
    const hasMale = maleSignals.test(lower);
    if (hasFemale && !hasMale) detectedGender = "Female";
    else if (hasMale && !hasFemale) detectedGender = "Male";

    // City detection
    const detectedCities = [];
    for (const city of INDIAN_CITIES) {
        if (lower.includes(city) && detectedCities.length < 5) {
            const normalized = normalizeCity(city);
            if (!detectedCities.includes(normalized)) {
                // Capitalize first letter
                detectedCities.push(normalized.charAt(0).toUpperCase() + normalized.slice(1));
            }
        }
    }

    return { category: detectedCategory, gender: detectedGender, cities: detectedCities };
}

// ─── Validate the simplified analysis ──────────────────────────────────────
function validateSimpleAnalysis(analysis, keywordResult) {
    const VALID_CATEGORIES = ["fashion", "beauty", "fitness", "f&b", "finance", "tech", "education", "travel", "luxury", "lifestyle", "gaming"];

    // Validate / fix category
    if (!analysis.brand_category || !VALID_CATEGORIES.includes(analysis.brand_category.toLowerCase())) {
        if (keywordResult.category) {
            analysis.brand_category = keywordResult.category;
        } else {
            analysis.brand_category = "lifestyle"; // safe default
        }
    }
    analysis.brand_category = analysis.brand_category.toLowerCase();

    // Validate gender
    const validGenders = ["male", "female", "unisex"];
    if (!analysis.target_gender || !validGenders.includes(analysis.target_gender.toLowerCase())) {
        analysis.target_gender = keywordResult.gender || "Unisex";
    }
    // Capitalize
    analysis.target_gender = analysis.target_gender.charAt(0).toUpperCase() + analysis.target_gender.slice(1).toLowerCase();

    // Validate cities
    if (!Array.isArray(analysis.target_cities)) {
        analysis.target_cities = keywordResult.cities || [];
    }
    // Normalize and limit to 5
    analysis.target_cities = analysis.target_cities
        .map(c => {
            const n = normalizeCity(c);
            return n.charAt(0).toUpperCase() + n.slice(1);
        })
        .slice(0, 5);

    // Merge keyword-detected cities if Gemini found none
    if (analysis.target_cities.length === 0 && keywordResult.cities.length > 0) {
        analysis.target_cities = keywordResult.cities;
    }

    // Ensure brand_name
    if (!analysis.brand_name) analysis.brand_name = "Unknown Brand";

    return analysis;
}

// ─── POST /analyze-brand ─────────────────────────────────────────────────────
router.post("/analyze-brand", authenticate, verifyCSRFToken, upload.single("file"), async (req, res) => {
    const startTime = Date.now();

    try {
        const { link } = req.body;
        const file = req.file;

        console.log("═══════════════════════════════════════════════");
        console.log("📋 Brand Analysis (India-City Model)");
        console.log(`   Link: ${link || "none"}`);
        console.log(`   File: ${file ? file.originalname : "none"}`);
        console.log("═══════════════════════════════════════════════");

        if (!link && !file) {
            return res.status(400).json({
                detail: "Please provide a website URL or a brand brief file.",
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const parts = [{ text: BRAND_ANALYSIS_PROMPT }];
        let scrapedText = "";

        // ── 1. Process URL ───────────────────────────────────────────────────
        if (link) {
            try {
                const safeUrl = await validateUrl(link);
                console.log(`🌐 Fetching URL: ${safeUrl}`);
                const response = await fetch(safeUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                    },
                    signal: AbortSignal.timeout(10_000),
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const html = await response.text();
                scrapedText = cleanHtml(html);
                parts.push({ text: `\n\nWEBSITE CONTENT (${link}):\n${scrapedText}` });
                console.log(`   ✅ URL fetched (${scrapedText.length} chars)`);
            } catch (err) {
                console.warn("   ⚠️  Failed to fetch URL:", err.message);
                parts.push({
                    text: `\n\n(Note: Failed to scrape website ${link} — ${err.message}. Infer from URL name.)`,
                });
            }
        }

        // ── 2. Process File ──────────────────────────────────────────────────
        if (file) {
            const base64Data = file.buffer.toString("base64");
            const mimeType = file.mimetype;

            if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
                parts.push({ inlineData: { data: base64Data, mimeType } });
            } else {
                const textContent = file.buffer.toString("utf-8");
                scrapedText += " " + textContent;
                parts.push({ text: `\n\nUPLOADED DOCUMENT (${file.originalname}):\n${textContent}` });
            }
            console.log(`   ✅ File processed: ${file.originalname} (${file.mimetype})`);
        }

        // ── 3. Keyword extraction (parallel, no API cost) ────────────────────
        const keywordResult = extractFromKeywords(scrapedText);
        console.log(`   📝 Keyword detection: category=${keywordResult.category}, gender=${keywordResult.gender}, cities=[${keywordResult.cities.join(",")}]`);

        // ── 4. Gemini Analysis ───────────────────────────────────────────────
        console.log("🤖 Running Gemini brand extraction...");
        const result = await model.generateContent(parts);
        const responseText = result.response.text();

        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        let rawAnalysis;
        try {
            rawAnalysis = JSON.parse(cleanJson);
        } catch (e) {
            console.error("❌ Failed to parse Gemini JSON:", responseText.slice(0, 300));
            // Fall back to keyword-based analysis
            rawAnalysis = {
                brand_name: link ? new URL(link).hostname.replace("www.", "").split(".")[0] : "Unknown Brand",
                brand_category: keywordResult.category || "lifestyle",
                target_gender: keywordResult.gender || "Unisex",
                target_cities: keywordResult.cities || [],
            };
            console.log("   ⚠️  Using keyword-based fallback");
        }

        // ── 5. Validate & merge ──────────────────────────────────────────────
        const analysis = validateSimpleAnalysis(rawAnalysis, keywordResult);

        console.log(`✅ Brand: ${analysis.brand_name}`);
        console.log(`   Category: ${analysis.brand_category}`);
        console.log(`   Gender: ${analysis.target_gender}`);
        console.log(`   Cities: [${analysis.target_cities.join(", ")}]`);

        // ── 6. Search influencers with new scoring model ─────────────────────
        const searchQuery = `Find ${analysis.brand_category} influencers in India`;

        // Build brand context string for scoring engine
        const brandContext = [
            `category: ${analysis.brand_category}`,
            `gender: ${analysis.target_gender}`,
            analysis.target_cities.length > 0 ? `cities: ${analysis.target_cities.join(",")}` : null,
        ].filter(Boolean).join(" | ");

        console.log("🔍 Searching influencers with India-City model...");

        const rawSuggestions = await searchInfluencers(searchQuery, 15, "", {}, brandContext);
        const suggestions = formatForSearchAPI(rawSuggestions);

        const processingTime = Date.now() - startTime;

        return res.json({
            analysis,
            suggestions,
            meta: {
                total_suggestions: suggestions.length,
                top_match_score: suggestions[0]?.match?.score || 0,
                processing_time_ms: processingTime,
                model: "india-city-v5",
            },
        });

    } catch (err) {
        console.error("❌ Brand Analysis Error:", err.message);
        const detail = err.message?.includes("blocked") || err.message?.includes("Invalid")
            ? err.message
            : "Analysis failed. Please try again.";
        return res.status(400).json({ detail });
    }
});

export default router;