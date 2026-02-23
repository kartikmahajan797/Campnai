/**
 * Clear Stuck Processing Locks
 * 
 * This script finds and releases any stuck processing locks in campaign_outreaches
 */

import { db } from '../core/config.js';

const OUTREACH_COLLECTION = 'campaign_outreaches';

async function clearStuckLocks() {
    try {
        console.log('🔍 Searching for stuck locks...\n');

        const snapshot = await db.collection(OUTREACH_COLLECTION)
            .where('isProcessingLocked', '==', true)
            .get();

        if (snapshot.empty) {
            console.log('✅ No stuck locks found!');
            return;
        }

        console.log(`Found ${snapshot.size} locked outreach(es):\n`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const lockTime = data.lockAcquiredAt?.toDate?.() || null;
            const lockAge = lockTime ? Math.round((Date.now() - lockTime.getTime()) / 1000) : 'unknown';

            console.log(`📌 Outreach: ${data.influencerName || 'Unknown'}`);
            console.log(`   Campaign: ${data.campaignName || 'Unknown'}`);
            console.log(`   Lock Age: ${lockAge === 'unknown' ? 'UNKNOWN (no timestamp)' : `${lockAge}s`}`);
            console.log(`   Status: ${data.status}`);

            // Clear the lock
            await doc.ref.update({
                isProcessingLocked: false,
                lockReleasedAt: new Date(),
                lockClearedBy: 'manual_script'
            });

            console.log(`   ✅ Lock cleared!\n`);
        }

        console.log(`\n✨ Successfully cleared ${snapshot.size} stuck lock(s)`);

    } catch (error) {
        console.error('❌ Error clearing locks:', error);
        throw error;
    }
}

// Run the script
clearStuckLocks()
    .then(() => {
        console.log('\n🎉 Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
