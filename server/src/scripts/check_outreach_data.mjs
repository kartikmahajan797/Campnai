/**
 * Check Campaign and Outreach Details
 */

import { db } from '../core/config.js';

async function checkCampaignDetails() {
    try {
        console.log('🔍 Searching for recent campaigns and outreaches...\n');

        // Find recent outreaches
        const outreachSnapshot = await db.collection('campaign_outreaches')
            .limit(10)
            .get();

        if (outreachSnapshot.empty) {
            console.log('❌ No active outreaches found');
            return;
        }

        console.log(`Found ${outreachSnapshot.size} active outreach(es)\n`);

        for (const outreachDoc of outreachSnapshot.docs) {
            const outreachData = outreachDoc.data();

            console.log('═══════════════════════════════════════════════════════');
            console.log('📋 OUTREACH DETAILS:');
            console.log(`   Influencer: ${outreachData.influencerName}`);
            console.log(`   Campaign: ${outreachData.campaignName}`);
            console.log(`   Status: ${outreachData.status}`);
            console.log(`   Min Budget: ₹${outreachData.minBudget?.toLocaleString('en-IN')}`);
            console.log(`   Max Budget: ₹${outreachData.maxBudget?.toLocaleString('en-IN')}`);
            console.log(`   Midpoint: ₹${Math.round((outreachData.minBudget + outreachData.maxBudget) / 2).toLocaleString('en-IN')}`);

            console.log('\n📧 CONVERSATION HISTORY (Last 5 messages):');
            const history = outreachData.conversationHistory || [];
            console.log(`   Total messages: ${history.length}`);
            const lastFive = history.slice(-5);
            lastFive.forEach((msg, idx) => {
                const msgNum = history.length - lastFive.length + idx + 1;
                console.log(`\n   [${msgNum}] ${msg.role} (${new Date(msg.timestamp).toLocaleTimeString()})`);
                console.log(`       ${msg.body.substring(0, 100)}...`);
                if (msg.influencerPrice) {
                    console.log(`       💰 Extracted Price: ₹${msg.influencerPrice.toLocaleString('en-IN')}`);
                }
            });

            console.log('\n⚙️  STATS:');
            console.log(`   Processed Hashes: ${(outreachData.processedMessageHashes || []).length}`);
            console.log(`   Locked: ${outreachData.isProcessingLocked || false}`);
            console.log('\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkCampaignDetails()
    .then(() => {
        console.log('✅ Done');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    });
