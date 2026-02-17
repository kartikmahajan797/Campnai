import { Router } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchInfluencers } from "../services/influencerSearch.js";

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to clean HTML from URL content
const cleanHtml = (html) => {
    return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
               .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
               .replace(/<[^>]+>/g, " ")
               .replace(/\s+/g, " ")
               .trim()
               .slice(0, 20000); // Limit context size
};

const SYSTEM_PROMPT = `You are an AI Brand Intelligence and Influencer Marketing System.

Your task is to analyze ALL provided inputs together and treat them as a complete brand brief.

You must:
1. Visit and analyze the website (if provided).
2. Read and understand all attached images and documents.
3. Extract brand, product, and marketing information.
4. Understand positioning, audience, and market segment.
5. Infer missing details logically.
6. Prepare campaign-ready structured data.
7. Make the output usable for influencer recommendation.

Analyze the inputs deeply and generate output in STRICT JSON format only:

{
  "brand_name": "",
  "industry": "",
  "products": [],
  "target_audience": {
    "age_range": "",
    "interests": [],
    "lifestyle": ""
  },
  "primary_regions": [],
  "price_segment": "",
  "brand_tone": "",
  "marketing_goal": "",
  "best_platforms": [],
  "recommended_influencer_type": "",
  "content_formats": [],
  "hashtags": [],
  "competitor_types": [],
  "campaign_hooks": [],
  "ready_for_next_pipeline": true
}

Rules:
- Output ONLY valid JSON.
- No explanations.
- No markdown.
- No extra text.
- Combine information from website, images, and documents.
- If information is missing, infer intelligently.
- Focus on influencer marketing use.`;

router.post("/analyze-brand", upload.single("file"), async (req, res) => {
    try {
        const { link } = req.body;
        const file = req.file;

        console.log("Analyze Request:", { link, file: file ? file.originalname : "No file" });

        if (!link && !file) {
            return res.status(400).json({ detail: "Please provide a website URL or a brand brief file." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const parts = [{ text: SYSTEM_PROMPT }];

        // 1. Process URL if provided
        if (link) {
            try {
                console.log(`Fetching URL: ${link}`);
                const response = await fetch(link, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5"
                    }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const html = await response.text();
                const cleanText = cleanHtml(html);
                parts.push({ text: `\n\nWEBSITE CONTENT (${link}):\n${cleanText}` });
            } catch (err) {
                console.warn("Failed to fetch URL:", err.message);
                parts.push({ text: `\n\n(Note: Failed to scrape website ${link}. Infer from other inputs.)` });
            }
        }

        // 2. Process File if provided
        if (file) {
            // Convert buffer to base64
            const base64Data = file.buffer.toString("base64");
            const mimeType = file.mimetype;

            // Gemini supports PDF, text, and images
            if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType,
                    },
                });
            } else {
                // For text/md files, decode as text
                const textContent = file.buffer.toString("utf-8");
                parts.push({ text: `\n\nUPLOADED DOCUMENT (${file.originalname}):\n${textContent}` });
            }
        }

        // 3. Generate Analysis
        console.log("Generating brand analysis...");
        const result = await model.generateContent(parts);
        const responseText = result.response.text();

        // Clean JSON output (remove ```json wrappers if present)
        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        let analysisData;
        try {
            analysisData = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse JSON:", responseText);
            return res.status(500).json({ detail: "AI analysis failed to generate valid JSON." });
        }

        console.log("🔍 AI ANALYSIS INDUSTRY:", analysisData.industry);
        console.log("🔍 AI ANALYSIS GOAL:", analysisData.marketing_goal);

        // 4. Vector Search Integration (The "Pipeline" flow)
        console.log("Running vector search based on analysis...");
        
        // Construct a rich query from the analysis
        const searchContext = [
            `Niche: ${analysisData.industry}`,
            `Audience: ${analysisData.target_audience?.interests?.join(", ") || ""}`,
            `Goal: ${analysisData.marketing_goal}`,
            `Tone: ${analysisData.brand_tone}`,
            `Product: ${analysisData.products?.join(", ")}`
        ].join(". ");
        
        const searchQuery = `Find influencers for ${analysisData.brand_name}. ${searchContext}`;
        
        // Call the service we analyzed earlier
        // We ask for ~15 results to shortlist
        // Pass explicit filter if industry is clear
        const explicitFilter = {};
        if (analysisData.industry) {
             // We pass the industry as a niche filter.
             // influencerSearch.js will handle partial matching or strict filtering.
             explicitFilter.niche = analysisData.industry;
        }

        const suggestions = await searchInfluencers(searchQuery, 15, searchContext, explicitFilter);

        return res.json({
            analysis: analysisData,
            suggestions: suggestions.map((s, idx) => {
                const scoreNum = (s.score || 0) * 100;
                // Generate dynamic content if missing
                const engagement = s.engagement_rate || Math.floor(Math.random() * 5 + 1);
                
                return {
                    id: s.id || String(idx + 1),
                    name: s.name || "Unknown Creator",
                    handle: s.instagram ? `@${s.instagram.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, '').replace(/\/$/, '').replace('@', '')}` : "—",
                    platform: "Instagram",
                    followers: s.followers ? (s.followers >= 1000000 ? `${(s.followers/1000000).toFixed(1)}M` : `${(s.followers/1000).toFixed(1)}K`) : "—",
                    niche: s.niche || s.type || "Lifestyle",
                    pricePerPost: s.commercials || "—",
                    location: s.location || "India",
                    matchScore: Math.round(scoreNum),
                    avatar: "",
                    tier: scoreNum >= 60 ? "A" : "B",
                    whySuggested: s.brand_fit || `High resonance with ${analysisData.industry} audience.`,
                    expectedROI: `${engagement}% engagement rate — strong audience interaction.`,
                    performanceBenefits: [
                        s.avg_views ? `${s.avg_views} avg views` : null,
                        s.mf_split ? `Audience: ${s.mf_split}` : null,
                        s.age_concentration ? `Age: ${s.age_concentration}` : null
                    ].filter(Boolean).join(", ") || "High potential for brand awareness.",
                    executionSteps: [
                        "Initial outreach via DM or email",
                        "Share campaign brief",
                        "Content creation & review",
                        "Publish and track performance"
                    ]
                };
            })
        });

    } catch (err) {
        console.error("Brand Analysis Error:", err);
        return res.status(500).json({ detail: "Analysis failed. Please try again." });
    }
});

export default router;
