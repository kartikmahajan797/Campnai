/**
 * Delete ALL records from Pinecone index and re-embed from JSON
 * Run: node src/scripts/reembed_fresh.mjs
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
const indexName = process.env.PINECONE_INDEX || "campnai-influencers";
const index = pc.index(indexName);

// Delete all vectors
console.log(`Deleting all records from index: ${indexName}`);
await index.deleteAll();
console.log("All records deleted.");

const statsBefore = await index.describeIndexStats();
console.log("Stats after delete:", JSON.stringify(statsBefore));
