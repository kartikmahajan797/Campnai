/**
 * Verify Pinecone has all correct fields after re-embed
 * Run: node src/scripts/verify_embed.mjs
 */
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX || "campnai-influencers");

// Step 1: Stats
const stats = await index.describeIndexStats();
const total = stats.totalRecordCount || 0;
console.log(`\n=== Pinecone Total Records: ${total} (Expected: 311)`);

if (total === 0) {
  console.log("❌ No records yet — embedding still running");
  process.exit(0);
}

// Step 2: Fetch first 5 IDs from JSON and check their metadata
const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../influencers_data.json"), "utf-8"));
const testIds = data.slice(0, 5).map(x => x.id);
const result = await index.fetch(testIds);
const fetched = Object.values(result.records);

console.log(`\n=== Fetched ${fetched.length}/5 records`);

const REQUIRED_FIELDS = ["name","instagram","followers","niche","brand_fit","mf_split","india_split","age_concentration","commercials","follower_tier","engagement_rate","avg_views","email","contact_no","text"];

if (fetched.length > 0) {
  const meta = fetched[0].metadata;
  console.log("\n=== Fields in Pinecone metadata:");
  const fields = Object.keys(meta);
  console.log(fields);

  console.log("\n=== Required fields check:");
  let allGood = true;
  for (const f of REQUIRED_FIELDS) {
    const has = fields.includes(f);
    const val = meta[f];
    const empty = val === "" || val === null || val === undefined;
    console.log(`  ${has ? "✅" : "❌"} ${f}${has && !empty ? ` = ${String(val).slice(0,40)}` : has ? " = (empty)" : " = MISSING"}`);
    if (!has) allGood = false;
  }

  console.log("\n=== Sample full metadata (first record):");
  console.log(JSON.stringify(meta, null, 2));

  console.log(allGood ? "\n✅ ALL REQUIRED FIELDS PRESENT" : "\n❌ SOME FIELDS MISSING — re-embed needed");
}
