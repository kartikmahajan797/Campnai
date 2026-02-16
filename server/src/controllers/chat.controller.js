import { v4 as uuidv4 } from "uuid";
import { db, geminiModel, firebaseAdmin } from "../core/config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NEO_SYSTEM_PROMPT } from "../prompts/neo.prompt.js";
import { searchInfluencers, formatSearchResults, getDynamicTopK } from "../services/influencerSearch.js";

const FieldValue = firebaseAdmin.firestore.FieldValue;

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

        // ─── RAG: Dynamic Pinecone search for matching influencers ───────
        // Build full conversation context for smarter searching
        const conversationContext = conversationHistory.map(h => h.parts[0].text).join(" ");
        const allText = (message + " " + conversationContext).toLowerCase();

        // Expanded keyword detection — triggers on campaign, brand, or influencer-related terms
        const needsInfluencerData = /influencer|creator|brand|campaign|promote|collab|niche|fashion|clothing|beauty|fitness|lifestyle|recommend|suggest|find|show|discover|partner|skincare|haircare|food|tech|travel|gaming|budget|audience|followers|engagement|shortlist|match|hire|outreach|pricing/i.test(allText);

        let enhancedPrompt = NEO_SYSTEM_PROMPT;

        if (needsInfluencerData) {
            // Dynamic topK based on query specificity
            const topK = getDynamicTopK(message, conversationContext);

            // Vector search with conversation context for better matching
            const searchResults = await searchInfluencers(message, topK, conversationContext);
            const influencerContext = formatSearchResults(searchResults);

            enhancedPrompt += `

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
Keep this message SHORT and conversational, not a boring form. Use 3-4 lines max asking key questions.

STEP 2 — SHORTLISTING (once you have enough info OR user provides details):
Once you know the brand's needs, show the shortlisted influencers. Rules:
1. ONLY use the influencer data provided below in the "MATCHING INFLUENCERS" section. NEVER invent, fabricate, or hallucinate influencer names, handles, emails, or stats.
2. **CRITICAL**: If influencer data IS provided below (i.e., you see "MATCHING INFLUENCERS FROM DATABASE" with actual profiles), you MUST present those creators. Even if their niche isn't an exact match, explain how they could work for the brand's campaign. NEVER ignore available data.
3. ONLY say "We're still building our creator database for this niche" if the context LITERALLY contains the exact text "[No matching influencers found in the database.]". If you see ANY influencer profiles below, present them.
4. Do NOT make up fake names like "Riya Sen" or "@the_skincare_guy" if they don't appear in the data below.
5. Be concise. Let the data speak.
6. NEVER say "database" or "vector search" to the user.

SHORTLISTING & SCORING (ACT LIKE A PROFESSIONAL INFLUENCER MARKETING AGENT):
When presenting creators, you MUST analyze and include:

1. **Tier Ranking** — Assign each creator a tier based on fit:
   - 🟢 **Tier A** — Strong match (niche + audience + budget aligned)
   - 🟡 **Tier B** — Good match (partial alignment, still worth considering)
   - 🔴 **Tier C** — Weak match (only if no better options)

2. **Brand Affinity Score** — Rate 1-10 based on how well the creator's content, vibe, and audience align with the brand's needs.

3. **Budget Fit** — Based on follower count and niche, estimate if they fit within the brand's budget:
   - ✅ Likely within budget
   - ⚠️ May exceed budget
   - ❌ Likely over budget

4. **Risk Flags** — Mention any concerns:
   - ⚠️ Low engagement despite high followers
   - ⚠️ Niche mismatch
   - ⚠️ No proven brand collab track record

5. **Audience Overlap** — Analyze if the creator's audience matches the brand's target ICP (age, gender, location).

FORMATTING RULES (VERY IMPORTANT):
- Show each creator with DETAILED profile using emojis + tier + score.
- Each field on its own line.
- At the END, add a **Shortlist Summary Table** with tiers, scores, and budget fit.
- Then a **Contact Details** table.
- End with ONE short follow-up.

Example format:

Here are your **top shortlisted creators**:

---

🟢 **Tier A**

📌 **Priya Sharma** ([@glowwithpriya](https://instagram.com/glowwithpriya))
📍 Mumbai | 👥 120K Followers | 📊 4.8% ER
🎯 Skincare, Beauty | 💼 Product Reviews | ✨ Relatable
🏷️ Brand Affinity: **9/10** | 💰 Budget Fit: ✅ Within budget
📧 priya@email.com | 📱 9876543210
💡 **Why?** Strong skincare focus, 70% female audience aged 18-25.

---

🟡 **Tier B**

📌 **Aryan Singh** ([@skin_savvy](https://instagram.com/skin_savvy))
📍 Delhi | 👥 85K Followers | 📊 5.2% ER
🎯 Men's Skincare | 💼 Grooming | ✨ Modern
🏷️ Brand Affinity: **7/10** | 💰 Budget Fit: ✅ Within budget
⚠️ Risk: Niche is men's grooming — may not align if targeting women
📧 aryan@email.com
💡 **Why?** High ER, growing fast, but audience skews male.

---

### 📊 Shortlist Summary

| Tier | Creator | Profile | Niche | Followers | ER | Affinity | Budget Fit |
|------|---------|---------|-------|-----------|-----|----------|------------|
| 🟢 A | **Priya Sharma** | [@glowwithpriya](link) | Skincare | 120K | 4.8% | 9/10 | ✅ |
| 🟡 B | **Aryan Singh** | [@skin_savvy](link) | Men's Skincare | 85K | 5.2% | 7/10 | ✅ |

### 📧 Contact Details
| Creator | Email | Phone |
|---------|-------|-------|
| Priya Sharma | priya@email.com | 9876543210 |
| Aryan Singh | aryan@email.com | — |

Want me to filter by platform or audience age?

${influencerContext}`;
        }

        // Build Gemini model with enhanced system instruction
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const neoModel = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: enhancedPrompt,
        });

        // Save session metadata immediately
        const sessionDocRef = db
            .collection("users")
            .doc(uid)
            .collection("chat_sessions")
            .doc(sessionId);

        await sessionDocRef.set(
            {
                created_at: FieldValue.serverTimestamp(),
                updated_at: FieldValue.serverTimestamp(),
                first_message: message.slice(0, 50),
                uid,
            },
            { merge: true }
        );

        // Save user message immediately
        await chatRef.add({
            role: "user",
            content: message,
            timestamp: new Date(),
            created_at: FieldValue.serverTimestamp(),
        });

        // Generate Stream
        const result = await neoModel.generateContentStream({
            contents: [
                ...conversationHistory,
                { role: "user", parts: [{ text: message }] },
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
        });

        // Set headers for streaming
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("X-Session-Id", sessionId);

        let fullResponse = "";

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullResponse += chunkText;
                res.write(chunkText);
                // Simulate delay for "typewriter" effect if API is too fast
                await new Promise(resolve => setTimeout(resolve, 30));
            }
        }

        res.end();

        // Save AI response after completion
        await chatRef.add({
            role: "assistant",
            content: fullResponse,
            timestamp: new Date(),
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
            if (msg.timestamp && msg.timestamp.toDate) {
                msg.timestamp = msg.timestamp.toDate().toISOString();
            }
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

        const snap = await chatRef.get();
        const batch = db.batch();
        let count = 0;

        snap.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });

        if (count > 0) await batch.commit();

        // Delete session doc
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
        const uid = req.user.uid;

        const snap = await db
            .collection("users")
            .doc(uid)
            .collection("chat_sessions")
            .get();

        const sessions = [];
        snap.forEach((doc) => {
            const data = doc.data();
            if (!data) return;

            const title = data.first_message || "New Chat";
            const updated = data.updated_at;
            const timestamp = updated && updated.toDate ? updated.toDate().toISOString() : null;

            sessions.push({ session_id: doc.id, title, timestamp });
        });

        sessions.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));

        return res.json({ sessions });
    } catch (err) {
        return res.status(500).json({ detail: err.message });
    }
};
