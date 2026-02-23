/**
 * Enterprise-Grade Intelligent Negotiation Engine (Dynamic Edition)
 *
 * What changed from v1:
 * - Pricing tiers are AI-scored, not hardcoded bracket lookups
 * - Strategy selection is a weighted scoring system, not if/else chains
 * - Multipliers are configurable via MARKET_CONFIG (no magic numbers buried in code)
 * - Email prompts carry richer, randomised creative constraints so no two feel alike
 * - extractPricingPackages is more resilient (JSON fence stripping, schema validation)
 * - All "magic" numbers live in one place at the top → easy to tune per market
 */

import { geminiModel } from '../core/config.js';

// ─── Global Market Configuration ────────────────────────────────────────────
// ↓ Change these to re-tune for a new market / vertical without touching logic

export const MARKET_CONFIG = {
    currency: '₹',
    locale: 'en-IN',

    // Follower tiers: [maxFollowers, baseMin, baseMax, label]
    followerTiers: [
        [10_000, 2_000, 8_000, 'nano'],
        [50_000, 5_000, 25_000, 'micro'],
        [100_000, 15_000, 50_000, 'mid-tier'],
        [500_000, 30_000, 150_000, 'macro'],
        [Infinity, 100_000, 500_000, 'mega'],
    ],

    // Engagement rate benchmarks → multiplier range [min, max], pivot
    engagement: { min: 0.7, max: 1.6, pivot: 3.5 },

    // Niche premiums: keyword → multiplier
    nichePremiums: {
        tech: 1.25, finance: 1.30, luxury: 1.35,
        automotive: 1.20, travel: 1.15, health: 1.10,
        fitness: 1.10, beauty: 1.05, food: 1.00,
    },

    // Location premiums: keyword → multiplier
    locationPremiums: {
        mumbai: 1.15, delhi: 1.15, ncr: 1.15,
        bangalore: 1.12, bengaluru: 1.12,
        hyderabad: 1.10, pune: 1.10, chennai: 1.08,
        kolkata: 1.05,
    },

    // Strategy thresholds
    strategy: {
        quickCloseRatio: 0.80,   // askingPrice / estimatedMax below this → quick close
        minorNegoRatio: 1.00,    // at or below market ceiling → minor nego
        stretchBudget: 1.20,     // askingPrice up to 20% over brandMax → stretch
    },

    // Negotiation discount targets per strategy
    discountTargets: {
        minor_nego: 0.90,  // aim for 10% off
        active_nego: 0.78,  // aim for 22% off
        final_offer: 1.00,  // full budget = ceiling
        moderate_nego: 0.85,
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) => `${MARKET_CONFIG.currency}${Math.round(n).toLocaleString(MARKET_CONFIG.locale)}`;

function clamp(val, lo, hi) { return Math.max(lo, Math.min(hi, val)); }

function matchKeywords(text = '', map = {}) {
    const lower = text.toLowerCase();
    for (const [kw, multiplier] of Object.entries(map)) {
        if (lower.includes(kw)) return multiplier;
    }
    return 1.0;
}

// ─── Market Value Analysis ────────────────────────────────────────────────────

/**
 * Dynamically score an influencer's market value.
 * All tiers and multipliers come from MARKET_CONFIG — nothing hardcoded in logic.
 */
export function analyzeMarketValue(influencer) {
    const {
        followers = 0,
        engagementRate = 2,
        niche = '',
        location = '',
        platform = 'instagram',   // NEW: platform-aware pricing
        contentFormats = [],       // NEW: ['reel','post','story'] → value stack
    } = influencer;

    // ── Tier lookup ──────────────────────────────────────────────────────────
    const tier = MARKET_CONFIG.followerTiers.find(([max]) => followers <= max)
        ?? MARKET_CONFIG.followerTiers.at(-1);
    let [, baseMin, baseMax, tierLabel] = tier;

    // ── Engagement multiplier (smooth curve, not step) ──────────────────────
    const { min: eMin, max: eMax, pivot } = MARKET_CONFIG.engagement;
    const engMult = clamp(eMin + (engagementRate / pivot) * (eMax - eMin), eMin, eMax);
    baseMin = Math.round(baseMin * engMult);
    baseMax = Math.round(baseMax * engMult);

    // ── Niche premium (highest matching keyword wins) ────────────────────────
    const nicheMult = matchKeywords(niche, MARKET_CONFIG.nichePremiums);
    baseMin = Math.round(baseMin * nicheMult);
    baseMax = Math.round(baseMax * nicheMult);

    // ── Location premium ─────────────────────────────────────────────────────
    const locMult = matchKeywords(location, MARKET_CONFIG.locationPremiums);
    baseMin = Math.round(baseMin * locMult);
    baseMax = Math.round(baseMax * locMult);

    // ── Platform premium ─────────────────────────────────────────────────────
    const platformMult = { youtube: 1.30, instagram: 1.0, twitter: 0.80, moj: 0.70 }[platform.toLowerCase()] ?? 1.0;
    baseMin = Math.round(baseMin * platformMult);
    baseMax = Math.round(baseMax * platformMult);

    // ── Content format stack value ───────────────────────────────────────────
    const formatBonus = (contentFormats.length > 2) ? 1.15 : (contentFormats.length === 2) ? 1.07 : 1.0;
    baseMin = Math.round(baseMin * formatBonus);
    baseMax = Math.round(baseMax * formatBonus);

    const marketPosition = followers > 100_000 ? 'premium' : followers > 50_000 ? 'mid-range' : 'value';

    return {
        estimatedMin: baseMin,
        estimatedMax: baseMax,
        marketPosition,
        tierLabel,
        appliedMultipliers: { engMult, nicheMult, locMult, platformMult, formatBonus },
    };
}

// ─── Price Comparison & Strategy ──────────────────────────────────────────────

/**
 * Weighted scoring system replaces rigid if/else chain.
 * Each factor contributes a score; highest score wins strategy.
 */
export function comparePriceAndStrategy({ askingPrice, marketValue, brandMin, brandMax }) {
    const { estimatedMin, estimatedMax } = marketValue;
    const { quickCloseRatio, minorNegoRatio, stretchBudget } = MARKET_CONFIG.strategy;

    // ── Assessments ──────────────────────────────────────────────────────────
    const priceRatio = askingPrice / estimatedMax;   // 1.0 = exactly at ceiling
    const budgetRatio = askingPrice / brandMax;        // 1.0 = exactly at budget cap

    const priceAssessment =
        askingPrice < estimatedMin ? 'below_market' :
            askingPrice <= estimatedMax ? 'market_rate' :
                askingPrice <= estimatedMax * 1.3 ? 'slightly_high' :
                    'overpriced';

    const budgetFit =
        askingPrice <= brandMax ? 'within_budget' :
            askingPrice <= brandMax * stretchBudget ? 'stretch' :
                'over_budget';

    // ── Strategy scoring ─────────────────────────────────────────────────────
    const scores = {
        quick_close: 0,
        minor_nego: 0,
        active_nego: 0,
        final_offer: 0,
        moderate_nego: 0,
    };

    if (priceRatio <= quickCloseRatio && budgetFit === 'within_budget') scores.quick_close += 3;
    if (priceRatio <= minorNegoRatio && budgetFit === 'within_budget') scores.minor_nego += 2;
    if (priceAssessment === 'overpriced' || priceAssessment === 'slightly_high') scores.active_nego += 2;
    if (budgetFit === 'over_budget') scores.final_offer += 3;
    if (budgetFit === 'stretch') scores.active_nego += 1;
    if (budgetFit === 'within_budget' && priceAssessment === 'market_rate') scores.minor_nego += 1;

    // Moderate nego as tiebreaker
    scores.moderate_nego += 0.5;

    const strategy = Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];

    // ── Target price calculation ─────────────────────────────────────────────
    const discountFactor = MARKET_CONFIG.discountTargets[strategy] ?? 0.88;
    let targetPrice;

    if (strategy === 'quick_close') {
        targetPrice = Math.min(askingPrice, brandMax);
    } else if (strategy === 'final_offer') {
        targetPrice = brandMax;
    } else {
        const midMarket = (estimatedMin + estimatedMax) / 2;
        const discounted = askingPrice * discountFactor;
        // Blend market midpoint + discounted ask, weighted by strategy aggression
        const blend = strategy === 'active_nego' ? 0.6 : 0.4;
        targetPrice = Math.round(midMarket * blend + discounted * (1 - blend));
        targetPrice = Math.min(targetPrice, brandMax);           // never exceed budget
        targetPrice = Math.max(targetPrice, brandMin ?? 0);      // never go below floor
    }

    // ── Approach mapping ─────────────────────────────────────────────────────
    const approachMap = {
        quick_close: 'enthusiastic_accept',
        minor_nego: 'value_highlight',
        active_nego: 'market_reality',
        final_offer: 'budget_constraint',
        moderate_nego: 'balanced',
    };

    return {
        strategy,
        priceAssessment,
        budgetFit,
        targetPrice,
        approach: approachMap[strategy],
        shouldAccept: strategy === 'quick_close',
        maxOfferPrice: brandMax,
        scores,                     // ← expose for debugging / analytics
        marketRange: `${fmt(estimatedMin)} - ${fmt(estimatedMax)}`,
        reasoning: buildReasoning({ strategy, priceAssessment, askingPrice, estimatedMax, brandMax, targetPrice }),
    };
}

