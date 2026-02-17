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

async function getEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

async function seedDatabase() {
    console.log('🚀 Starting Production-Grade Seeding...');
    
    const dataPath = path.join(__dirname, '../data/seed_influencers.json');
    const records = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📦 Loaded ${records.length} influencer records.`);

    const index = pinecone.Index(indexName);
    
    const BATCH_SIZE = 10;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const upsertData = [];

        console.log(`🔹 Processing batch ${i / BATCH_SIZE + 1}...`);

        for (const record of batch) {
            const contextText = `Influencer: ${record.name}. Niche: ${record.niche}. Brand Fit: ${record.brand_fit}. Bio: ${record.bio || ''}. Platform: ${record.platform} with ${record.followers} followers. Location: ${record.location}.`;
            
            try {
                const embedding = await getEmbedding(contextText);
                
                const niches = record.niche.split(',').map(n => n.trim().toLowerCase());
                
                upsertData.push({
                    id: record.id,
                    values: embedding,
                    metadata: {
                        name: record.name,
                        handle: record.handle,
                        platform: record.platform,
                        followers: record.followers,
                        niche: record.niche, 
                        niche_list: niches, 
                        primary_niche: niches[0], 
                        location: record.location,
                        engagement_rate: record.engagement_rate,
                        brand_fit: record.brand_fit,
                        commercials: record.commercials,
                        bio: record.bio
                    }
                });
            } catch (err) {
                console.error(`❌ Failed to embed ${record.name}:`, err.message);
            }
        }

        if (upsertData.length > 0) {
            await index.upsert(upsertData);
            console.log(`✅ Upserted ${upsertData.length} records to Pinecone.`);
        }
    }

    console.log('🎉 Database seeding complete! Ready for production testing.');
}

seedDatabase().catch(console.error);
