/**
 * Test Production-Level Price Extraction and Acceptance Detection
 */

import { extractPricingPackages, extractPriceFromMessage } from '../services/negotiationEngine.js';

const testMessages = [
    {
        name: "Multiple Packages (Bewakoof-style)",
        message: `Thank you for sharing the details. I'm really excited about this collaboration and looking forward to taking it ahead.

Based on the campaign scope and deliverables, my commercials are as follows:

   1 Reel + 2 Stories: ₹700000
   
   1 Reel + 3 Stories: ₹1000000
   
   1 Dedicated Post + Stories: ₹150000

These can be adjusted depending on the final requirements, usage rights, and campaign duration. I'm open to discussing and aligning this in a way that works well for both sides.`
    },
    {
        name: "Single Package",
        message: "My rate for 1 Instagram Reel + 2 Stories would be ₹45000."
    },
    {
        name: "Genuine Acceptance",
        message: "Sounds great! I accept the offer of ₹40000. Let's finalize the details and move forward."
    },
    {
        name: "Just Interest (NOT acceptance)",
        message: "Yes, I am interested in this collaboration. Looking forward to working together!"
    },
    {
        name: "Quote with K suffix",
        message: "My rates are 50k for a reel + story combo."
    }
];

async function testPriceExtraction() {
    console.log('🧪 Testing Production-Level Price Extraction\n');
    console.log('═'.repeat(70));

    for (const test of testMessages) {
        console.log(`\n📝 Test: ${test.name}`);
        console.log(`Message: "${test.message.substring(0, 100)}..."`);
        console.log('-'.repeat(70));

        try {
            // Test package extraction
            const packages = await extractPricingPackages(test.message);
            console.log(`\n✅ Extracted ${packages.length} package(s):`);
            packages.forEach((pkg, idx) => {
                console.log(`   ${idx + 1}. ₹${pkg.price.toLocaleString('en-IN')} - ${pkg.deliverables}`);
            });

            // Test simple price extraction (backward compatible)
            const simplePrice = await extractPriceFromMessage(test.message);
            console.log(`\n💰 Simple extraction (lowest): ₹${simplePrice.toLocaleString('en-IN')}`);

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }

        console.log('═'.repeat(70));
    }

    console.log('\n✅ All tests completed\n');
}

testPriceExtraction()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Test failed:', err);
        process.exit(1);
    });
