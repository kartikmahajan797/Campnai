import { Router } from 'express';
import { db, firebaseAdmin } from '../core/config.js';
import { authenticate } from '../core/auth.js';
import { sendEmail } from '../services/emailService.js';

const router = Router();
const OUTREACH_COLLECTION = 'campaign_outreaches';
const CAMPAIGN_COLLECTION = 'user_campaigns';

// ─── POST /:id/send-outreach ──────────────────────────────────────────────
router.post('/:id/send-outreach', authenticate, async (req, res) => {
    try {
        const { id: campaignId } = req.params;
        const user = req.user;
        const { influencerEmail, influencerName, influencerId, emailSubject, emailBody, minBudget, maxBudget, brandName, campaignName } = req.body;

        if (!influencerEmail || !emailSubject || !emailBody) {
            return res.status(400).json({ detail: 'Missing influencerEmail, emailSubject, or emailBody.' });
        }

        // Verify campaign ownership
        const campaignRef = db.collection(CAMPAIGN_COLLECTION).doc(campaignId);
        const campaignSnap = await campaignRef.get();
        if (!campaignSnap.exists) return res.status(404).json({ detail: 'Campaign not found.' });
        if (campaignSnap.data().userId !== user.uid) return res.status(403).json({ detail: 'Not authorized.' });

        // Try to send real email (if Gmail configured), else skip gracefully
        let messageId = `local_${Date.now()}`;
        const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
        if (hasGmail) {
            try {
                const result = await sendEmail({ to: influencerEmail, subject: emailSubject, body: emailBody });
                messageId = result.messageId;
            } catch (emailErr) {
                console.warn('[Outreach] Gmail send failed, continuing in demo mode:', emailErr.message);
            }
        }

        // Save outreach to Firestore
        const outreachData = {
            userId: user.uid,
            campaignId,
            influencerId: influencerId || null,
            influencerEmail,
            influencerName: influencerName || 'Unknown',
            emailSubject,
            emailBody,
            brandName: brandName || '',
            campaignName: campaignName || '',
            minBudget: Number(minBudget) || 0,
            maxBudget: Number(maxBudget) || 0,
            outboundMessageId: messageId,
            status: 'sent',
            simulationRound: 0,
            conversationHistory: [{
                role: 'outbound',
                body: emailBody,
                messageId,
                timestamp: new Date().toISOString(),
                isAI: false,
            }],
            sentAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            lastCheckedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            lastReplyAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        };

        const outreachRef = await db.collection(OUTREACH_COLLECTION).add(outreachData);
        await campaignRef.update({ status: 'outreach_sent', updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp() });

        console.log(`[Outreach] Saved outreach ${outreachRef.id} for ${influencerEmail}`);
        res.status(201).json({
            outreachId: outreachRef.id,
            messageId,
            message: 'Outreach sent! AI will reply automatically when the influencer responds.',
        });

    } catch (error) {
        console.error('[Outreach] Send error:', error);
        res.status(500).json({ detail: `Failed to send outreach: ${error.message}` });
    }
});

// ─── GET /:id/outreaches ──────────────────────────────────────────────────
router.get('/:id/outreaches', authenticate, async (req, res) => {
    try {
        const { id: campaignId } = req.params;
        const user = req.user;

        const snapshot = await db.collection(OUTREACH_COLLECTION)
            .where('campaignId', '==', campaignId)
            .where('userId', '==', user.uid)
            .get();

        const outreaches = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (b.sentAt?.seconds || 0) - (a.sentAt?.seconds || 0));

        res.json(outreaches);
    } catch (error) {
        console.error('[Outreach] List error:', error);
        res.status(500).json({ detail: 'Failed to fetch outreaches.' });
    }
});

// ─── GET /:id/outreaches/:outreachId ─────────────────────────────────────
router.get('/:id/outreaches/:outreachId', authenticate, async (req, res) => {
    try {
        const { outreachId } = req.params;
        const user = req.user;
        const doc = await db.collection(OUTREACH_COLLECTION).doc(outreachId).get();
        if (!doc.exists) return res.status(404).json({ detail: 'Outreach not found.' });
        if (doc.data().userId !== user.uid) return res.status(403).json({ detail: 'Not authorized.' });
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ detail: 'Failed to fetch outreach.' });
    }
});

// ─── POST /:id/outreaches/:outreachId/simulate-reply ─────────────────────
// Manually trigger one IMAP check (for testing / debug)
router.post('/:id/outreaches/:outreachId/simulate-reply', authenticate, async (req, res) => {
    try {
        const { outreachId } = req.params;
        const user = req.user;
        const doc = await db.collection(OUTREACH_COLLECTION).doc(outreachId).get();
        if (!doc.exists) return res.status(404).json({ detail: 'Outreach not found.' });
        if (doc.data().userId !== user.uid) return res.status(403).json({ detail: 'Not authorized.' });

        // Dynamically import to avoid circular dependency
        const { simulateNegotiationRound } = await import('../services/negotiationCron.js');
        await simulateNegotiationRound(doc);

        const updated = await db.collection(OUTREACH_COLLECTION).doc(outreachId).get();
        res.json({ message: 'IMAP check triggered.', data: { id: updated.id, ...updated.data() } });
    } catch (error) {
        console.error('[Outreach] Simulate error:', error);
        res.status(500).json({ detail: `Failed: ${error.message}` });
    }
});


export default router;
