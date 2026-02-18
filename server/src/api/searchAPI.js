/**
 * Search API — Direct programmatic access to Pinecone influencer search.
 *
 * Routes:
 *   GET /api/v1/search-influencers  — Semantic search with scoring engine
 *   GET /api/v1/browse-influencers  — Browse ALL Pinecone data with pagination (no query needed)
 */

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { searchInfluencers, formatForSearchAPI } from "../services/influencerSearch.js";
import { getIndex } from "../core/pinecone.js";

const router = Router();

// ─── Semantic Search ─────────────────────────────────────────────────────────
// GET /api/v1/search-influencers?q=&topK=&niche=&location=&tier=
router.get("/search-influencers", authenticate, async (req, res) => {
    try {
        const { q, topK = 10, niche, location, tier } = req.query;

        console.log(`🔎 Search API: q="${q}", topK=${topK}, niche=${niche || "—"}, location=${location || "—"}, tier=${tier || "—"}`);

        if (!q || !q.trim()) {
            return res.status(400).json({ detail: "Query parameter 'q' is required." });
        }

        // Allow up to 200 results per page for large datasets
        const limit = Math.min(200, Math.max(1, parseInt(topK, 10) || 10));

        // Build explicit filter from query params
        const explicitFilter = {};
        if (niche)    explicitFilter.niche    = { $eq: niche };
        if (location) explicitFilter.location = { $eq: location };
        if (tier)     explicitFilter.follower_tier = { $eq: tier };

        // Context string for scoring engine
        const filterContext = Object.entries(explicitFilter)
            .map(([k, v]) => `${k}: ${v.$eq}`)
            .join(". ");

        // fetchK is now auto-detected from Pinecone stats inside searchInfluencers()
        const results = await searchInfluencers(
            q, limit, filterContext,
            Object.keys(explicitFilter).length ? explicitFilter : null
        );
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

// ─── Browse ALL Influencers (Pinecone Pagination) ────────────────────────────
// GET /api/v1/browse-influencers?page=1&page_size=50&niche=fashion&tier=micro&location=Mumbai
//
// Strategy: Pinecone "list" API returns all vector IDs page-by-page (cursor-based),
// then "fetch" retrieves their full metadata. No embedding needed.
router.get("/browse-influencers", authenticate, async (req, res) => {
    try {
        const { page_size = 50, cursor, niche, tier, location, gender, min_followers, max_followers } = req.query;
        const limit = Math.min(200, Math.max(1, parseInt(page_size, 10) || 50));

        const index = getIndex();
        if (!index) return res.status(503).json({ detail: "Pinecone not configured." });

        // Step 1: List vector IDs (cursor-based pagination)
        const listOpts = { limit };
        if (cursor && cursor !== "null" && cursor !== "undefined") listOpts.paginationToken = cursor;

        console.log(`📋 Browse: page_size=${limit}, cursor=${cursor || "start"}`);
        const listResult = await index.listPaginated(listOpts);
        const vectorIds = (listResult.vectors || []).map(v => v.id);

        if (vectorIds.length === 0) {
            return res.json({ influencers: [], next_cursor: null, has_more: false, returned: 0 });
        }

        // Step 2: Fetch full metadata for these IDs (Pinecone fetch max = 1000 IDs at once)
        const FETCH_CHUNK = 1000;
        let allRecords = {};
        for (let i = 0; i < vectorIds.length; i += FETCH_CHUNK) {
            const chunk = vectorIds.slice(i, i + FETCH_CHUNK);
            const fetchResult = await index.fetch(chunk);
            Object.assign(allRecords, fetchResult.records || {});
        }

        // Step 3: Extract metadata and apply client-side filters
        let influencers = Object.values(allRecords).map(record => ({
            id: record.id,
            ...(record.metadata || {}),
        }));

        // Apply optional filters
        if (niche) {
            const n = niche.toLowerCase();
            influencers = influencers.filter(inf =>
                (inf.niche || "").toLowerCase().includes(n) ||
                (inf.brand_fit || "").toLowerCase().includes(n)
            );
        }
        if (tier) {
            influencers = influencers.filter(inf =>
                (inf.follower_tier || "").toLowerCase() === tier.toLowerCase()
            );
        }
        if (location) {
            const l = location.toLowerCase();
            influencers = influencers.filter(inf =>
                (inf.location || "").toLowerCase().includes(l)
            );
        }
        if (gender) {
            const g = gender.toLowerCase();
            influencers = influencers.filter(inf =>
                (inf.gender || "").toLowerCase().includes(g)
            );
        }
        if (min_followers) {
            const minF = parseInt(min_followers, 10);
            influencers = influencers.filter(inf => (parseInt(inf.followers) || 0) >= minF);
        }
        if (max_followers) {
            const maxF = parseInt(max_followers, 10);
            influencers = influencers.filter(inf => (parseInt(inf.followers) || 0) <= maxF);
        }

        // Step 4: Format (same as search API)
        const formatted = influencers.map((inf, idx) => ({
            id:              inf.id || String(idx + 1),
            name:            inf.name || "Unknown",
            handle:          inf.instagram ? `@${inf.instagram.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, "").replace(/\/$/, "").replace("@", "")}` : null,
            instagram_url:   inf.instagram || null,
            youtube_url:     inf.youtube || null,
            location:        inf.location || null,
            gender:          inf.gender || null,
            type:            inf.type || null,
            niche:           inf.niche || null,
            brand_fit:       inf.brand_fit || null,
            vibe:            inf.vibe || null,
            followers:       parseInt(inf.followers) || 0,
            follower_tier:   inf.follower_tier || null,
            avg_views:       parseInt(inf.avg_views) || 0,
            engagement_rate: parseFloat(inf.engagement_rate) || 0,
            mf_split:        inf.mf_split || null,
            age_concentration: inf.age_concentration || null,
            commercials:     inf.commercials || null,
            contact: {
                phone: inf.contact_no || null,
                email: inf.email || null,
            },
        }));

        const nextCursor = listResult.pagination?.next || null;
        console.log(`✅ Browse: returned ${formatted.length} influencers, next_cursor=${nextCursor ? "exists" : "end"}`);

        return res.json({
            influencers: formatted,
            next_cursor: nextCursor,
            has_more:    !!nextCursor,
            returned:    formatted.length,
        });

    } catch (err) {
        console.error("Browse API error:", err);
        return res.status(500).json({ detail: `Browse failed: ${err.message}` });
    }
});

export default router;