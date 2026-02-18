import { Router } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchInfluencers, formatForSearchAPI } from "../services/influencerSearch.js";

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Initialize Gemini (singleton)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Strip HTML tags from scraped web content ────────────────────────────────
const cleanHtml = (html) =>
    html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 20000);

// ─── Enterprise Brand Analysis Prompt ────────────────────────────────────────
const BRAND_ANALYSIS_PROMPT = `You are an Enterprise-Grade AI Brand Intelligence & Influencer Marketing System.

Your task is to perform a DEEP, multi-dimensional analysis of ALL provided inputs 
(website content, uploaded documents, images) and produce a structured, investor-ready 
brand intelligence report.

═══════════════════════════════════════════════════════════════
ANALYSIS FRAMEWORK:
═══════════════════════════════════════════════════════════════

1. BRAND POSITIONING ANALYSIS
   - Market position (leader / challenger / niche / emerging)
   - Unique Selling Proposition (USP)
   - Competitive advantage
   - Brand maturity stage (startup / growth / established / legacy)

2. PRODUCT & SERVICE PORTFOLIO
   - List each product/service with name, category, and price range
   - Identify hero products vs. supporting products
   - Revenue model (DTC, B2B, subscription, marketplace, freemium)

3. TARGET AUDIENCE SEGMENTATION
   - Define 2-3 distinct audience segments
   - Each segment: label, age range, gender split, interests, income level, psychographics
   - Primary vs. secondary audience

4. GEOGRAPHIC INTELLIGENCE
   - Primary markets with maturity level (established / emerging / untapped)
   - Regional preferences and cultural considerations

5. COMPETITOR LANDSCAPE
   - Identify 3-5 key competitors
   - For each: name, relative market position, key differentiator
   - Brand's competitive moat

6. PRICING & MONETIZATION
   - Price segment (budget / mid-range / premium / luxury)
   - Pricing strategy (penetration / skimming / value-based / competitive)
   - Average order value estimation

7. COMMUNICATION & MARKETING TONE
   - Tone profile (formal/casual, aspirational/practical, bold/subtle)
   - Content pillars (education, entertainment, inspiration, community)
   - Preferred communication channels

8. INFLUENCER MARKETING READINESS
   - Best platforms for the brand
   - Recommended influencer types and tiers
   - Content formats that align
   - Suggested campaign hooks and hashtags

═══════════════════════════════════════════════════════════════
CONFIDENCE SCORING RULES:
═══════════════════════════════════════════════════════════════
- Assign confidence_scores (0-100) for each major section
- 90-100: Directly stated in source material
- 70-89: Strongly inferred from multiple signals
- 50-69: Reasonably inferred from limited signals
- 30-49: Weakly inferred, mark as [INFERRED]
- 0-29: No data available, mark as [ESTIMATED]

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON ONLY:
═══════════════════════════════════════════════════════════════

{
  "brand_name": "",
  "industry": "",
  "brand_positioning": {
    "market_position": "leader|challenger|niche|emerging",
    "usp": "",
    "competitive_advantage": "",
    "maturity_stage": "startup|growth|established|legacy"
  },
  "products": [
    { "name": "", "category": "", "price_range": "", "is_hero": false }
  ],
  "target_audience": {
    "primary_segment": {
      "label": "", "age_range": "", "gender": "", "interests": [],
      "income_level": "", "psychographics": ""
    },
    "secondary_segments": [
      { "label": "", "age_range": "", "gender": "", "interests": [] }
    ]
  },
  "primary_regions": [
    { "region": "", "market_maturity": "established|emerging|untapped" }
  ],
  "competitor_landscape": [
    { "name": "", "market_position": "", "key_differentiator": "" }
  ],
  "pricing": {
    "segment": "budget|mid-range|premium|luxury",
    "strategy": "",
    "avg_order_value": ""
  },
  "brand_tone": "",
  "communication": {
    "tone_profile": "",
    "content_pillars": [],
    "preferred_channels": []
  },
  "marketing_goal": "",
  "best_platforms": [],
  "recommended_influencer_type": "",
  "influencer_tiers": ["nano","micro","macro","celebrity"],
  "content_formats": [],
  "hashtags": [],
  "campaign_hooks": [],
  "confidence_scores": {
    "brand_identity": 0,
    "product_data": 0,
    "audience_data": 0,
    "competitor_data": 0,
    "pricing_data": 0,
    "geographic_data": 0,
    "overall": 0
  },
  "data_quality": {
    "sources_analyzed": 0,
    "inferred_fields": [],
    "estimated_fields": []
  },
  "ready_for_next_pipeline": true
}

RULES:
- Output ONLY valid JSON. No explanations. No markdown. No extra text.
- Combine information from website, images, and documents holistically.
- If information is missing, infer intelligently and flag it in data_quality.
- Focus on influencer marketing utility — every field should help find the right creators.
- Be precise with confidence scores — do not inflate them.`;

