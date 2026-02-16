/**
 * Download all influencer data from Firebase to a JSON file.
 * Usage: node server/src/scripts/downloadInfluencers.js
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Initialize Firebase ─────────────────────────────────────────────
const keyPaths = [
    path.resolve(__dirname, "../../serviceAccountKey.json"),
    path.resolve(__dirname, "../../../serviceAccountKey.json"),
];

let serviceAccountPath = null;
for (const p of keyPaths) {
    if (fs.existsSync(p)) {
        serviceAccountPath = p;
        break;
    }
}

if (!serviceAccountPath) {
    console.error("❌ serviceAccountKey.json not found!");
    process.exit(1);
}

const app = initializeApp({ credential: cert(JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"))) });
const db = getFirestore(app);

// ─── Download all influencers ────────────────────────────────────────
async function downloadInfluencers() {
    const campaignId = "test_campaign_001";
    console.log(`📥 Fetching influencers from campaigns/${campaignId}/influencers...`);

    const snap = await db
        .collection("campaigns")
        .doc(campaignId)
        .collection("influencers")
        .get();

    if (snap.empty) {
        console.log("❌ No influencers found in Firestore.");
        return;
    }

    const influencers = [];
    snap.forEach((doc) => {
        influencers.push({
            id: doc.id,
            ...doc.data(),
        });
    });

    // Save to JSON
    const outputPath = path.resolve(__dirname, "../../influencers_data.json");
    fs.writeFileSync(outputPath, JSON.stringify(influencers, null, 2), "utf-8");

    console.log(`✅ Downloaded ${influencers.length} influencers!`);
    console.log(`📁 Saved to: ${outputPath}`);
}

downloadInfluencers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Error:", err.message);
        process.exit(1);
    });
