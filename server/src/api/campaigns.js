
import { Router } from "express";
import { db, firebaseAdmin } from "../core/config.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { verifyCSRFToken } from "../config/csrfService.js";

const router = Router();
const COLLECTION_NAME = "user_campaigns";

// POST /api/v1/campaigns
router.post("/", authenticate, verifyCSRFToken, async (req, res) => {
    try {
        const { analysisResult, suggestions } = req.body;
        const user = req.user;

        if (!user || !user.uid) {
            return res.status(401).json({ detail: "User not authenticated." });
        }

        if (!analysisResult) {
            return res.status(400).json({ detail: "Missing analysisResult." });
        }

        const campaignData = {
            userId: user.uid,
            createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            status: "draft",
            analysisResult,
            suggestions: suggestions || [],
            shortlist: [],
            name: analysisResult.brand_name || "New Campaign"
        };

        const docRef = await db.collection(COLLECTION_NAME).add(campaignData);
        console.log(`Campaign created via Backend: ${docRef.id} for user ${user.uid}`);

        res.status(201).json({ id: docRef.id, message: "Campaign created successfully" });

    } catch (error) {
        console.error("Error creating campaign:", error);
        res.status(500).json({ detail: "Failed to create campaign." });
    }
});

// GET /api/v1/campaigns (List all user campaigns)
router.get("/", authenticate, async (req, res) => {
    try {
        const user = req.user;
        const campaignsRef = db.collection(COLLECTION_NAME);
        const snapshot = await campaignsRef.where('userId', '==', user.uid).get();

        if (snapshot.empty) {
            return res.json([]);
        }

        const campaigns = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(campaigns);

    } catch (error) {
        console.error("Error fetching user campaigns:", error);
        res.status(500).json({ detail: "Failed to fetch campaigns." });
    }
});

// GET /api/v1/campaigns/:id
router.get("/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const docRef = db.collection(COLLECTION_NAME).doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ detail: "Campaign not found" });
        }

        const data = docSnap.data();

        // Verify ownership
        if (data.userId !== user.uid) {
            return res.status(403).json({ detail: "Not authorized to view this campaign" });
        }

        res.json({ id: docSnap.id, ...data });

    } catch (error) {
        console.error("Error fetching campaign:", error);
        res.status(500).json({ detail: "Failed to fetch campaign" });
    }
});

// PATCH /api/v1/campaigns/:id
router.patch("/:id", authenticate, verifyCSRFToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // { preferences: {...}, shortlist: [...] }
        const user = req.user;

        const docRef = db.collection(COLLECTION_NAME).doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ detail: "Campaign not found" });
        }

        const data = docSnap.data();
        if (data.userId !== user.uid) {
            return res.status(403).json({ detail: "Not authorized to update this campaign" });
        }

        const updateData = {
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        };

        if (updates.preferences) updateData.preferences = updates.preferences;
        if (updates.shortlist) updateData.shortlist = updates.shortlist;
        if (updates.suggestions) updateData.suggestions = updates.suggestions;
        if (updates.status) updateData.status = updates.status;

        await docRef.update(updateData);

        res.json({ message: "Campaign updated successfully" });

    } catch (error) {
        console.error("Error updating campaign:", error);
        res.status(500).json({ detail: "Failed to update campaign" });
    }
});