// ─── Validation & Confidence Engine ──────────────────────────────────────────
const REQUIRED_FIELDS = [
    "brand_name", "industry", "brand_positioning", "products",
    "target_audience", "primary_regions", "brand_tone", "marketing_goal",
    "best_platforms", "content_formats"
];

function validateAndEnrich(analysis) {
    const validation = {
        is_valid: true,
        missing_fields: [],
        inferred_fields: analysis.data_quality?.inferred_fields || [],
        estimated_fields: analysis.data_quality?.estimated_fields || [],
        field_completeness: 0,
        warnings: [],
    };

    // Check required fields
    let filled = 0;
    for (const field of REQUIRED_FIELDS) {
        const val = analysis[field];
        if (!val || (Array.isArray(val) && val.length === 0) || val === "") {
            validation.missing_fields.push(field);
        } else {
            filled++;
        }
    }
    validation.field_completeness = Math.round((filled / REQUIRED_FIELDS.length) * 100);

    // Validate confidence scores exist and are sensible
    if (!analysis.confidence_scores) {
        analysis.confidence_scores = {
            brand_identity: 50,
            product_data: 50,
            audience_data: 50,
            competitor_data: 30,
            pricing_data: 30,
            geographic_data: 40,
            overall: 40,
        };
        validation.warnings.push("Confidence scores were missing — defaults applied.");
    }

    // Calculate overall confidence if not set properly
    const cs = analysis.confidence_scores;
    const weights = { brand_identity: 0.25, product_data: 0.20, audience_data: 0.25, competitor_data: 0.10, pricing_data: 0.10, geographic_data: 0.10 };
    let weightedSum = 0;
    for (const [key, weight] of Object.entries(weights)) {
        weightedSum += (cs[key] || 0) * weight;
    }
    cs.overall = Math.round(weightedSum);

    // Ensure data_quality exists
    if (!analysis.data_quality) {
        analysis.data_quality = { sources_analyzed: 1, inferred_fields: [], estimated_fields: [] };
    }

    // Validate products array
    if (analysis.products && Array.isArray(analysis.products)) {
        analysis.products = analysis.products.filter(p => p && p.name);
    }

    // Validate competitor landscape
    if (analysis.competitor_landscape && Array.isArray(analysis.competitor_landscape)) {
        analysis.competitor_landscape = analysis.competitor_landscape.filter(c => c && c.name);
    }

    // Detect potential duplicates in products
    if (analysis.products) {
        const names = analysis.products.map(p => p.name?.toLowerCase());
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);
        if (dupes.length > 0) {
            validation.warnings.push(`Duplicate products detected: ${dupes.join(", ")}`);
        }
    }

    // Validate regions
    if (analysis.primary_regions && Array.isArray(analysis.primary_regions)) {
        // Normalize — accept both string and object formats
        analysis.primary_regions = analysis.primary_regions.map(r => {
            if (typeof r === "string") return { region: r, market_maturity: "established" };
            return r;
        });
    }

    // Ensure target_audience structure
    if (analysis.target_audience && !analysis.target_audience.primary_segment) {
        // Migrate from old format
        const ta = analysis.target_audience;
        analysis.target_audience = {
            primary_segment: {
                label: "Core Audience",
                age_range: ta.age_range || "",
                gender: ta.gender || "",
                interests: ta.interests || [],
                income_level: ta.income_level || "",
                psychographics: ta.lifestyle || "",
            },
            secondary_segments: [],
        };
    }

    // Ensure brand_positioning structure
    if (!analysis.brand_positioning || typeof analysis.brand_positioning === "string") {
        analysis.brand_positioning = {
            market_position: "emerging",
            usp: analysis.brand_positioning || "",
            competitive_advantage: "",
            maturity_stage: "growth",
        };
    }

    // Ensure pricing structure
    if (!analysis.pricing) {
        analysis.pricing = {
            segment: analysis.price_segment || "mid-range",
            strategy: "",
            avg_order_value: "",
        };
    }

    // Ensure communication structure
    if (!analysis.communication) {
        analysis.communication = {
            tone_profile: analysis.brand_tone || "",
            content_pillars: [],
            preferred_channels: analysis.best_platforms || [],
        };
    }

    validation.is_valid = validation.missing_fields.length <= 3;
    return { analysis, validation };
}

