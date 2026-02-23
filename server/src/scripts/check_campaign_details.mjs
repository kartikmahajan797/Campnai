/**
 * Check Campaign and Outreach Details
 */

import { db } from '../core/config.js';

async function checkCampaignDetails() {
    try {
        console.log('🔍 Searching for active campaigns and outreaches...\n');

        // Find ALL outreaches with status negotiating
        const outreachSnapshot = await db.collection('campaign_outreaches')
            .where('status', '==', 'negotiating')
            .limit(5)
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
            console.log(`   Campaign ID: ${outreachData.campaignId}`);
            console.log(`   Status: ${outreachData.status}`);
            console.log(`   Min Budget: ₹${outreachData.minBudget?.toLocaleString('en-IN')}`);
            console.log(`   Max Budget: ₹${outreachData.maxBudget?.toLocaleString('en-IN')}`);
            console.log(`   Midpoint: ₹${Math.round((outreachData.minBudget + outreachData.maxBudget) / 2).toLocaleString('en-IN')}`);
            console.log(`   Locked: ${outreachData.isProcessingLocked}`);

            console.log('\n📧 CONVERSATION HISTORY:');
            const history = outreachData.conversationHistory || [];
            console.log(`   Total messages: ${history.length}`);
            history.slice(-5).forEach((msg, idx) => {
                console.log(`\n   [${history.length - 5 + idx + 1}] ${msg.role} (${new Date(msg.timestamp).toLocaleTimeString()})`);
                console.log(`       ${msg.body.substring(0, 100)}...`);
                if (msg.influencerPrice) {
                    console.log(`       💰 Extracted Price: ₹${msg.influencerPrice.toLocaleString('en-IN')}`);
                }
            });

            console.log('\n⚙️  DEDUPLICATION:');
            console.log(`   Processed Hashes: ${(outreachData.processedMessageHashes || []).length}`);
            console.log('\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkCampaignDetails()
    .then(() => {
        console.log('\n✅ Done');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Failed:', err);
        process.exit(1);
    });

process.exit(1);
    });
