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

async function clearPineconeIndex() {
  console.log(`--- Clearing Pinecone Index: ${indexName} ---`);

  try {
    const index = pc.index(indexName);
    
    // Pinecone allows deleting all vectors in a namespace. 
    // If we are not using namespaces (default), we delete everything in the default namespace.
    // To delete EVERYTHING in the index, we can use deleteAll: true.
    
    console.log('Sending delete all command...');
    await index.deleteAll();
    console.log('✅ Successfully deleted all vectors from the index.');
    
  } catch (error) {
    console.error('❌ Failed to clear index:', error);
  }
}

clearPineconeIndex();
