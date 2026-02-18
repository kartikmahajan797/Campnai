/**
 * Search API — Direct programmatic access to Pinecone influencer search.
 * GET /api/v1/search-influencers?q=<query>&topK=<n>&niche=<filter>&location=<filter>&tier=<filter>
 */

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { searchInfluencers, formatForSearchAPI } from "../services/influencerSearch.js";

const router = Router();

router.get("/search-influencers", authenticate, async (req, res) => {
    try {
        const { q, topK = 10, niche, location, tier } = req.query;

        console.log(`🔎 Search API: q="${q}", topK=${topK}, niche=${niche || "—"}, location=${location || "—"}, tier=${tier || "—"}`);

        if (!q || !q.trim()) {
            return res.status(400).json({ detail: "Query parameter 'q' is required." });
        }

        const limit = Math.min(20, Math.max(1, parseInt(topK, 10) || 10));

        // Build explicit filter from query params
        const explicitFilter = {};
        if (niche)    explicitFilter.niche    = niche;
        if (location) explicitFilter.location = location;
        if (tier)     explicitFilter.tier     = tier;

        // Context string for scoring engine
        const filterContext = Object.entries(explicitFilter)
            .map(([k, v]) => `${k}: ${v}`)
            .join(". ");

        const results = await searchInfluencers(q, limit, filterContext, explicitFilter);
        const formatted = formatForSearchAPI(results);

        return res.json({
            query:   q,
            top_k:   limit,
            filters: {
                niche:    niche    || null,
                location: location || null,
                tier:     tier     || null,
            },
            total:       formatted.length,
            influencers: formatted,
        });

    } catch (err) {
        console.error("Search API error:", err);
        return res.status(500).json({ detail: `Search failed: ${err.message}` });
    }
});

export default router;