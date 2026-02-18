import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "src/../.env") });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX || "campnai-influencers");

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, "src/influencers_data.json"), "utf-8"));
const testIds = data.slice(0, 5).map(x => x.id);

console.log("Fetching IDs:", testIds);
const result = await index.fetch(testIds);

console.log("\n=== Pinecone Record Count in fetch:", Object.keys(result.records).length);
const first = Object.values(result.records)[0];
if (first) {
  console.log("\n=== Pinecone Metadata Fields:", Object.keys(first.metadata));
  console.log("\n=== Sample Pinecone Metadata:");
  console.log(JSON.stringify(first.metadata, null, 2));
} else {
  console.log("NO RECORDS FOUND for these IDs — Pinecone may have different IDs");
}