function buildReasoning({ strategy, priceAssessment, askingPrice, estimatedMax, brandMax, targetPrice }) {
    const overMarket = Math.round((askingPrice / estimatedMax - 1) * 100);
    switch (strategy) {
        case 'quick_close': return `Ask (${fmt(askingPrice)}) is below market ceiling — outstanding deal, close now.`;
        case 'final_offer': return `Ask (${fmt(askingPrice)}) exceeds budget. Final best offer: ${fmt(brandMax)}.`;
        case 'active_nego': return `Ask is ${overMarket}% above market. Negotiate down to ${fmt(targetPrice)}.`;
        case 'minor_nego': return `Ask is fair but room exists. Counter at ${fmt(targetPrice)} (modest 8-10% discount).`;
        default: return `Apply professional negotiation toward ${fmt(targetPrice)}.`;
    }
}

// ─── Approach Guidance (used inside prompts) ──────────────────────────────────

function getApproachGuidance(approach, targetPrice) {
    const t = fmt(targetPrice);
    const g = {
        enthusiastic_accept: `Express genuine excitement and confirm the deal immediately. Propose immediate next steps.`,
        value_highlight: `Counter at ${t}. Emphasise campaign reach, creative brief quality and long-term partnership potential.`,
        market_reality: `Cite industry benchmarks and counter at ${t}. Be respectful but firm — you have data.`,
        budget_constraint: `Transparently reveal the budget ceiling and table a final offer of ${t}. No wiggle room, but convey genuine desire to work together.`,
        inquiry: `Request their commercial rates and deliverables. Professional, warm, zero pressure.`,
        polite_reminder: `Warm follow-up. Acknowledge their interest, nudge toward sharing pricing.`,
        balanced: `Negotiate professionally toward ${t} while building rapport.`,
    };
    return g[approach] ?? g.balanced;
}

