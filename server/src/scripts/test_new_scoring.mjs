/**
 * Test: New India-City Scoring Model + Commercial Estimation
 * Run: node server/src/scripts/test_new_scoring.mjs
 */

import { computeMatchScore, estimateCommercial } from '../services/influencerSearch.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TEST CASES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════');
console.log('  TEST: India-City Scoring Model + Commercial Estimation');
console.log('═══════════════════════════════════════════════════════════════\n');

// ─── Test 1: Client's exact example ───────────────────────────────────────────
console.log('📋 TEST 1: Client Example (Fashion, Female, Mumbai+Delhi)');
const score1 = computeMatchScore('fashion', ['Mumbai', 'Delhi'], 'Female', {
    niche: 'fashion',
    brand_fit: 'clothing,streetwear',
    location: 'Mumbai', // Using proxy since top_cities data is missing in DB
    mf_split: '30/70', // 70% female
    engagement_rate: 3.4,
});
console.log(`   Category: ${score1.breakdown.category.score}/${score1.breakdown.category.max} (expected: 40)`);
console.log(`   City:     ${score1.breakdown.city.score}/${score1.breakdown.city.max} (expected: 40 - Mumbai location)`);
console.log(`   Gender:   ${score1.breakdown.gender.score}/${score1.breakdown.gender.max} (expected: 7 ≈ 70%×10)`);
console.log(`   ER:       ${score1.breakdown.engagement.score}/${score1.breakdown.engagement.max} (expected: 10 for ER>3%)`);
console.log(`   TOTAL:    ${score1.total}/100 (expected: 97)`);
console.log(`   Tier:     ${score1.tier}`);
console.log(`   ${score1.total >= 75 ? '✅ PASS' : '❌ FAIL'}\n`);

// ─── Test 2: Category mismatch (hard filter) ─────────────────────────────────
console.log('📋 TEST 2: Category Mismatch (Brand=Fashion, Influencer=Tech)');
const score2 = computeMatchScore('fashion', ['Mumbai', 'Delhi'], 'Female', {
    niche: 'tech',
    brand_fit: 'gadgets,software',
    location: 'Mumbai',
    mf_split: '70/30',
    engagement_rate: 5.0,
});
console.log(`   Category: ${score2.breakdown.category.score}/${score2.breakdown.category.max} (expected: 0 — mismatch)`);
console.log(`   TOTAL:    ${score2.total}/100 (should be low)`);
console.log(`   ${score2.breakdown.category.score === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

// ─── Test 3: Zero city overlap (Proxy) ────────────────────────────────────────
console.log('📋 TEST 3: Zero City Overlap (Brand=Mumbai/Delhi, Inf=Chennai)');
const score3 = computeMatchScore('fashion', ['Mumbai', 'Delhi'], 'Female', {
    niche: 'fashion',
    location: 'Chennai',
    mf_split: '20/80',
    engagement_rate: 4.0,
});
console.log(`   City:     ${score3.breakdown.city.score}/${score3.breakdown.city.max} (expected: 0 — no overlap)`);
console.log(`   TOTAL:    ${score3.total}/100`);
console.log(`   ${score3.breakdown.city.score === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

// ─── Test 4: Brand Fit matching ───────────────────────────────────────────────
console.log('📋 TEST 4: Brand Fit Match (Brand=Fashion, Niche=Lifestyle, BrandFit=Fashion,Beauty)');
const score4 = computeMatchScore('fashion', ['Delhi'], 'Unisex', {
    niche: 'lifestyle',
    brand_fit: 'fashion,beauty,skincare',
    location: 'Delhi',
    engagement_rate: 2.5,
});
console.log(`   Category: ${score4.breakdown.category.score}/${score4.breakdown.category.max} (expected: 20 — matched via brand_fit)`);
console.log(`   ${score4.breakdown.category.score === 20 ? '✅ PASS' : '❌ FAIL'}\n`);

// ─── Test 5: Commercial Estimation ────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════');
console.log('📋 TEST 5: Commercial Estimation (PS×MBR×EQB×NDM×RA)');
console.log('═══════════════════════════════════════════════════════════════\n');

const tests = [
    { label: 'Nano Fashion (10K followers, 5K views, 4.5% ER)', input: { followers: 10000, avgViews: 5000, engagementRate: 4.5, niche: 'fashion' } },
    { label: 'Micro Beauty (50K followers, 15K views, 3.2% ER)', input: { followers: 50000, avgViews: 15000, engagementRate: 3.2, niche: 'beauty' } },
    { label: 'Mid Finance (200K followers, 40K views, 2.8% ER)', input: { followers: 200000, avgViews: 40000, engagementRate: 2.8, niche: 'finance' } },
    { label: 'Macro Tech (500K followers, 100K views, 3.5% ER)', input: { followers: 500000, avgViews: 100000, engagementRate: 3.5, niche: 'tech' } },
    { label: 'Mega Comedy (1M followers, 300K views, 6.0% ER)', input: { followers: 1000000, avgViews: 300000, engagementRate: 6.0, niche: 'comedy' } },
    { label: 'Inflated (500K followers, 20K views, 1.0% ER)', input: { followers: 500000, avgViews: 20000, engagementRate: 1.0, niche: 'lifestyle' } },
    { label: 'Luxury Macro (300K followers, 90K views, 5.2% ER)', input: { followers: 300000, avgViews: 90000, engagementRate: 5.2, niche: 'luxury' } },
];

for (const t of tests) {
    const result = estimateCommercial(t.input);
    const viewRatio = t.input.followers > 0 ? (t.input.avgViews / t.input.followers).toFixed(2) : '0';
    console.log(`   ${t.label}`);
    console.log(`     PS=${((t.input.avgViews * 0.75) + (t.input.followers * (t.input.engagementRate / 100) * 0.25)).toLocaleString('en-IN')}, VR=${viewRatio}`);
    console.log(`     💰 ${result.display}  (raw: ₹${result.raw.toLocaleString('en-IN')})`);
    console.log('');
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  All tests completed!');
console.log('═══════════════════════════════════════════════════════════════');
