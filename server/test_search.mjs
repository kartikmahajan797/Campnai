import dotenv from "dotenv";
dotenv.config({ path: "C:\\Users\\G3\\OneDrive\\Desktop\\Campnai\\server\\.env" });

import { searchInfluencers } from "./src/services/influencerSearch.js";

async function test() {
    console.log("\n===== TEST 1: Fashion influencer Mumbai budget 50000 =====");
    const r1 = await searchInfluencers("fashion influencer in mumbai", 10, "budget 50000");
    console.log(`Results: ${r1.length}`);
    r1.forEach((inf, i) => {
        console.log(`\n[${i+1}] ${inf.name} | ${inf.location} | ${inf.niche} | ${inf.follower_tier} | followers: ${inf.followers} | commercials: ${inf.commercials} | instagram: ${inf.instagram}`);
    });

    console.log("\n===== TEST 2: Skincare micro influencer =====");
    const r2 = await searchInfluencers("skincare influencer", 5, "micro influencer");
    console.log(`Results: ${r2.length}`);
    r2.forEach((inf, i) => {
        console.log(`[${i+1}] ${inf.name} | ${inf.niche} | ${inf.follower_tier} | mf_split: ${inf.mf_split} | india_split: ${inf.india_split}`);
    });

    console.log("\n===== TEST 3: All fields present check =====");
    const r3 = await searchInfluencers("fitness influencer", 3, "");
    r3.forEach((inf, i) => {
        const fields = ['name','location','niche','followers','commercials','mf_split','india_split','age_concentration','follower_tier','brand_fit','instagram','text'];
        const missing = fields.filter(f => !inf[f] && inf[f] !== 0);
        console.log(`[${i+1}] ${inf.name} — missing fields: ${missing.length > 0 ? missing.join(', ') : 'NONE ✅'}`);
    });
}

test().catch(console.error);
