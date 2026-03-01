import { Router } from 'express';
import { db, firebaseAdmin } from '../core/config.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { verifyCSRFToken } from '../config/csrfService.js';
import { sendEmail } from '../services/emailService.js';
import { generateInitialOutreach } from '../services/negotiationEngine.js';

const router = Router();
const OUTREACH_COLLECTION = 'campaign_outreaches';
const CAMPAIGN_COLLECTION = 'user_campaigns';

// ─── POST /:id/send-outreach ──────────────────────────────────────────────
router.post('/:id/send-outreach', authenticate, verifyCSRFToken, async (req, res) => {
    try {
        const { id: campaignId } = req.params;
        const user = req.user;
        const {
            influencerEmail, influencerName, influencerId,
            emailSubject, emailBody,
            minBudget, maxBudget,
            brandName, campaignName,
            // NEW: Influencer metrics for market analysis
            influencerMetrics = {}
        } = req.body;

        if (!influencerEmail || !emailSubject || !emailBody) {
            return res.status(400).json({ detail: 'Missing influencerEmail, emailSubject, or emailBody.' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(influencerEmail)) {
            return res.status(400).json({ detail: 'Invalid influencer email format.' });
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

        // Save outreach to Firestore with influencer metrics
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
            // Store influencer metrics for intelligent negotiation
            influencerMetrics: {
                followers: influencerMetrics.followers || 0,
                engagementRate: influencerMetrics.engagementRate || 0,
                niche: influencerMetrics.niche || '',
                location: influencerMetrics.location || '',
                tier: influencerMetrics.tier || '',
                platform: influencerMetrics.platform || 'Instagram'
            },
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
            // CRITICAL: Deduplication fields
            processedMessageHashes: [], // Track processed message hashes
            lastProcessedTimestamp: null, // Track last processed message time
            isProcessingLocked: false, // Prevent race conditions
            sentAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            lastCheckedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            lastReplyAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            messagesCount: 1
        };

        const outreachRef = await db.collection(OUTREACH_COLLECTION).add(outreachData);
        await campaignRef.update({
            status: 'outreach_sent',
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            activeOutreaches: firebaseAdmin.firestore.FieldValue.increment(1)
        });

        console.log(`[Outreach] ✅ Created outreach ${outreachRef.id} → ${influencerEmail}`);
        console.log(`[Outreach] 📊 Metrics: ${influencerMetrics.followers || 0} followers, ${influencerMetrics.engagementRate || 0}% ER`);

        res.status(201).json({
            outreachId: outreachRef.id,
            messageId,
            message: 'Outreach sent! AI negotiation engine will respond automatically.',
        });

    } catch (error) {
        console.error('[Outreach] Send error:', error);
        res.status(500).json({ detail: 'Failed to send outreach.' });
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
router.post('/:id/outreaches/:outreachId/simulate-reply', authenticate, verifyCSRFToken, async (req, res) => {
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
        res.status(500).json({ detail: 'Simulation failed.' });
    }
});

// ─── POST /generate-outreach-email ───────────────────────────────────────────
// Generate unique, professional outreach email using AI
router.post('/generate-outreach-email', authenticate, verifyCSRFToken, async (req, res) => {
    try {
        const {
            influencerName,
            influencerHandle,
            brandName,
            campaignName,
            campaignGoal = 'brand awareness',
            brandDescription = '',
            expectedDeliverables = 'Instagram content'
        } = req.body;

        if (!influencerName || !brandName || !campaignName) {
            return res.status(400).json({
                detail: 'Missing required fields: influencerName, brandName, campaignName'
            });
        }

        console.log(`[Outreach] Generating unique email for ${influencerName} → ${campaignName}`);

        const emailBody = await generateInitialOutreach({
            influencerName,
            influencerHandle: influencerHandle || '@instagram',
            brandName,
            campaignName,
            campaignGoal,
            brandDescription,
            expectedDeliverables
        });

        const subject = `Collab: ${influencerName} x ${brandName}`;

        res.json({
            subject,
            body: emailBody,
            message: 'Unique outreach email generated successfully'
        });

    } catch (error) {
        console.error('[Outreach] Email generation error:', error);
        res.status(500).json({ detail: 'Failed to generate email.' });
    }
});

// ─── GET /:id/analytics ───────────────────────────────────────────────────────
// Get campaign analytics and performance metrics
router.get('/:id/analytics', authenticate, async (req, res) => {
    try {
        const { id: campaignId } = req.params;
        const user = req.user;

        // Verify campaign ownership
        const campaignSnap = await db.collection(CAMPAIGN_COLLECTION).doc(campaignId).get();
        if (!campaignSnap.exists) return res.status(404).json({ detail: 'Campaign not found.' });
        if (campaignSnap.data().userId !== user.uid) return res.status(403).json({ detail: 'Not authorized.' });

        // Get all outreaches for this campaign
        const snapshot = await db.collection(OUTREACH_COLLECTION)
            .where('campaignId', '==', campaignId)
            .where('userId', '==', user.uid)
            .get();

        if (snapshot.empty) {
            return res.json({
                totalOutreaches: 0,
                activeNegotiations: 0,
                dealsClosed: 0,
                successRate: '0%',
                totalBudgetCommitted: 0,
                averageDiscount: '0%',
                averageTimeToClose: 'N/A',
                outreaches: []
            });
        }

        const outreaches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculate metrics
        const totalOutreaches = outreaches.length;
        const activeNegotiations = outreaches.filter(o => o.status === 'negotiating').length;
        const dealsClosed = outreaches.filter(o => o.status === 'deal_closed').length;
        const successRate = totalOutreaches > 0 ? `${Math.round((dealsClosed / totalOutreaches) * 100)}%` : '0%';

        // Financial metrics
        const closedDeals = outreaches.filter(o => o.dealMetrics?.finalPrice);
        const totalBudgetCommitted = closedDeals.reduce((sum, o) => sum + (o.dealMetrics?.finalPrice || 0), 0);

        const discounts = closedDeals
            .filter(o => o.dealMetrics?.metrics?.discountAchieved)
            .map(o => parseFloat(o.dealMetrics.metrics.discountAchieved));
        const averageDiscount = discounts.length > 0
            ? `${(discounts.reduce((a, b) => a + b, 0) / discounts.length).toFixed(1)}%`
            : '0%';

        // Time to close
        const times = closedDeals
            .filter(o => o.dealMetrics?.metrics?.timeToClose)
            .map(o => o.dealMetrics.metrics.timeToClose);
        const averageTimeToClose = times.length > 0 ? times[0] : 'N/A'; // Simplified

        // Top performers
        const topPerformers = closedDeals
            .sort((a, b) => {
                const aDiscount = parseFloat(a.dealMetrics?.metrics?.discountAchieved) || 0;
                const bDiscount = parseFloat(b.dealMetrics?.metrics?.discountAchieved) || 0;
                return bDiscount - aDiscount;
            })
            .slice(0, 5)
            .map(o => ({
                influencerName: o.influencerName,
                finalPrice: o.dealMetrics?.finalPrice,
                discount: o.dealMetrics?.metrics?.discountAchieved,
                rounds: o.dealMetrics?.metrics?.totalRounds
            }));

        // Status breakdown
        const statusBreakdown = {
            sent: outreaches.filter(o => o.status === 'sent').length,
            negotiating: activeNegotiations,
            deal_closed: dealsClosed,
            pending: outreaches.filter(o => !o.status || o.status === 'pending').length
        };

        res.json({
            campaignId,
            campaignName: campaignSnap.data().name || campaignName || 'Unnamed Campaign',
            totalOutreaches,
            activeNegotiations,
            dealsClosed,
            successRate,
            totalBudgetCommitted: `₹${totalBudgetCommitted.toLocaleString('en-IN')}`,
            averageDiscount,
            averageTimeToClose,
            statusBreakdown,
            topPerformers,
            recentActivity: outreaches
                .sort((a, b) => (b.lastReplyAt?.seconds || 0) - (a.lastReplyAt?.seconds || 0))
                .slice(0, 10)
                .map(o => ({
                    id: o.id,
                    influencerName: o.influencerName,
                    status: o.status,
                    messagesCount: o.messagesCount || o.conversationHistory?.length || 0,
                    lastUpdate: o.lastReplyAt
                }))
        });

    } catch (error) {
        console.error('[Outreach] Analytics error:', error);
        res.status(500).json({ detail: 'Failed to fetch analytics.' });
    }
});


export default router;
