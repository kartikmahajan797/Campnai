import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";
import { db } from "../core/config.js";
import { firebaseAdmin } from "../core/config.js";

const router = Router();
const FieldValue = firebaseAdmin.firestore.FieldValue;

// Multer – accept CSV up to 10 MB in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (
            file.mimetype === "text/csv" ||
            file.originalname.toLowerCase().endsWith(".csv")
        ) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Please upload a CSV file."));
        }
    },
});

const REQUIRED_COLUMNS = ["PROFILE LINK", "NAME", "LOCATION", "NICHE"];

// ─── helpers ─────────────────────────────────────────────────────────
function cleanFloat(value) {
    if (value == null || value === "") return 0.0;
    if (typeof value === "number") return value;
    const cleaned = String(value).replace(/,/g, "").replace(/%/g, "").trim();
    const n = parseFloat(cleaned);
    return Number.isNaN(n) ? 0.0 : n;
}

function cleanStr(value) {
    if (value == null) return "";
    return String(value).trim();
}

// ─── POST /upload-csv ───────────────────────────────────────────────
router.post("/upload-csv", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ detail: "No file uploaded." });
        }

        const content = req.file.buffer.toString("utf-8").replace(/^\uFEFF/, ""); // strip BOM

        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });

        if (records.length === 0) {
            return res.status(400).json({ detail: "CSV file appears to be empty or missing headers." });
        }

        // Normalize column names to UPPER CASE
        const normalizedRecords = records.map((row) => {
            const out = {};
            for (const [key, val] of Object.entries(row)) {
                out[key.trim().toUpperCase()] = val;
            }
            return out;
        });

        const availableCols = Object.keys(normalizedRecords[0]);
        const missingCols = REQUIRED_COLUMNS.filter((c) => !availableCols.includes(c));
        if (missingCols.length) {
            return res.status(400).json({
                detail: `Missing required columns: ${missingCols.join(", ")}. Available: ${availableCols.slice(0, 5).join(", ")}...`,
            });
        }

        const createdAt = new Date();
        const campaignId = "test_campaign_001";
        const collectionRef = db.collection("campaigns").document
            ? db.collection("campaigns").doc(campaignId).collection("influencers")
            : db.collection("campaigns").doc(campaignId).collection("influencers");

        let batch = db.batch();
        let count = 0;

        for (const row of normalizedRecords) {
            const g = (col) => row[col] ?? null;
            const influencerId = uuidv4();

            const record = {
                profile: {
                    link: cleanStr(g("PROFILE LINK")),
                    name: cleanStr(g("NAME")),
                    gender: cleanStr(g("GENDER")),
                    location: cleanStr(g("LOCATION")),
                    type: cleanStr(g("TYPE")),
                },
                metrics: {
                    followers: cleanFloat(g("FOLLOWERS")),
                    avg_views: cleanFloat(g("AVERAGE VIEWS")),
                    engagement_rate: cleanFloat(g("ENGAGEMENT RATE")),
                },
                audience: {
                    mf_split: cleanStr(g("M/F SPLIT")),
                    india_split: cleanStr(g("INDIA 1/2 SPLIT")),
                    age_concentration: cleanStr(g("AGE CONCENTRATION")),
                },
                brand: {
                    niche: cleanStr(g("NICHE")),
                    brand_fit: cleanStr(g("BRAND FIT")),
                    vibe: cleanStr(g("VIBE")),
                },
                commercials: cleanStr(g("COMMERCIALS")),
                contact: {
                    contact_no: cleanStr(g("CONTACT NO.")),
                    email: cleanStr(g("EMAIL")),
                },
                created_at: createdAt,
            };

            const docRef = db
                .collection("campaigns")
                .doc(campaignId)
                .collection("influencers")
                .doc(influencerId);

            batch.set(docRef, record);
            count++;

            // Firestore batch limit is 500
            if (count % 400 === 0) {
                await batch.commit();
                batch = db.batch();
            }
        }

        if (count % 400 !== 0) {
            await batch.commit();
        }

        return res.status(201).json({
            status: "success",
            uploaded_records: count,
            campaign_id: campaignId,
        });
    } catch (err) {
        console.error("CSV upload error:", err);
        if (err.message?.includes("firestore.googleapis.com")) {
            return res.status(500).json({
                detail: "Firestore API is disabled. Please enable it in Google Cloud Console.",
            });
        }
        return res.status(500).json({ detail: `Database error: ${err.message}` });
    }
});

// ─── GET /influencers ───────────────────────────────────────────────
router.get("/influencers", async (req, res) => {
    try {
        let { page = 1, page_size = 10, search, campaign_id = "test_campaign_001" } = req.query;
        page = Math.max(1, parseInt(page, 10) || 1);
        page_size = Math.min(100, Math.max(1, parseInt(page_size, 10) || 10));

        const collectionRef = db
            .collection("campaigns")
            .doc(campaign_id)
            .collection("influencers");

        if (search) {
            const lowerSearch = search.toLowerCase();

            const allSnap = await collectionRef.orderBy("created_at", "desc").get();

            const filtered = [];
            allSnap.forEach((doc) => {
                const data = doc.data();
                const profile = data.profile || {};
                const contact = data.contact || {};

                const matches =
                    (profile.link || "").toLowerCase().includes(lowerSearch) ||
                    (profile.name || "").toLowerCase().includes(lowerSearch) ||
                    (profile.gender || "").toLowerCase().includes(lowerSearch) ||
                    (profile.location || "").toLowerCase().includes(lowerSearch) ||
                    (contact.contact_no || "").toLowerCase().includes(lowerSearch) ||
                    (contact.email || "").toLowerCase().includes(lowerSearch);

                if (matches) {
                    const item = { ...data, id: doc.id };
                    if (item.created_at && item.created_at.toDate) {
                        item.created_at = item.created_at.toDate().toISOString();
                    }
                    filtered.push(item);
                }
            });

            const total = filtered.length;
            const start = (page - 1) * page_size;
            const paginated = filtered.slice(start, start + page_size);

            return res.json({
                influencers: paginated,
                total,
                page,
                page_size,
                total_pages: total > 0 ? Math.ceil(total / page_size) : 0,
            });
        }

        // Non-search: paginated query
        const countSnap = await collectionRef.count().get();
        const totalDocs = countSnap.data().count;

        const snap = await collectionRef
            .orderBy("created_at", "desc")
            .limit(page_size)
            .offset((page - 1) * page_size)
            .get();

        const influencers = [];
        snap.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            if (data.created_at && data.created_at.toDate) {
                data.created_at = data.created_at.toDate().toISOString();
            }
            influencers.push(data);
        });

        return res.json({
            influencers,
            total: totalDocs,
            page,
            page_size,
            total_pages: totalDocs > 0 ? Math.ceil(totalDocs / page_size) : 0,
        });
    } catch (err) {
        console.error("Error fetching influencers:", err);
        return res.status(500).json({ detail: `Database error: ${err.message}` });
    }
});

export default router;
