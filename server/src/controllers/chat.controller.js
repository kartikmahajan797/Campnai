import { v4 as uuidv4 } from "uuid";
import { db, geminiModel, firebaseAdmin } from "../core/config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NEO_SYSTEM_PROMPT } from "../prompts/neo.prompt.js";
import {
    searchInfluencers,
    formatSearchResults,
    getDynamicTopK,
} from "../services/influencerSearch.js";

const FieldValue = firebaseAdmin.firestore.FieldValue;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract first URL from a message string */
function extractUrl(text) {
    const match = text.match(/https?:\/\/[^\s]+/i);
    if (match) return match[0];
    // Also catch "www.brand.com" style without protocol
    const wwwMatch = text.match(/\bwww\.[a-z0-9-]+\.[a-z]{2,}[^\s]*/i);
    if (wwwMatch) return `https://${wwwMatch[0]}`;
    return null;
}

/** Minimal HTML cleaner — strips tags/scripts/styles, trims to 15K chars */
function cleanHtml(html) {
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 15000);
}

/**
 * Scrape a URL and run Gemini brand intelligence on it.
 * Returns a compact brandContext string for influencer scoring + a summary for Gemini chat.
 */
async function analyzeBrandUrl(url) {
    try {
        console.log(`🌐 Scraping brand URL: ${url}`);
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html      = await response.text();
        const pageText  = cleanHtml(html);
        console.log(`   ✅ Scraped ${pageText.length} chars`);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Analyze this brand website content and extract key information for influencer marketing matching.

Website URL: ${url}
Website Content:
${pageText}

Return a JSON object with ONLY these fields:
{
  "brand_name": "",
  "industry": "",
  "niche_keywords": [],
  "target_gender": "male|female|both",
  "target_age_range": "",
  "primary_regions": [],
  "price_segment": "budget|mid-range|premium|luxury",
  "budget_hint_inr": null,
  "campaign_goal": "",
  "brand_tone": "",
  "usp": "",
  "products": [],
  "influencer_types": [],
  "content_vibe": ""
}

Rules:
- Output ONLY valid JSON. No markdown, no explanation.
- niche_keywords: 3-8 specific keywords like ["skincare","beauty","glow","women"]
- target_gender: infer from products/content
- primary_regions: Indian cities or "Pan-India" or "Global"
- price_segment: infer from product pricing on site
- budget_hint_inr: if any price/budget mentioned, extract as number (e.g. 50000), else null
- influencer_types: e.g. ["micro","macro"] based on brand size
- Be precise and concise`;

        const result     = await model.generateContent(prompt);
        const raw        = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const brandData  = JSON.parse(raw);

        console.log(`   ✅ Brand: ${brandData.brand_name} | Industry: ${brandData.industry} | Niche: ${brandData.niche_keywords?.join(", ")}`);

        // Build a compact scoring context string (passed to influencer scoring engine)
        const scoringContext = [
            brandData.industry          ? `Industry: ${brandData.industry}` : null,
            brandData.niche_keywords?.length ? `Niche: ${brandData.niche_keywords.join(", ")}` : null,
            brandData.target_gender     ? `Target gender: ${brandData.target_gender}` : null,
            brandData.target_age_range  ? `Target age: ${brandData.target_age_range}` : null,
            brandData.primary_regions?.length ? `Regions: ${brandData.primary_regions.join(", ")}` : null,
            brandData.price_segment     ? `Price segment: ${brandData.price_segment}` : null,
            brandData.budget_hint_inr   ? `Budget: INR ${brandData.budget_hint_inr}` : null,
            brandData.campaign_goal     ? `Goal: ${brandData.campaign_goal}` : null,
            brandData.brand_tone        ? `Tone: ${brandData.brand_tone}` : null,
            brandData.usp               ? `USP: ${brandData.usp}` : null,
            brandData.products?.length  ? `Products: ${brandData.products.slice(0, 5).join(", ")}` : null,
        ].filter(Boolean).join(". ");

        return { brandData, scoringContext };

    } catch (err) {
        console.warn(`   ⚠️  Brand URL analysis failed: ${err.message}`);
        return null;
    }
}

/** Format brand analysis into a readable block for Gemini system prompt */
function formatBrandContext(brandData, url) {
    if (!brandData) return "";
    const b = brandData;
    let ctx = `\n\n═══════════════════════════════════════\nBRAND INTELLIGENCE REPORT\n(Analyzed from: ${url})\n═══════════════════════════════════════`;
    if (b.brand_name)        ctx += `\nBrand:          ${b.brand_name}`;
    if (b.industry)          ctx += `\nIndustry:       ${b.industry}`;
    if (b.usp)               ctx += `\nUSP:            ${b.usp}`;
    if (b.niche_keywords?.length) ctx += `\nNiche:          ${b.niche_keywords.join(", ")}`;
    if (b.target_gender)     ctx += `\nTarget Gender:  ${b.target_gender}`;
    if (b.target_age_range)  ctx += `\nTarget Age:     ${b.target_age_range}`;
    if (b.primary_regions?.length) ctx += `\nRegions:        ${b.primary_regions.join(", ")}`;
    if (b.price_segment)     ctx += `\nPrice Segment:  ${b.price_segment}`;
    if (b.budget_hint_inr)   ctx += `\nBudget Signal:  ₹${Number(b.budget_hint_inr).toLocaleString("en-IN")}`;
    if (b.campaign_goal)     ctx += `\nCampaign Goal:  ${b.campaign_goal}`;
    if (b.brand_tone)        ctx += `\nBrand Tone:     ${b.brand_tone}`;
    if (b.products?.length)  ctx += `\nProducts:       ${b.products.slice(0, 8).join(", ")}`;
    if (b.influencer_types?.length) ctx += `\nIdeal Tiers:    ${b.influencer_types.join(", ")}`;
    if (b.content_vibe)      ctx += `\nContent Vibe:   ${b.content_vibe}`;
    ctx += `\n═══════════════════════════════════════`;
    return ctx;
}

// ─── Trigger keywords for influencer search ───────────────────────────────────
const INFLUENCER_SEARCH_REGEX = /influencer|creator|brand|campaign|promote|collab|niche|fashion|clothing|beauty|fitness|lifestyle|recommend|suggest|find|show|discover|partner|skincare|haircare|food|tech|travel|gaming|budget|audience|followers|engagement|shortlist|match|hire|outreach|pricing/i;

// ─── sendMessage ──────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { message, session_id } = req.body;

        if (!geminiModel) {
            return res.status(500).json({ detail: "Gemini API not configured" });
        }
        if (!message || !message.trim()) {
            return res.status(400).json({ detail: "Message cannot be empty" });
        }

        const sessionId = session_id || uuidv4();

        // Fetch conversation history
        const chatRef = db
            .collection("users")
            .doc(uid)
            .collection("chat_sessions")
            .doc(sessionId)
            .collection("messages");

        const historySnap = await chatRef.orderBy("timestamp", "asc").get();

        const conversationHistory = [];
        historySnap.forEach((doc) => {
            const msg = doc.data();
            conversationHistory.push({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
            });
        });

        // ─── Brand URL Detection ──────────────────────────────────────────────
        // Check current message + recent history for a brand website URL
        const recentHistory = conversationHistory.slice(-6).map(h => h.parts[0].text).join(" ");
        const allText       = `${message} ${recentHistory}`;

        let brandAnalysis   = null;  // { brandData, scoringContext }
        const detectedUrl   = extractUrl(message); // Only scrape NEW URLs from current message

        if (detectedUrl) {
            console.log(`🔗 Brand URL detected in message: ${detectedUrl}`);
            brandAnalysis = await analyzeBrandUrl(detectedUrl);
        }

        // ─── Influencer Search (RAG) ──────────────────────────────────────────
        const conversationContext = conversationHistory.map(h => h.parts[0].text).join(" ");
        const needsInfluencerData = INFLUENCER_SEARCH_REGEX.test(allText) || !!brandAnalysis;

        let enhancedPrompt = NEO_SYSTEM_PROMPT;

        if (needsInfluencerData) {
            const topK            = getDynamicTopK(message, conversationContext);
            const scoringContext  = brandAnalysis?.scoringContext || "";

            // Build enriched search query using brand data
            let searchQuery = message;
            if (brandAnalysis?.brandData) {
                const bd = brandAnalysis.brandData;
                searchQuery = [
                    `Find influencers for ${bd.brand_name || "this brand"}`,
                    bd.industry          ? `Industry: ${bd.industry}` : null,
                    bd.niche_keywords?.length ? `Niche: ${bd.niche_keywords.join(", ")}` : null,
                    bd.target_gender !== "both" ? `Audience gender: ${bd.target_gender}` : null,
                    bd.target_age_range  ? `Age: ${bd.target_age_range}` : null,
                    bd.primary_regions?.length ? `Regions: ${bd.primary_regions.join(", ")}` : null,
                    bd.campaign_goal     ? `Goal: ${bd.campaign_goal}` : null,
                ].filter(Boolean).join(". ");
            }

            const searchResults      = await searchInfluencers(
                searchQuery,
                topK,
                conversationContext,
                null,            // no explicit metadata filter
                scoringContext   // brand context for pricing + audience scoring
            );
            const influencerContext  = formatSearchResults(searchResults);
            const brandBlock         = brandAnalysis
                ? formatBrandContext(brandAnalysis.brandData, detectedUrl)
                : "";

            enhancedPrompt += `
${brandBlock}

INFLUENCER DATABASE ACCESS:
You have access to matched influencers below. Follow this CONVERSATION FLOW:

STEP 1 — DISCOVERY (if brand requirements are NOT clear yet):
When the user first mentions they have a brand or want influencers, ask these details in ONE concise message:
- 🎯 What's your brand niche/product? (e.g. skincare, fashion, food)
- 💰 Budget range for the campaign?
- 📱 Platform preference? (Instagram Reels / YouTube / Shorts)
- 📍 Target geography? (e.g. Delhi, Pan-India)
- 👥 Target audience? (age, gender)
- 🎪 Campaign goal? (reach / installs / sales / awareness)
Keep this message SHORT and conversational, not a boring form. Use 3-4 lines max.

STEP 2 — SHORTLISTING (once you have enough info OR a brand URL was provided):
Once brand needs are clear, show the shortlisted influencers. Rules:
1. ONLY use the influencer data provided in "MATCHING INFLUENCERS FROM DATABASE" below.
2. NEVER invent names, handles, emails, followers, or any stats.
3. If you see any influencer profiles below, PRESENT them — even partial matches explain how they could work.
4. ONLY say "We're still building our creator database for this niche" if context LITERALLY contains "[No matching influencers found in the database.]".
5. NEVER mention "database", "vector search", "Pinecone", "AI scoring", or backend details.
6. If a brand URL was analyzed (see BRAND INTELLIGENCE REPORT above), use those brand details to personalize your explanation of why each influencer fits.

SHORTLISTING FORMAT — PROFESSIONAL INFLUENCER MARKETING AGENT:

For each influencer include:
- 🟢/🟡/🔴 **Tier A/B/C** (based on match score from data)
- Name + Instagram link (clickable markdown)
- Location | Followers | ER
- Niche + Brand Fit categories
- Content Vibe
- Audience: M/F split, India %, Age group
- Quoted price per post (from commercials field)
- Brand Affinity Score /10
- Budget Fit: ✅ Within / ⚠️ May exceed / ❌ Over (compare quoted price vs brand budget if known)
- ⚠️ Risk flags if any
- 💡 Why this creator fits THIS specific brand (use brand intelligence data if available)
- Contact: Email + Phone

At the END add:
### 📊 Shortlist Summary Table
| Tier | Name | Handle | Niche | Followers | ER | Price/Post | Budget | Affinity |

### 📧 Contact Table
| Name | Email | Phone |

End with ONE short follow-up question.

${influencerContext}`;
        }

        // Build Gemini model with enhanced system instruction
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const neoModel = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: enhancedPrompt,
        });

        // Save session metadata
        const sessionDocRef = db
            .collection("users")
            .doc(uid)
            .collection("chat_sessions")
            .doc(sessionId);

        await sessionDocRef.set(
            {
                created_at:    FieldValue.serverTimestamp(),
                updated_at:    FieldValue.serverTimestamp(),
                first_message: message.slice(0, 50),
                uid,
            },
            { merge: true }
        );

        // Save user message
        await chatRef.add({
            role:       "user",
            content:    message,
            timestamp:  new Date(),
            created_at: FieldValue.serverTimestamp(),
        });

        // Generate streaming response
        const result = await neoModel.generateContentStream({
            contents: [
                ...conversationHistory,
                { role: "user", parts: [{ text: message }] },
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
        });

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("X-Session-Id", sessionId);

        let fullResponse = "";
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullResponse += chunkText;
                res.write(chunkText);
                await new Promise(r => setTimeout(r, 30));
            }
        }
        res.end();

        // Save AI response
        await chatRef.add({
            role:       "assistant",
            content:    fullResponse,
            timestamp:  new Date(),
            created_at: FieldValue.serverTimestamp(),
        });

    } catch (err) {
        console.error("Chat error:", err);
        if (!res.headersSent) {
            return res.status(500).json({ detail: err.message });
        }
        res.end();
    }
};

export const getHistory = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { sessionId } = req.params;

        const chatRef = db
            .collection("users")
            .doc(uid)
            .collection("chat_sessions")
            .doc(sessionId)
            .collection("messages");

        const snap = await chatRef.orderBy("timestamp", "asc").get();

        const messages = [];
        snap.forEach((doc) => {
            const msg = doc.data();
            if (msg.timestamp?.toDate) msg.timestamp = msg.timestamp.toDate().toISOString();
            delete msg.created_at;
            messages.push(msg);
        });

        return res.json({ session_id: sessionId, messages, total: messages.length });
    } catch (err) {
        return res.status(500).json({ detail: err.message });
    }
};

export const deleteHistory = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { sessionId } = req.params;

        const chatRef = db
            .collection("users")
            .doc(uid)
            .collection("chat_sessions")
            .doc(sessionId)
            .collection("messages");

        const snap  = await chatRef.get();
        const batch = db.batch();
        let count   = 0;

        snap.forEach((doc) => { batch.delete(doc.ref); count++; });
        if (count > 0) await batch.commit();

        await db
            .collection("users")
            .doc(uid)
            .collection("chat_sessions")
            .doc(sessionId)
            .delete();

        return res.json({ status: "success", deleted_messages: count, session_id: sessionId });
    } catch (err) {
        return res.status(500).json({ detail: err.message });
    }
};

export const getSessions = async (req, res) => {
    try {
        const uid  = req.user.uid;
        const snap = await db
            .collection("users")
            .doc(uid)
            .collection("chat_sessions")
            .get();

        const sessions = [];
        snap.forEach((doc) => {
            const data = doc.data();
            if (!data) return;
            const timestamp = data.updated_at?.toDate?.()?.toISOString() || null;
            sessions.push({
                session_id: doc.id,
                title:      data.first_message || "New Chat",
                timestamp,
            });
        });

        sessions.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
        return res.json({ sessions });
    } catch (err) {
        return res.status(500).json({ detail: err.message });
    }
};