// ─── POST /analyze-brand ─────────────────────────────────────────────────────
router.post("/analyze-brand", upload.single("file"), async (req, res) => {
    const startTime = Date.now();

    try {
        const { link } = req.body;
        const file = req.file;
        let sourcesAnalyzed = 0;

        console.log("═══════════════════════════════════════════════");
        console.log("📋 Brand Intelligence Analysis Request");
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

        // ── 1. Process URL ───────────────────────────────────────────────────
        if (link) {
            try {
                console.log(`🌐 Fetching URL: ${link}`);
                const response = await fetch(link, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                    },
                    signal: AbortSignal.timeout(10_000),
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const html = await response.text();
                const cleanText = cleanHtml(html);
                parts.push({ text: `\n\nWEBSITE CONTENT (${link}):\n${cleanText}` });
                sourcesAnalyzed++;
                console.log(`   ✅ URL fetched (${cleanText.length} chars)`);
            } catch (err) {
                console.warn("   ⚠️  Failed to fetch URL:", err.message);
                parts.push({
                    text: `\n\n(Note: Failed to scrape website ${link} — ${err.message}. Infer from other inputs.)`,
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
                parts.push({ text: `\n\nUPLOADED DOCUMENT (${file.originalname}):\n${textContent}` });
            }
            sourcesAnalyzed++;
            console.log(`   ✅ File processed: ${file.originalname} (${file.mimetype})`);
        }

        // ── 3. Gemini Deep Brand Analysis ────────────────────────────────────
        console.log("🤖 Running Gemini deep brand intelligence analysis...");
        const result = await model.generateContent(parts);
        const responseText = result.response.text();

        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        let rawAnalysis;
        try {
            rawAnalysis = JSON.parse(cleanJson);
        } catch (e) {
            console.error("❌ Failed to parse Gemini JSON:", responseText.slice(0, 300));
            return res.status(500).json({ detail: "AI analysis failed to produce valid JSON. Please try again." });
        }

        // ── 4. Validate & Enrich ─────────────────────────────────────────────
        rawAnalysis.data_quality = rawAnalysis.data_quality || {};
        rawAnalysis.data_quality.sources_analyzed = sourcesAnalyzed;
        const { analysis, validation } = validateAndEnrich(rawAnalysis);

        console.log(`✅ Brand: ${analysis.brand_name} | Industry: ${analysis.industry}`);
        console.log(`   Confidence: ${analysis.confidence_scores.overall}% | Completeness: ${validation.field_completeness}%`);
        if (validation.warnings.length) console.log(`   ⚠️  Warnings: ${validation.warnings.join("; ")}`);

        // ── 5. Build influencer search from enriched analysis ─────────────────
        const searchQuery = [
            `Find influencers for ${analysis.brand_name}`,
            analysis.industry ? `Industry: ${analysis.industry}` : null,
            analysis.marketing_goal ? `Goal: ${analysis.marketing_goal}` : null,
            analysis.brand_tone ? `Tone: ${analysis.brand_tone}` : null,
            analysis.target_audience?.primary_segment?.interests?.length
                ? `Audience interests: ${analysis.target_audience.primary_segment.interests.join(", ")}`
                : null,
            analysis.products?.length ? `Products: ${analysis.products.map(p => p.name).join(", ")}` : null,
            analysis.brand_positioning?.usp ? `USP: ${analysis.brand_positioning.usp}` : null,
        ].filter(Boolean).join(". ");

        // REMOVED STRICT FILTERING: Strict metadata filters (niche/location) cause 0 results 
        // if AI analysis doesn't exactly match Pinecone data. 
        // We now rely on vector search + soft scoring in influencerSearch.js.
        const explicitFilter = {};

        console.log("🔍 Searching influencers with enriched context...");

        const searchContext = [
            `Niche: ${analysis.industry}`,
            `Goal: ${analysis.marketing_goal}`,
            `Tone: ${analysis.brand_tone}`,
            `Audience: ${analysis.target_audience?.primary_segment?.interests?.join(", ")}`,
            `Positioning: ${analysis.brand_positioning?.market_position}`,
        ].filter(Boolean).join(". ");

        const rawSuggestions = await searchInfluencers(searchQuery, 15, searchContext, explicitFilter);
        const suggestions = formatForSearchAPI(rawSuggestions);

        const processingTime = Date.now() - startTime;

        return res.json({
            analysis,
            validation,
            suggestions,
            meta: {
                total_suggestions: suggestions.length,
                top_match_score: suggestions[0]?.match?.score || 0,
                niche_used: explicitFilter.niche || null,
                processing_time_ms: processingTime,
                sources_analyzed: sourcesAnalyzed,
                confidence_overall: analysis.confidence_scores.overall,
            },
        });

    } catch (err) {
        console.error("❌ Brand Analysis Error:", err);
        return res.status(500).json({ detail: "Analysis failed. Please try again." });
    }
});

export default router;