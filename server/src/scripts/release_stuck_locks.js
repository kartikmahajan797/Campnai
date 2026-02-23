/**
 * Utility script to manually release stuck processing locks
 * Run this if the negotiation cron gets stuck
 */

import { db } from '../core/config.js';

async function releaseAllStuckLocks() {
    try {
        console.log('🔍 Searching for stuck locks...\n');

        const snapshot = await db.collection('campaign_outreaches')
            .where('isProcessingLocked', '==', true)
            .get();

        if (snapshot.empty) {
            console.log('✅ No stuck locks found!');
            return;
        }

        console.log(`📋 Found ${snapshot.size} locked outreach(es)\n`);

        const batch = db.batch();
        let count = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const lockTime = data.lockAcquiredAt?.toDate?.();
            const influencerName = data.influencerName || 'Unknown';
            const campaignName = data.campaignName || 'Unknown';

            let lockAgeStr = 'Unknown age';
            if (lockTime) {
                const lockAge = Date.now() - lockTime.getTime();
                const minutes = Math.floor(lockAge / 60000);
                const seconds = Math.floor((lockAge % 60000) / 1000);
                lockAgeStr = `${minutes}m ${seconds}s`;
            }

            console.log(`🔓 Releasing lock for: ${influencerName} (${campaignName})`);
            console.log(`   Lock age: ${lockAgeStr}`);
            console.log(`   Outreach ID: ${doc.id}\n`);

            batch.update(doc.ref, {
                isProcessingLocked: false,
                lockReleasedAt: new Date(),
                lockReleasedReason: 'manual_release_script'
            });
            count++;
        });

        await batch.commit();
        console.log(`\n✅ Successfully released ${count} lock(s)!`);
        console.log('💡 The negotiation cron should now be able to process these campaigns.\n');

    } catch (error) {
        console.error('❌ Error releasing locks:', error);
        process.exit(1);
    }
}

// Run the script
releaseAllStuckLocks()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
