/**
 * Report Generation API
 * 
 * POST /api/v1/campaigns/:id/report
 * Generates a complete enterprise-grade intelligence report.
 */

import { Router } from "express";
import { db, firebaseAdmin } from "../core/config.js";
import { authenticate } from "../core/auth.js";
import {
    getTierDistribution,
    allocateBudget,
    forecastKPIs,
    assessRisks,
    generateStrategy,
} from "../services/campaignStrategy.js";

const router = Router();

// ─── POST /campaigns/:id/report ──────────────────────────────────────────────
router.post("/:id/report", authenticate, async (req, res) => {
    const startTime = Date.now();

    try {
        const { id } = req.params;
        const user = req.user;

        // 1. Fetch campaign data
        const docRef = db.collection("user_campaigns").doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ detail: "Campaign not found" });
        }

        const data = docSnap.data();
        if (data.userId !== user.uid) {
            return res.status(403).json({ detail: "Not authorized" });
        }

        const analysis = data.analysisResult || {};
        const suggestions = data.suggestions || [];
        const preferences = data.preferences || {};
        const shortlist = data.shortlist || [];

        if (!analysis.brand_name) {
            return res.status(400).json({ detail: "Campaign has no brand analysis. Run analysis first." });
        }

        console.log(`📊 Generating report for campaign ${id} | Brand: ${analysis.brand_name}`);

        // 2. Tier distribution
        const tierDistribution = getTierDistribution(suggestions);

        // 3. Budget allocation
        const budget = allocateBudget(preferences.budgetRange, tierDistribution);

        // 4. KPI forecasting
        const kpis = forecastKPIs(suggestions, budget.total_budget);

        // 5. Risk assessment
        const risks = assessRisks(analysis, suggestions);

        // 6. AI-generated campaign strategy
        const strategy = await generateStrategy(analysis, suggestions, preferences);

        // 7. Build influencer leaderboard
        const leaderboard = suggestions
            .sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0))
            .slice(0, 15)
            .map((s, i) => ({
                rank: i + 1,
                name: s.name || "Unknown",
                handle: s.handle || "",
                followers: s.followers || 0,
                engagement_rate: s.engagement_rate || 0,
                match_score: s.match?.score || 0,
                tier: s.match?.tier || "C",
                niche: s.niche || null,
                location: s.location || null,
                is_shortlisted: shortlist.includes(s.id),
                score_breakdown: s.score_breakdown || {},
            }));

        // 8. Build executive summary
        const topTierCount = leaderboard.filter(l => l.tier === "A").length;
        const avgScore = leaderboard.length > 0
            ? Math.round(leaderboard.reduce((s, l) => s + l.match_score, 0) / leaderboard.length)
            : 0;

        const executiveSummary = {
            brand: analysis.brand_name,
            industry: analysis.industry,
            campaign_goal: analysis.marketing_goal || preferences.primaryGoal || "Brand Awareness",
            total_influencers_analyzed: suggestions.length,
            top_tier_matches: topTierCount,
            average_match_score: avgScore,
            shortlisted: shortlist.length,
            estimated_reach: kpis.reach.estimated,
            estimated_budget: `₹${(budget.total_budget / 100000).toFixed(1)}L`,
            confidence_overall: analysis.confidence_scores?.overall || 50,
            ai_strategy_summary: strategy.executive_summary || "",
        };

        // 9. Brand insights section
        const brandInsights = {
            positioning: analysis.brand_positioning || {},
            audience: analysis.target_audience || {},
            competitors: analysis.competitor_landscape || [],
            pricing: analysis.pricing || {},
            communication: analysis.communication || {},
            confidence_scores: analysis.confidence_scores || {},
            data_quality: analysis.data_quality || {},
        };

        // 10. Assemble report
        const report = {
            report_id: `RPT-${id.slice(0, 8).toUpperCase()}`,
            generated_at: new Date().toISOString(),
            version: "3.0",
            sections: {
                executive_summary: executiveSummary,
                brand_insights: brandInsights,
                influencer_leaderboard: {
                    total: leaderboard.length,
                    tier_distribution: {
                        A: leaderboard.filter(l => l.tier === "A").length,
                        B: leaderboard.filter(l => l.tier === "B").length,
                        C: leaderboard.filter(l => l.tier === "C").length,
                    },
                    entries: leaderboard,
                },
                campaign_strategy: strategy,
                budget_allocation: budget,
                financial_projections: kpis,
                risk_assessment: {
                    total_risks: risks.length,
                    high_severity: risks.filter(r => r.severity === "high").length,
                    risks,
                },
                performance_benchmarks: strategy.performance_benchmarks || {},
            },
            meta: {
                processing_time_ms: Date.now() - startTime,
                data_sources: analysis.data_quality?.sources_analyzed || 0,
                confidence_level: analysis.confidence_scores?.overall >= 70 ? "high"
                    : analysis.confidence_scores?.overall >= 40 ? "medium" : "low",
            },
        };

        // 11. Save report to campaign
        await docRef.update({
            report,
            reportGeneratedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ Report ${report.report_id} generated in ${Date.now() - startTime}ms`);

        return res.json(report);

    } catch (err) {
        console.error("❌ Report generation error:", err);
        console.error("Stack:", err.stack);
        if (err.response) {
            console.error("API Response Error:", await err.response.text().catch(() => "No body"));
        }
        return res.status(500).json({ detail: `Failed to generate report: ${err.message}` });
    }
});

export default router;