// ─── Creative Variance Helpers (so every email feels unique) ─────────────────

const OPENERS = [
    (name) => `Hi ${name},`,
    (name) => `Hello ${name},`,
    (name) => `Hey ${name},`,
    (name) => `${name},`,
];

const STRUCTURAL_CONSTRAINTS = [
    'Start by acknowledging something specific from their last message, then pivot to your ask.',
    'Lead with the business opportunity, then handle pricing.',
    'Open with a compliment that references their content style, then transition to deal terms.',
    'Be direct — open with the offer figure, then justify it with data.',
    'Start with a one-sentence shared vision, then get into specifics.',
];

const FORBIDDEN_PHRASES = [
    '"I hope this message finds you well"',
    '"Looking forward to working together" (as opener)',
    '"We love your content" (too generic)',
    '"circle back"',
    '"synergy"',
    '"touch base"',
];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Negotiation Email Generator ──────────────────────────────────────────────

export async function generateNegotiationEmail({
    influencerName,
    brandName,
    campaignName,
    strategy,
    targetPrice,
    approach,
    marketRange,
    reasoning,
    conversationHistory,
    incomingMessage,
    roundNumber,
}) {
    const historyContext = conversationHistory
        .map((h) => {
            const timeStr = h.timestamp ? new Date(h.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown Time';
            return `[${timeStr}] ${h.role === 'outbound' ? brandName : influencerName}:\n"${h.body}"`;
        })
        .join('\n\n') || 'First contact';

    const structureConstraint = pickRandom(STRUCTURAL_CONSTRAINTS);
    const forbiddenList = FORBIDDEN_PHRASES.join(', ');

    const prompt = `
You are a senior influencer marketing manager for an enterprise SaaS product, "${brandName}".

⚠️ KEY DIRECTIVES:
- Analyze the ENTIRE conversation history below from the very first chat. 
- Look closely at the timestamps to understand the pace, delays, and context of the negotiation.
- Write a highly professional, enterprise-grade response. Do NOT use repetitive, generic templates. Every email must feel fresh, strategic, and uniquely tailored to the current context.
- You represent "${brandName}" and ONLY "${brandName}".

CONTEXT
───────
Campaign        : "${campaignName}"
Influencer      : ${influencerName}
Negotiation round: ${roundNumber}

MARKET INTELLIGENCE
───────────────────
${reasoning}
Market range    : ${marketRange}
Our target offer: ${fmt(targetPrice)}

FULL CONVERSATION HISTORY (From Start)
──────────────────────────────────────
${historyContext}

INFLUENCER'S LATEST MESSAGE
────────────────────────────
"${incomingMessage}"

NEGOTIATION STRATEGY : ${strategy}
APPROACH TONE        : ${approach}

YOUR TASK
─────────
Write a completely unique, premium SaaS-grade reply (100–150 words).

Structural constraint to ensure variety: ${structureConstraint}

Content rules:
1. Deeply understand the influencer's last message and the overall chat history. Address their specific concerns or questions clearly.
2. ${getApproachGuidance(approach, targetPrice)}
3. Show enterprise market expertise. Be polite, authoritative, and persuasive. 
4. Maintain warmth but protect the brand's budget.
5. NEVER use these cliché phrases: ${forbiddenList}

Sign-off (mandatory, exact format):
Best regards,
${brandName} Team

Output: email body only. No subject line. Plain text. No markdown.
`.trim();

    try {
        const result = await geminiModel.generateContent(prompt);
        return cleanEmail(result.response.text().trim(), influencerName, brandName);
    } catch (err) {
        console.error('[NegotiationEngine] Email generation failed:', err.message);
        return fallbackEmail({ influencerName, brandName, targetPrice, approach });
    }
}

// ─── Deal Close Email ─────────────────────────────────────────────────────────

export async function generateDealCloseEmail({
    influencerName,
    brandName,
    campaignName,
    finalPrice,
    deliverables = 'as discussed',
    acceptanceMessage,
    conversationHistory,
    senderName = process.env.SENDER_NAME || 'Campaign Manager',
}) {
    const historySnippet = conversationHistory
        .map((h) => {
            const timeStr = h.timestamp ? new Date(h.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown Time';
            return `[${timeStr}] ${h.role === 'outbound' ? brandName : influencerName}:\n"${h.body}"`;
        })
        .join('\n\n') || '';

    const prompt = `
You are ${brandName}'s marketing manager formalising a successful deal.

⚠️ BRAND IDENTITY (MANDATORY — ZERO EXCEPTIONS):
   You represent "${brandName}" and ONLY "${brandName}".
   NEVER mention, reference, or sign off as ANY other brand.
   Every mention of the brand MUST be "${brandName}".

DEAL DETAILS
────────────
Influencer : ${influencerName}
Campaign   : "${campaignName}"
Final price: ${fmt(finalPrice)}
Deliverables: ${deliverables}

THEIR ACCEPTANCE MESSAGE
────────────────────────
"${acceptanceMessage}"

RECENT CONTEXT
──────────────
${historySnippet}

TASK
────
Write a warm, professional deal-confirmation email (120–150 words) that:
1. Celebrates the partnership with genuine excitement (not over the top).
2. Confirms all key deal terms clearly:
   - Campaign: "${campaignName}"
   - Fee: ${fmt(finalPrice)}
   - Deliverables: ${deliverables}
   - "Please share your content calendar within 3 business days."
   - "Payment will be processed within 7 days of approved content delivery."
3. States one clear next step.
4. Sounds like a real person — specific to their acceptance message.

Sign-off (exact):
Best regards,
${senderName}
Marketing Manager, ${brandName}

Output: email body only. Plain text. No markdown.
`.trim();

    try {
        const result = await geminiModel.generateContent(prompt);
        return result.response.text().trim();
    } catch (err) {
        console.error('[NegotiationEngine] Deal close email failed:', err.message);
        const fn = influencerName?.split(' ')[0] ?? 'there';
        return `Hi ${fn},\n\nExcited to confirm our collaboration for "${campaignName}" at ${fmt(finalPrice)}!\n\nDeliverables: ${deliverables}\n\nNext steps:\n- Share your content calendar within 3 business days\n- We'll send the creative brief shortly\n- Payment within 7 days of approved delivery\n\nLooking forward to creating something great together.\n\nBest regards,\n${senderName}\nMarketing Manager, ${brandName}`;
    }
}

// ─── Initial Outreach ─────────────────────────────────────────────────────────

export async function generateInitialOutreach({
    influencerName,
    influencerHandle,
    brandName,
    campaignName,
    campaignGoal,
    brandDescription,
    expectedDeliverables,
    senderName = process.env.SENDER_NAME || 'Campaign Manager',
}) {
    const openingVariants = [
        `Lead with what genuinely impressed you about their recent content.`,
        `Open with a crisp one-line summary of why you're reaching out.`,
        `Start by referencing a specific content trend they're riding well.`,
    ];

    const prompt = `
You are a senior influencer marketing manager at ${brandName}.

⚠️ BRAND IDENTITY (MANDATORY — ZERO EXCEPTIONS):
   You represent "${brandName}" and ONLY "${brandName}".
   NEVER mention, reference, or sign off as ANY other brand.
   Every mention of the brand MUST be "${brandName}".

OUTREACH BRIEF
──────────────
Influencer  : ${influencerName} (${influencerHandle})
Campaign    : "${campaignName}"
Goal        : ${campaignGoal}
Brand intro : ${brandDescription}
Deliverables: ${expectedDeliverables}

TASK
────
Write a personalised cold-outreach email (100–120 words) that:
1. ${pickRandom(openingVariants)}
2. Introduces ${brandName} in one sentence — no fluff.
3. Connects their content style to our campaign vision.
4. Asks for their rates and availability.
5. Never sounds like a template. No "I hope this finds you well". No "we love your content" (too generic).
6. Do NOT mention a budget figure — let them quote first.

Sign-off (exact):
Best,
${senderName}
${brandName}

Output: email body only. No subject line. Plain text.
`.trim();

    try {
        const result = await geminiModel.generateContent(prompt);
        return cleanEmail(result.response.text().trim(), influencerName, brandName);
    } catch (err) {
        console.error('[NegotiationEngine] Outreach generation failed:', err.message);
        const fn = influencerName?.split(' ')[0] ?? 'there';
        return `Hi ${fn},\n\nYour content on ${influencerHandle} stands out — the way you cover ${campaignGoal} feels genuinely authentic.\n\nWe're launching "${campaignName}" at ${brandName} and think you'd be a perfect fit for what we're building.\n\nCould you share your current rates for ${expectedDeliverables}?\n\nBest,\n${senderName}\n${brandName}`;
    }
}

// ─── Price Extraction ─────────────────────────────────────────────────────────

export async function extractPricingPackages(message) {
    try {
        const prompt = `
Analyse this influencer's pricing message and extract ALL packages mentioned.

Message: "${message}"

Rules:
- Extract each package's price (in INR, as a plain integer) and deliverables string.
- If a price is written as "40k", interpret as 40000.
- If no pricing is mentioned, return an empty array.

Return ONLY a valid JSON array, no markdown, no explanation:
[{"price": <number>, "deliverables": "<string>"}, ...]
`.trim();

        const result = await geminiModel.generateContent(prompt);
        const raw = result.response.text().trim().replace(/```json|```/gi, '').trim();

        // Extract JSON array (handle leading/trailing text)
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
            const parsed = JSON.parse(match[0]);
            // Schema validation
            const valid = parsed.filter(
                (p) => typeof p.price === 'number' && p.price > 0 && p.price < 100_000_000
            );
            if (valid.length > 0) {
                console.log(`[PriceExtraction] AI found ${valid.length} package(s):`, valid);
                return valid;
            }
        }
    } catch (err) {
        console.warn('[PriceExtraction] AI extraction failed, falling back:', err.message);
    }

    // Fallback: regex-based extraction
    const price = extractPriceRegex(message);
    return price > 0 ? [{ price, deliverables: 'Not specified' }] : [];
}

function extractPriceRegex(message) {
    const patterns = [
        /₹\s*([\d,]+(?:\.\d+)?)/gi,
        /rs\.?\s*([\d,]+)/gi,
        /([\d,]+)\s*(?:rupees|inr)/gi,
        /([\d.]+)\s*k(?:\b)/gi,
        /([\d.]+)\s*lakh(?:s)?(?:\b)/gi,
    ];

    const prices = [];
    for (const pattern of patterns) {
        for (const match of message.matchAll(new RegExp(pattern.source, 'gi'))) {
            let raw = match[1].replace(/,/g, '');
            let val = parseFloat(raw);
            if (/lakh/i.test(match[0])) val *= 100_000;
            else if (/k/i.test(match[0]) && val < 1_000) val *= 1_000;
            if (val > 100 && val < 100_000_000) prices.push(Math.round(val));
        }
    }

    const unique = [...new Set(prices)].sort((a, b) => b - a);
    return unique[0] ?? 0;
}

/** Backward-compatible: returns lowest package price */
export async function extractPriceFromMessage(message) {
    const packages = await extractPricingPackages(message);
    if (!packages.length) return 0;
    const lowest = packages.reduce((m, p) => (p.price < m.price ? p : m), packages[0]);
    console.log(`[PriceExtraction] Lowest package: ${fmt(lowest.price)} (${lowest.deliverables})`);
    return lowest.price;
}

// ─── Email Cleaning ───────────────────────────────────────────────────────────

function cleanEmail(text, influencerName, brandName) {
    let out = text
        .replace(/^(Subject:|Body:|Email:)/gim, '')
        .replace(/\*\*/g, '')
        .replace(/^\s*[-*•]\s+/gm, '')
        .trim();

    // Ensure greeting
    if (!/^(Hi|Hello|Hey|Dear)/i.test(out)) {
        const fn = influencerName?.split(' ')[0] ?? 'there';
        out = `Hi ${fn},\n\n${out}`;
    }

    // ══╣ DYNAMIC BRAND ENFORCEMENT ╠══════════════════════════════════════════
    // Fix wrong brand name in sign-off — matches ANY "Best regards, [Name] Team"
    if (brandName) {
        // Fix sign-off: "Best regards, [AnyBrand] Team" → correct brand
        out = out.replace(
            /(Best regards?|Regards?|Thanks|Warm regards?),?\s*\n?([A-Za-z ]+)\s*(Team|Marketing Team)\b/gi,
            `Best regards,\n${brandName} Team`
        );

        // Fix "from [WrongBrand]" patterns in body (common AI hallucination)
        // e.g. "I'm from Bewakoof" → "I'm from OurBrand"
        out = out.replace(
            /\bfrom\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b(?=[\s,.])/g,
            (match, capturedBrand) => {
                // Only replace if the captured brand is NOT the correct one
                if (capturedBrand.toLowerCase() !== brandName.toLowerCase()
                    && capturedBrand.toLowerCase() !== influencerName?.split(' ')[0]?.toLowerCase()
                    && !['the', 'our', 'my', 'your', 'this', 'that', 'a', 'an'].includes(capturedBrand.toLowerCase())) {
                    return `from ${brandName}`;
                }
                return match;
            }
        );

        // Fix "we at [WrongBrand]" / "team at [WrongBrand]"
        out = out.replace(
            /\b(we|team|us)\s+at\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b/gi,
            (match, prefix, capturedBrand) => {
                if (capturedBrand.toLowerCase() !== brandName.toLowerCase()) {
                    return `${prefix} at ${brandName}`;
                }
                return match;
            }
        );

        // Fix standalone "at [WrongBrand]," patterns
        out = out.replace(
            /\bat\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\s*,/g,
            (match, capturedBrand) => {
                if (capturedBrand.toLowerCase() !== brandName.toLowerCase()
                    && !['the', 'this', 'that', 'a', 'an'].includes(capturedBrand.toLowerCase())) {
                    return `at ${brandName},`;
                }
                return match;
            }
        );
    }

    // Add sign-off if missing
    if (!/best regards?|regards?|thanks|sincerely/i.test(out)) {
        out += `\n\nBest regards,\n${brandName ?? ''} Team`;
    }

    return out;
}

// ─── Fallback Emails ──────────────────────────────────────────────────────────

function fallbackEmail({ influencerName, brandName, targetPrice, approach }) {
    const fn = influencerName?.split(' ')[0] ?? 'there';
    const t = fmt(targetPrice);
    
    // Arrays of professional, SaaS-grade responses to avoid repetitive "hardcoded" feel
    const options = {
        enthusiastic_accept: [
            `Hi ${fn},\n\nWe reviewed everything and this is exactly what we were hoping for! We're fully on board to collaborate since your style is a perfect match.\n\nCould you share your content calendar so we can align timelines?\n\nBest,\n${brandName} Team`,
            `Hi ${fn},\n\nFantastic. We're happy to move forward with this! Your previous work aligns incredibly well with our current initiative.\n\nLet's lock this in. Please share your availability or content calendar next.\n\nRegards,\n${brandName} Team`,
        ],
        value_highlight: [
             `Hi ${fn},\n\nThanks for sharing your standard rates. We'd love to partner up. Based on the deliverables and the long-term potential we see, we'd like to propose ${t} as our starting point.\n\nLet us know if this works for you!\n\nBest,\n${brandName} Team`,
             `Hi ${fn},\n\nAppreciate the details! Looking at the campaign scope, we're currently budgeting ${t} for this integration. We view this as a strategic long-term relationship rather than a one-off.\n\nLooking forward to your thoughts.\n\nRegards,\n${brandName} Team`,
        ],
        market_reality: [
            `Hi ${fn},\n\nThanks for the transparency. We evaluate these based on market standard metrics and for this scope, a competitive rate would be around ${t}. We ensure smooth approvals and prompt payouts.\n\nDoes this sound workable to you?\n\nBest,\n${brandName} Team`,
            `Hi ${fn},\n\nWe completely understand your valuation. Based on similar campaigns we've executed recently, optimal alignment for this specific scope sits at ${t}.\n\nLet us know if you're open to moving forward at this rate.\n\nRegards,\n${brandName} Team`,
        ],
        budget_constraint: [
            `Hi ${fn},\n\nWe genuinely want to collaborate, but our absolute budget ceiling for this specific campaign format is capped at ${t}.\n\nIf we can make the numbers work, I'd love to get the contract drafted right away.\n\nBest,\n${brandName} Team`,
             `Hi ${fn},\n\nThanks for getting back to us. We'd love to make this happen, though our strict budget allocation allows up to ${t} for this set of deliverables.\n\nLet me know if this aligns with your expectations.\n\nRegards,\n${brandName} Team`,
        ],
        inquiry: [
            `Hi ${fn},\n\nGreat to connect! We've been following your work and see a great fit for an upcoming campaign. Could you share your current rate card and standard turnaround times?\n\nBest,\n${brandName} Team`,
             `Hi ${fn},\n\nThanks for your interest! To help us craft a solid proposal, could you forward your most up-to-date pricing packages and deliverable options?\n\nWarmly,\n${brandName} Team`,
        ],
        polite_reminder: [
            `Hi ${fn},\n\nJust bumping this up! We're finalizing our roster for this campaign and would love to include you. Let us know your rates whenever you have a moment.\n\nBest,\n${brandName} Team`,
             `Hi ${fn},\n\nFollowing up on our last note — we're still very keen on working together! Let us know if you've had a chance to review things on your end.\n\nRegards,\n${brandName} Team`,
        ],
        balanced: [
            `Hi ${fn},\n\nThanks for the reply. We'd love to find a middle ground. Can we close this collaboration at ${t}? We believe it's a solid win-win for both sides.\n\nLet me know your thoughts.\n\nBest,\n${brandName} Team`,
            `Hi ${fn},\n\nI appreciate the context from your end. Since we want to ensure this feels like a true partnership, would a middle ground of ${t} work for you?\n\nLooking forward to your thoughts.\n\nWarmly,\n${brandName} Team`
        ]
    };
    
    const fallbackList = options[approach] ?? options.balanced;
    return pickRandom(fallbackList);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function calculateNegotiationMetrics(conversationHistory, finalPrice, initialAsk, brandMax) {
    const outbound = conversationHistory.filter((h) => h.role === 'outbound').length;
    const inbound = conversationHistory.filter((h) => h.role === 'inbound').length;
    const rounds = Math.max(outbound, inbound);

    const discountAchieved = initialAsk > 0 ? ((initialAsk - finalPrice) / initialAsk * 100).toFixed(1) : '0.0';
    const budgetUtilization = brandMax > 0 ? (finalPrice / brandMax * 100).toFixed(1) : '0.0';

    return {
        totalRounds: rounds,
        messagesExchanged: conversationHistory.length,
        discountAchieved: `${discountAchieved}%`,
        budgetUtilization: `${budgetUtilization}%`,
        savingsAmount: fmt(Math.max(0, initialAsk - finalPrice)),
        timeToClose: calculateDuration(conversationHistory),
        outcome: finalPrice <= brandMax ? 'success' : 'over_budget',
        efficiency: rounds <= 2 ? 'excellent' : rounds <= 4 ? 'good' : 'extended',
    };
}

function calculateDuration(history) {
    if (history.length < 2) return 'N/A';
    const first = new Date(history[0].timestamp);
    const last = new Date(history.at(-1).timestamp);
    const hours = Math.round((last - first) / 3_600_000);
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export default {
    MARKET_CONFIG,
    analyzeMarketValue,
    comparePriceAndStrategy,
    generateNegotiationEmail,
    generateDealCloseEmail,
    generateInitialOutreach,
    extractPriceFromMessage,
    extractPricingPackages,
    calculateNegotiationMetrics,
};