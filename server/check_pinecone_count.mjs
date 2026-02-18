import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX || 'campnai-influencers');
const stats = await index.describeIndexStats();
console.log('Current record count:', stats.totalRecordCount);
console.log('Full stats:', JSON.stringify(stats, null, 2));
