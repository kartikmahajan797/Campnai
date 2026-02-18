
import { Router } from "express";
import { db, firebaseAdmin } from "../core/config.js";
import { authenticate } from "../core/auth.js";

const router = Router();
const COLLECTION_NAME = "user_campaigns";

// POST /api/v1/campaigns
router.post("/", authenticate, async (req, res) => {
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
router.patch("/:id", authenticate, async (req, res) => {
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
router.post("/:id/generate-suggestions", authenticate, async (req, res) => {
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

        // Construct a rich natural language query
        // E.g. "fitness influencer in India for high reach brand awareness"
        const niche = analysis.niche || analysis.industry || "general";
        const goalText = goalMap[p.primaryGoal] || "";
        const budgetText = budgetMap[p.budgetRange] || "";
        
        const searchQuery = `${niche} influencer for ${goalText} ${budgetText} ${analysis.brand_tone || ''}`;
        
        // Determine limit (default 10)
        const limit = 10;

        // Construct filter context
        // E.g. "niche: fitness. location: India."
        const filterParts = [];
        if (niche) filterParts.push(`niche: ${niche}`);
        // We can add more filters if we had structured data for location etc.
        // For now, let's rely on the semantic query.
        
        const rawSuggestions = await searchInfluencers(searchQuery, limit, filterParts.join(". "));
        const suggestions = formatForSearchAPI(rawSuggestions);

        await docRef.update({
            suggestions: suggestions,
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: "Suggestions generated", suggestions });

    } catch (error) {
        console.error("Error generating suggestions:", error);
        res.status(500).json({ detail: "Failed to generate suggestions" });
    }
});

export default router;
