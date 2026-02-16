/**
 * Search API — Direct programmatic access to Pinecone influencer search.
 * GET /api/v1/search-influencers?q=<query>&topK=<n>&niche=<filter>&location=<filter>
 */

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { searchInfluencers } from "../services/influencerSearch.js";

const router = Router();

router.get("/search-influencers", authenticate, async (req, res) => {
    try {
        const { q, topK = 10, niche, location, tier } = req.query;
        console.log(`🔎 Search API called: q="${q}", topK=${topK}, niche=${niche || "—"}, location=${location || "—"}, tier=${tier || "—"}`);

        if (!q || !q.trim()) {
            return res.status(400).json({ detail: "Query parameter 'q' is required." });
        }

        const limit = Math.min(20, Math.max(1, parseInt(topK, 10) || 10));

        // Build context from optional filters
        const filterParts = [];
        if (niche) filterParts.push(`niche: ${niche}`);
        if (location) filterParts.push(`location: ${location}`);
        if (tier) filterParts.push(`${tier} influencers`);
        const filterContext = filterParts.join(". ");

        const results = await searchInfluencers(q, limit, filterContext);

        return res.json({
            query: q,
            topK: limit,
            filters: { niche: niche || null, location: location || null, tier: tier || null },
            total: results.length,
            influencers: results.map((inf) => ({
                name: inf.name || "Unknown",
                match_score: ((inf.score || 0) * 100).toFixed(1) + "%",
                instagram: inf.instagram || null,
                location: inf.location || null,
                gender: inf.gender || null,
                type: inf.type || null,
                niche: inf.niche || null,
                brand_fit: inf.brand_fit || null,
                vibe: inf.vibe || null,
                followers: inf.followers || 0,
                follower_tier: inf.follower_tier || null,
                avg_views: inf.avg_views || 0,
                engagement_rate: inf.engagement_rate || 0,
                mf_split: inf.mf_split || null,
                india_split: inf.india_split || null,
                age_concentration: inf.age_concentration || null,
                commercials: inf.commercials || null,
                contact: {
                    phone: inf.contact_no || null,
                    email: inf.email || null,
                },
            })),
        });
    } catch (err) {
        console.error("Search API error:", err);
        return res.status(500).json({ detail: `Search failed: ${err.message}` });
    }
});

export default router;
