import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { searchInfluencers, formatForSearchAPI } = await import('./src/services/influencerSearch.js');
const raw = await searchInfluencers('fashion skincare', 5);
console.log('raw type:', typeof raw, Array.isArray(raw), 'length:', raw?.length);
console.log(JSON.stringify(raw?.[0], null, 2));
