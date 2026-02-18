/**
 * Campaign Strategy & Forecasting Service
 * 
 * Generates enterprise-grade campaign strategy frameworks using Gemini AI.
 * Produces: channel strategy, influencer tiering, budget allocation,
 * risk analysis, KPI forecasting, and scaling roadmap.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Influencer Tier Classification ──────────────────────────────────────────
export function classifyInfluencerTier(followers) {
    const f = parseInt(followers) || 0;
    if (f >= 1_000_000) return "celebrity";
    if (f >= 100_000)   return "macro";
    if (f >= 10_000)    return "micro";
    return "nano";
}

export function getTierDistribution(suggestions) {
    const tiers = { nano: [], micro: [], macro: [], celebrity: [] };
    for (const s of suggestions) {
        const tier = classifyInfluencerTier(s.followers);
        tiers[tier].push(s);
    }
    return tiers;
}

// ─── Budget Allocation Model ─────────────────────────────────────────────────
export function allocateBudget(budgetRange, tierDistribution) {
    // Parse budget range text to numeric range
    const budgetMap = {
        "Under ₹1 Lakh":   { min: 30000, max: 100000 },
        "₹1-5 Lakh":       { min: 100000, max: 500000 },
        "₹5-10 Lakh":      { min: 500000, max: 1000000 },
        "₹10 Lakh+":       { min: 1000000, max: 3000000 },
    };

    const budget = budgetMap[budgetRange] || { min: 100000, max: 500000 };
    const mid = Math.round((budget.min + budget.max) / 2);

    // Allocation strategy based on available tiers
    const hasCeleb = tierDistribution.celebrity.length > 0;
    const hasMacro = tierDistribution.macro.length > 0;
    const hasMicro = tierDistribution.micro.length > 0;
    const hasNano  = tierDistribution.nano.length > 0;

    const allocation = {};
    if (hasCeleb) {
        allocation.celebrity    = { pct: 40, amount: Math.round(mid * 0.40) };
        allocation.macro        = { pct: 25, amount: Math.round(mid * 0.25) };
        allocation.micro        = { pct: 20, amount: Math.round(mid * 0.20) };
        allocation.nano         = { pct: 10, amount: Math.round(mid * 0.10) };
        allocation.contingency  = { pct: 5,  amount: Math.round(mid * 0.05) };
    } else if (hasMacro) {
        allocation.macro        = { pct: 35, amount: Math.round(mid * 0.35) };
        allocation.micro        = { pct: 35, amount: Math.round(mid * 0.35) };
        allocation.nano         = { pct: 20, amount: Math.round(mid * 0.20) };
        allocation.contingency  = { pct: 10, amount: Math.round(mid * 0.10) };
    } else {
        allocation.micro        = { pct: 45, amount: Math.round(mid * 0.45) };
        allocation.nano         = { pct: 40, amount: Math.round(mid * 0.40) };
        allocation.contingency  = { pct: 15, amount: Math.round(mid * 0.15) };
    }

    return {
        total_budget: mid,
        currency: "INR",
        allocation,
        cost_per_tier: {
            nano:      "₹2,000 – ₹15,000 per post",
            micro:     "₹15,000 – ₹75,000 per post",
            macro:     "₹75,000 – ₹3,00,000 per post",
            celebrity: "₹3,00,000 – ₹15,00,000+ per post",
        },
    };
}

// ─── KPI & ROI Forecasting ───────────────────────────────────────────────────
export function forecastKPIs(suggestions, budget) {
    const totalFollowers = suggestions.reduce((sum, s) => sum + (parseInt(s.followers) || 0), 0);
    const avgER = suggestions.reduce((sum, s) => sum + (parseFloat(s.engagement_rate) || 2), 0) / (suggestions.length || 1);
    const avgViews = suggestions.reduce((sum, s) => sum + (parseInt(s.avg_views) || 0), 0) / (suggestions.length || 1);

    const estimatedReach = Math.round(totalFollowers * 0.25); // ~25% organic reach
    const estimatedImpressions = Math.round(estimatedReach * 2.5); // avg 2.5 impressions per reach
    const estimatedEngagements = Math.round(estimatedReach * (avgER / 100));
    const estimatedClicks = Math.round(estimatedEngagements * 0.15); // ~15% engagement-to-click
    const estimatedConversions = Math.round(estimatedClicks * 0.03); // ~3% conversion rate

    const cpm = budget > 0 ? Math.round((budget / estimatedImpressions) * 1000) : 0;
    const cpe = budget > 0 && estimatedEngagements > 0 ? Math.round(budget / estimatedEngagements) : 0;
    const cpc = budget > 0 && estimatedClicks > 0 ? Math.round(budget / estimatedClicks) : 0;

    return {
        reach: {
            estimated: estimatedReach,
            impressions: estimatedImpressions,
            confidence: "medium",
        },
        engagement: {
            estimated_engagements: estimatedEngagements,
            avg_engagement_rate: Math.round(avgER * 100) / 100,
            estimated_clicks: estimatedClicks,
        },
        conversions: {
            estimated: estimatedConversions,
            conversion_rate: "3% (industry avg)",
        },
        cost_metrics: {
            cpm: `₹${cpm}`,
            cpe: `₹${cpe}`,
            cpc: `₹${cpc}`,
        },
        roi_estimate: {
            expected_roi: `${Math.round((estimatedConversions * 500) / (budget || 1) * 100)}%`,
            payback_period: "30-60 days",
            confidence: "medium [INFERRED]",
        },
    };
}

// ─── Risk & Compliance Analysis ──────────────────────────────────────────────
export function assessRisks(analysis, suggestions) {
    const risks = [];

    // Brand safety
    const lowERCount = suggestions.filter(s => (parseFloat(s.engagement_rate) || 0) < 1).length;
    if (lowERCount > suggestions.length * 0.3) {
        risks.push({
            category: "Engagement Quality",
            severity: "high",
            description: `${lowERCount} of ${suggestions.length} influencers have engagement rates below 1% — potential fake followers.`,
            mitigation: "Request audience audit reports before finalizing contracts.",
        });
    }

    // Budget risk
    const tierDist = getTierDistribution(suggestions);
    if (tierDist.celebrity.length > 0 && analysis?.pricing?.segment === "budget") {
        risks.push({
            category: "Budget Mismatch",
            severity: "high",
            description: "Celebrity influencers selected for a budget-tier brand. ROI may be negative.",
            mitigation: "Consider replacing celebrity tier with multiple micro-influencers.",
        });
    }

    // Platform concentration
    const platforms = new Set(suggestions.map(s => s.niche).filter(Boolean));
    if (platforms.size <= 1 && suggestions.length > 5) {
        risks.push({
            category: "Niche Concentration",
            severity: "medium",
            description: "All influencers are in the same niche. Limited audience diversity.",
            mitigation: "Add 2-3 adjacent niche influencers for broader reach.",
        });
    }

    // Compliance
    risks.push({
        category: "Regulatory Compliance",
        severity: "low",
        description: "All sponsored content must be clearly disclosed per ASCI guidelines.",
        mitigation: "Include #ad or #sponsored in all paid posts. Use platform-native paid partnership tags.",
    });

    // No contact data
    const noContact = suggestions.filter(s => !s.contact?.email && !s.contact?.phone).length;
    if (noContact > suggestions.length * 0.5) {
        risks.push({
            category: "Outreach Feasibility",
            severity: "medium",
            description: `${noContact} influencers lack contact information. Outreach may require DM-first approach.`,
            mitigation: "Prioritize influencers with available contact details for faster campaign launch.",
        });
    }

    return risks;
}

// ─── Full Strategy Generation via Gemini ─────────────────────────────────────
const STRATEGY_PROMPT = `You are an enterprise-grade Campaign Strategy AI. 
Given brand analysis data and influencer suggestions, generate a concise, actionable campaign strategy.

Output STRICT JSON only — no markdown, no explanations:
{
  "executive_summary": "3-4 sentence overview of the recommended campaign approach",
  "channel_strategy": [
    { "platform": "", "priority": "primary|secondary", "content_types": [], "posting_frequency": "", "rationale": "" }
  ],
  "content_strategy": {
    "themes": [],
    "key_messages": [],
    "call_to_action": "",
    "content_calendar_weeks": 4
  },
  "scaling_roadmap": {
    "phase_1": { "weeks": "1-2", "focus": "", "kpi": "" },
    "phase_2": { "weeks": "3-4", "focus": "", "kpi": "" },
    "phase_3": { "weeks": "5-8", "focus": "", "kpi": "" }
  },
  "performance_benchmarks": {
    "engagement_rate_target": "",
    "reach_target": "",
    "conversion_target": "",
    "brand_lift_target": ""
  }
}`;

export async function generateStrategy(analysis, suggestions, preferences) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const context = `
BRAND: ${analysis.brand_name} | Industry: ${analysis.industry}
POSITIONING: ${JSON.stringify(analysis.brand_positioning || {})}
AUDIENCE: ${JSON.stringify(analysis.target_audience?.primary_segment || {})}
GOAL: ${analysis.marketing_goal || preferences?.primaryGoal || "awareness"}
BUDGET: ${preferences?.budgetRange || "₹1-5 Lakh"}
TIMELINE: ${preferences?.timeline || "30 Days"}
TONE: ${analysis.brand_tone || "professional"}
PLATFORMS: ${(analysis.best_platforms || []).join(", ")}
TOP INFLUENCERS: ${suggestions.slice(0, 5).map(s => `${s.name} (${s.followers} followers, ${s.engagement_rate}% ER, ${s.niche})`).join("; ")}
TOTAL INFLUENCERS: ${suggestions.length}
`;

        const result = await model.generateContent([
            { text: STRATEGY_PROMPT },
            { text: context },
        ]);

        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (err) {
        console.error("Strategy generation error:", err.message);
        // Return a safe fallback
        return {
            executive_summary: `Campaign strategy for ${analysis.brand_name} targeting ${analysis.industry} audiences via influencer marketing.`,
            channel_strategy: [
                { platform: "Instagram", priority: "primary", content_types: ["Reels", "Stories"], posting_frequency: "3-4x/week", rationale: "Highest engagement for visual content" }
            ],
            content_strategy: {
                themes: [analysis.industry, "lifestyle"],
                key_messages: [analysis.brand_positioning?.usp || "Brand awareness"],
                call_to_action: "Visit website / Shop now",
                content_calendar_weeks: 4,
            },
            scaling_roadmap: {
                phase_1: { weeks: "1-2", focus: "Seeding & awareness", kpi: "Reach & impressions" },
                phase_2: { weeks: "3-4", focus: "Engagement & community", kpi: "ER & saves" },
                phase_3: { weeks: "5-8", focus: "Conversion & scaling", kpi: "Clicks & sales" },
            },
            performance_benchmarks: {
                engagement_rate_target: "3-5%",
                reach_target: "100K+",
                conversion_target: "2-3%",
                brand_lift_target: "5-10%",
            },
        };
    }
}
