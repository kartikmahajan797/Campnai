import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const indexName = process.env.PINECONE_INDEX_NAME || 'campnai-influencers';

const SLEEP_MS = 2000; // 2 seconds delay between records

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEmbeddingWithRetry(text, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (err) {
            if (i === retries - 1) throw err;
            const waitTime = 5000 * (i + 1);
            console.warn(`⚠️  Embedding failed (attempt ${i + 1}/${retries}). Retrying in ${waitTime/1000}s... Error: ${err.message}`);
            await sleep(waitTime);
        }
    }
}

async function seedDatabase() {
    console.log('🚀 Starting Production-Grade Seeding with Rate Limiting...');
    
    // Path to the new data file
    const dataPath = path.join(__dirname, '../influencers_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Data file not found at: ${dataPath}`);
        process.exit(1);
    }

    const records = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📦 Loaded ${records.length} influencer records.`);

    const index = pinecone.Index(indexName);
    
    const BATCH_SIZE = 10;
    
    // Resume capability: check if we want to skip some (manual for now, but good to have logic structure)
    // For now, we process all.
    
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const upsertData = [];

        console.log(`🔹 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(records.length / BATCH_SIZE)}...`);

        for (const record of batch) {
            // Data mapping with fallbacks
            const profile = record.profile || {};
            const brand = record.brand || {};
            const metrics = record.metrics || {};
            const contact = record.contact || {};
            
            const name = profile.name || record.name || 'Unknown';
            const niche = brand.niche || record.niche || '';
            const brandFit = brand.brand_fit || record.brand_fit || '';
            const bio = record.bio || brand.vibe || '';
            const platform = record.platform || 'Instagram'; 
            const followers = metrics.followers || record.followers || 0;
            const location = profile.location || record.location || '';
            const engagementRate = metrics.engagement_rate || record.engagement_rate || 0;
            const commercials = record.commercials || '';

            const contextText = `Influencer: ${name}. Niche: ${niche}. Brand Fit: ${brandFit}. Bio: ${bio}. Platform: ${platform} with ${followers} followers. Location: ${location}.`;
            
            try {
                // Rate limiting delay
                await sleep(SLEEP_MS);
                
                const embedding = await getEmbeddingWithRetry(contextText);
                
                const niches = niche.split(',').map(n => n.trim().toLowerCase());
                
                upsertData.push({
                    id: record.id,
                    values: embedding,
                    metadata: {
                        name: name,
                        handle: profile.link ? profile.link.split('/').pop() : (record.handle || ''),
                        link: profile.link || '',
                        platform: platform,
                        followers: followers,
                        niche: niche, 
                        niche_list: niches, 
                        primary_niche: niches[0] || '', 
                        location: location,
                        engagement_rate: engagementRate,
                        brand_fit: brandFit,
                        commercials: commercials,
                        bio: bio,
                        gender: profile.gender || '',
                        email: contact.email || '',
                        contact_no: contact.contact_no || ''
                    }
                });
            } catch (err) {
                console.error(`❌ Failed to embed ${name}:`, err.message);
            }
        }

        if (upsertData.length > 0) {
            try {
                await index.upsert(upsertData);
                console.log(`✅ Upserted ${upsertData.length} records to Pinecone.`);
            } catch (err) {
                console.error('❌ Failed to upsert batch to Pinecone:', err);
            }
        }
    }

    console.log('🎉 Database seeding complete! Ready for production testing.');
}

seedDatabase().catch(console.error);
