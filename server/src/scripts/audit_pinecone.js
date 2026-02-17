import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName = process.env.PINECONE_INDEX_NAME || 'campnai-influencers';

async function auditPineconeData() {
  console.log('--- Starting Pinecone Audit ---');
  console.log(`Index: ${indexName}`);

  try {
    const index = pc.index(indexName);
    
    // Fetch statistics
    const stats = await index.describeIndexStats();
    console.log('\nIndex Stats:', JSON.stringify(stats, null, 2));

    // Fetch a sample of vectors to analyze metadata
    // Since we can't "list all" easily without IDs, we'll query with a generic vector
    // hoping to get a broad spread, or use a known namespace if applicable.
    // Better method: Query for a few distinct broad categories to probe the data.

    const categories = ['fashion', 'health', 'fitness', 'tech', 'travel', 'food', 'lifestyle'];
    const summary = {};

    console.log('\n--- Probing Categories ---');
    
    // We'll use a dummy vector of 768 dimensions (common for text-embedding-004)
    // In a real scenario, we'd generate an embedding for the query. 
    // BUT, since we just want to see *what exists*, we can try to fetch by ID if we knew them,
    // or perform a query.
    //
    // Actually, `query` requires a vector. To get *actual* metadata distribution without
    // generating embeddings here (which requires Gemini key), we might be limited.
    //
    // WAIT: The user said "312 influencers".
    // If the IDs are sequential (1-312), we can just fetch them!
    // Let's try fetching IDs "1" to "50" to see if that pattern holds.
    
    const idsToFetch = Array.from({ length: 50 }, (_, i) => String(i + 1));
    const fetchResult = await index.fetch(idsToFetch);
    
    let totalFetched = 0;
    const niches = new Set();
    const brands = new Set();

    for (const [id, record] of Object.entries(fetchResult.records)) {
        totalFetched++;
        if (record.metadata) {
            if (record.metadata.niche) niches.add(record.metadata.niche);
            if (record.metadata.brand_fit) brands.add(record.metadata.brand_fit); // Assuming 'brand_fit' or similar key
        }
    }

    console.log(`\nFetched ${totalFetched} records by ID (1-50).`);
    if (totalFetched > 0) {
        console.log('Sample Niches:', [...niches]);
        console.log('Sample Brand Fits:', [...brands]);
        
        // Log a few full records to see the structure
        console.log('\n--- Sample Record (ID: 1) ---');
        console.log(JSON.stringify(fetchResult.records['1']?.metadata, null, 2));
    } else {
        console.log('Could not fetch by sequential IDs. Trying to query with zero vector (if allowed) or just reporting stats.');
    }

  } catch (error) {
    console.error('Audit failed:', error);
  }
}

auditPineconeData();