// POST /api/v1/campaigns/:id/generate-suggestions
router.post("/:id/generate-suggestions", authenticate, verifyCSRFToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const docRef = db.collection(COLLECTION_NAME).doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ detail: "Campaign not found" });
        }

        const data = docSnap.data();
        if (data.userId !== user.uid) {
            return res.status(403).json({ detail: "Not authorized" });
        }

        // Import the AI service dynamically or assume it's available
        // For now, we will use the existing searchAPI logic but optimized for this flow.
        // We need to import the search function. 
        // Let's assume we can import it from '../services/searchAPI.js' or similar.
        // Wait, the previous logic was in `analyze-brand`. 
        // let's look at `searchAPI.js` to see if we can reuse `searchInfluencers`.

        const { searchInfluencers, formatForSearchAPI } = await import("../services/influencerSearch.js");

        // Helper: Convert preferences to search query string
        // The searchInfluencers function expects: (query, limit, filterContext)
        // We need to construct these from our preferences object.

        const goalMap = {
            'Awareness': 'high reach, brand awareness, visibility',
            'Sales / Conversions': 'high conversion, sales, roi, authentic',
            'Product Launch': 'trendsetter, hype, new products, unboxing',
            'App Installs': 'tech savvy, app reviews, downloads, gaming',
            'Creator Seeding': 'micro influencers, gifting, product reviews, authentic'
        };

        const budgetMap = {
            'Under ₹1 Lakh': 'micro influencer, affordable',
            '₹1-5 Lakh': 'mid-tier, growing',
            '₹5-10 Lakh': 'macro, established',
            '₹10 Lakh+': 'celebrity, massive reach'
        };

        const timelineMap = {
            '1 Week': 'quick turnaround',
            '15 Days': 'collab',
            '30 Days': 'long term partnership, ambassador'
        };

        const p = data.preferences || {};
        const analysis = data.analysisResult || {};

        // ── Extract Simplified Brand Data (v5 India-City Model) ─────────────────
        const brandCategory = analysis.brand_category || analysis.niche || analysis.industry || "general";
        const targetGender = analysis.target_gender || "Unisex";
        const targetCities = analysis.target_cities || [];
        
        // ── Parse Budget Logic ─────────────────
        const budgetText = budgetMap[p.budgetRange] || "";
        let budgetRangeText = "";
        if (p.budgetMin != null && p.budgetMax != null) {
            const minL = (p.budgetMin / 100000).toFixed(1);
            const maxL = (p.budgetMax / 100000).toFixed(1);
            budgetRangeText = `budget between ₹${minL}L and ₹${maxL}L`;
        }

        const searchQuery = [
            brandCategory,
            "influencer for",
            goalMap[p.primaryGoal] || "",
            budgetText,
            budgetRangeText,
            analysis.brand_tone || ''
        ].filter(Boolean).join(" ");

        // Build the new brand context object for computeMatchScore
        const brandContextForScore = {
            category: brandCategory,
            gender: targetGender,
            cities: targetCities
        };

        const limit = parseInt(req.query.count, 10) || 10;

        // Ensure we fetch enough candidates since our local scoring engine 
        // will aggressively filter out category mismatches
        const fetchLimit = limit * 5; 

        // Get existing IDs to filter them out client-side
        const existingIds = new Set((data.suggestions || []).map(s => s.id).filter(Boolean));

        // We DO NOT pass a strict category filter string to Pinecone anymore.
        // Our new matchesCategory() handles it locally across both `niche` and `brand_fit`.
        const rawSuggestions = await searchInfluencers(
            searchQuery, 
            fetchLimit + existingIds.size, 
            "", // no strict context
            null, // no explicit filter
            brandContextForScore // Pass the new object for local scoring
        );

        // Filter out existing IDs client-side
        const filteredSuggestions = rawSuggestions.filter(s => !existingIds.has(s.id));

        // Take only the requested number
        const newSuggestions = formatForSearchAPI(filteredSuggestions.slice(0, limit));
        const mergedSuggestions = [...(data.suggestions || []), ...newSuggestions];

        await docRef.update({
            suggestions: mergedSuggestions,
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: "Suggestions generated", suggestions: newSuggestions });

    } catch (error) {
        console.error("Error generating suggestions:", error);
        res.status(500).json({ detail: "Failed to generate suggestions" });
    }
});

// DELETE /api/v1/campaigns/:id
router.delete("/:id", authenticate, verifyCSRFToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const docRef = db.collection(COLLECTION_NAME).doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ detail: "Campaign not found" });
        }
        const data = docSnap.data();
        if (data.userId !== user.uid) {
            return res.status(403).json({ detail: "Not authorized to delete this campaign" });
        }

        await docRef.delete();

        // Cascade: delete all outreach docs for this campaign
        const OUTREACH_COLLECTION = 'campaign_outreaches';
        const outreachSnap = await db.collection(OUTREACH_COLLECTION)
            .where('campaignId', '==', id)
            .get();

        const batch = db.batch();
        outreachSnap.docs.forEach(doc => batch.delete(doc.ref));
        if (!outreachSnap.empty) await batch.commit();

        console.log(`[Campaign] Deleted campaign ${id} + ${outreachSnap.size} outreach doc(s)`);
        res.json({ message: 'Campaign and all outreach data deleted.', outreachesDeleted: outreachSnap.size });

    } catch (error) {
        console.error("Error deleting campaign:", error);
        res.status(500).json({ detail: "Failed to delete campaign" });
    }
});

export default router;
