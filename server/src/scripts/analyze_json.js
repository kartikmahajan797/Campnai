import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../../influencers_data.json');

try {
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const influences = JSON.parse(rawData);

    console.log(`Total Records: ${influences.length}`);
    
    const validInfluencers = influences.filter(inf => 
        (inf.brand?.niche && inf.brand.niche.length > 2) || 
        (inf.brand?.brand_fit && inf.brand.brand_fit.length > 2)
    );

    console.log(`Records with Niche/Brand Data: ${validInfluencers.length}`);

    console.log('\n--- Sample Valid Records ---');
    validInfluencers.slice(0, 20).forEach((inf, i) => {
        console.log(`\n#${i + 1}: ${inf.profile?.name || 'Unknown'}`);
        console.log(`   Niche: ${inf.brand?.niche || 'N/A'}`);
        console.log(`   Brand Fit: ${inf.brand?.brand_fit || 'N/A'}`);
        console.log(`   Link: ${inf.profile?.link || 'N/A'}`);
    });

} catch (err) {
    console.error('Error reading JSON:', err.message);
}
