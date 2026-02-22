import cron from 'node-cron';
import { db, geminiModel, firebaseAdmin } from '../core/config.js';
import { sendEmail, fetchReplies } from './emailService.js';

const OUTREACH_COLLECTION = 'campaign_outreaches';

// ─── Acceptance Detection ─────────────────────────────────────────────────────

const ACCEPTANCE_PHRASES = [
    'i accept', "i'm in", 'sounds good', 'let\'s do it', 'deal done',
    'agreed', 'confirmed', 'ok deal', 'okk deal', 'okk done', 'ok done',
    'let\'s proceed', 'i agree', 'sounds great', 'works for me',
    'i accept the proposal', 'i accept the offer', 'i accept your offer',
    'yes i accept', 'yes, i accept', 'yes interested', 'yes, interested',
    'great let\'s go', 'perfect deal', 'deal confirmed', 'happy to proceed',
    'happy with that', 'that works', 'that\'s fine', 'finalize',
];

function isAcceptance(text) {
    const lower = text.toLowerCase().trim();
    return ACCEPTANCE_PHRASES.some(p => lower.includes(p));
}

// ─── Negotiation Prompt ────────────────────────────────────────────────────────

function buildBrandReply({ brandName, campaignName, minBudget, maxBudget, historyText, incomingMessage, msgCount }) {
    const stage =
        msgCount <= 1 ? 'introduce budget — start slightly below your range, show enthusiasm'
            : msgCount <= 3 ? 'negotiate — they pushed back, go mid-range, highlight campaign benefits'
                : msgCount <= 5 ? 'final offer — go near max, make it sound exclusive and urgent'
                    : 'close the deal — they seem interested, nail down final terms and timeline';

    return `You are a professional influencer marketing manager for ${brandName}.

CAMPAIGN: "${campaignName}"
YOUR BUDGET RANGE (keep confidential): ₹${minBudget}–₹${maxBudget}
CURRENT STAGE: ${stage}

CONVERSATION HISTORY:
${historyText || 'No history yet.'}

INFLUENCER JUST REPLIED:
"${incomingMessage}"

NEGOTIATION RULES:
1. Never reveal your budget range explicitly
2. Be professional, warm, confident — sound human
3. Keep reply under 120 words
4. If they agree/accept → send a warm deal confirmation with specific deliverables and timeline. End the negotiation.
5. If they give high counter-offer → counter back professionally
6. Reply as plain text only (no labels, no subject line)`;
}

// ─── Confirmation email ────────────────────────────────────────────────────────

function buildConfirmationEmail({ brandName, campaignName, influencerName, budget, historyText, acceptMessage }) {
    return `You are a marketing manager for ${brandName}.
The influencer ${influencerName} just accepted our campaign collaboration offer for "${campaignName}".

Their acceptance message: "${acceptMessage}"

CONVERSATION CONTEXT:
${historyText}

Write a SHORT, warm deal confirmation email (100–130 words):
- Confirm the deal is finalized
- Mention the campaign name  
- Ask them to share their content calendar / deliverable timeline within 3 days
- Express genuine excitement
- Sign off professionally

Plain text only.`;
}

// ─── Main cron processor ───────────────────────────────────────────────────────

async function processOutreach(outreachDoc) {
    const data = outreachDoc.data();
    const {
        influencerEmail, emailSubject, conversationHistory = [],
        lastCheckedAt, outboundMessageId,
        brandName, campaignName, minBudget, maxBudget, influencerName,
        status,
    } = data;

    if (status === 'deal_closed') return;

    // ── Build the set of already-processed messageIds for THIS campaign ──
    // This is the primary deduplication mechanism — no matter how old the
    // email is, if we already processed it, we will not process it again.
    const processedIds = new Set(
        conversationHistory.map(h => h.messageId).filter(Boolean)
    );

    // ── Determine since date ──
    // Use lastCheckedAt as the IMAP search start point.
    // No artificial cap — if reply came 2 days later, we'll still find it
    // because lastCheckedAt was set when the outreach was SENT (or last reply processed).
    // We only look back at most 30 days to avoid loading thousands of old emails.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let sinceDate;
    if (lastCheckedAt?.toDate) {
        sinceDate = lastCheckedAt.toDate();
    } else if (typeof lastCheckedAt === 'string') {
        sinceDate = new Date(lastCheckedAt);
    } else {
        sinceDate = thirtyDaysAgo;
    }
    // Safety: don't go beyond 30 days
    if (sinceDate < thirtyDaysAgo) sinceDate = thirtyDaysAgo;

    // ── Fetch replies from IMAP ──
    const baseSubject = (emailSubject || '').replace(/^Re:\s*/i, '').trim();
    console.log(`[Cron] 🔎 Fetching since ${sinceDate.toISOString()} — exact subject: "${baseSubject}"`);

    let allFetched = [];
    try {
        allFetched = await fetchReplies({ sinceDate, subjectContains: baseSubject });
    } catch (e) {
        console.warn(`[Cron] IMAP error for ${influencerName}:`, e.message);
        return;
    }

    // ── Strict deduplication ──
    // 1. Must have messageId
    // 2. MessageId must NOT be in this campaign's history
    // 3. Subject must EXACTLY match this campaign (no cross-campaign mixing)
    const strip = (s) => (s || '').replace(/^(Re:|Fwd:)\s*/gi, '').trim().toLowerCase();
    const expectedSubj = strip(baseSubject);

    const newReplies = allFetched.filter(r => {
        if (!r.messageId) {
            console.log(`[Cron] ⏭️  No messageId — skip`);
            return false;
        }
        if (processedIds.has(r.messageId)) {
            console.log(`[Cron] ⏭️  Already processed — skip: ${r.messageId}`);
            return false;
        }
        const replySubj = strip(r.subject);
        if (replySubj !== expectedSubj) {
            console.log(`[Cron] ⏭️  Subject mismatch — skip: "${r.subject}"`);
            return false;
        }
        return true;
    });

    if (newReplies.length === 0) {
        return; // Nothing new — do NOT update lastCheckedAt
    }

    console.log(`[Cron] 📬 ${newReplies.length} new reply(ies) from ${influencerName} — processing 1`);

    // Process ONE reply per cron cycle — prevents burst sending
    const reply = newReplies[0];

    const historyText = conversationHistory
        .map(h => `${h.role === 'outbound' ? brandName : influencerName}: ${h.body}`)
        .join('\n\n');

    const msgCount = conversationHistory.filter(h => h.role === 'inbound').length;
    const dealAccepted = isAcceptance(reply.body);

    let replyText;
    const newStatus = dealAccepted ? 'deal_closed' : 'negotiating';

    if (dealAccepted) {
        console.log(`[Cron] 🎉 Deal ACCEPTED by ${influencerName}!`);
        try {
            const r = await geminiModel.generateContent(buildConfirmationEmail({
                brandName, campaignName, influencerName,
                budget: maxBudget,
                historyText,
                acceptMessage: reply.body,
            }));
            replyText = r.response.text().trim();
        } catch (e) {
            replyText = `That's fantastic, ${influencerName?.split(' ')[0]}! We're thrilled to confirm the partnership for our ${campaignName} campaign. Please share your content calendar and deliverable timeline within the next 3 days. Looking forward to creating something amazing together!\n\nWarm regards,\n${brandName} Team`;
        }
    } else {
        try {
            const r = await geminiModel.generateContent(buildBrandReply({
                brandName, campaignName, minBudget, maxBudget, historyText,
                incomingMessage: reply.body, msgCount,
            }));
            replyText = r.response.text().trim();
        } catch (e) {
            replyText = `Hi ${influencerName?.split(' ')[0]}, thanks for your response! We're excited about this collaboration and would love to make the numbers work. Let's connect to finalize the details.\n\nBest,\n${brandName} Team`;
        }
    }

    // ── Send reply ──
    let sentMessageId = `local_${Date.now()}`;
    try {
        const reSubject = emailSubject?.startsWith('Re:') ? emailSubject : `Re: ${emailSubject}`;
        const result = await sendEmail({
            to: influencerEmail,
            subject: reSubject,
            body: replyText,
            inReplyTo: reply.messageId,
            replyToMessageId: outboundMessageId || reply.messageId,
        });
        sentMessageId = result.messageId;
        console.log(`[Cron] 📤 ${dealAccepted ? 'Confirmation' : 'Negotiation'} reply sent → ${sentMessageId}`);
    } catch (e) {
        console.warn(`[Cron] SMTP send failed:`, e.message);
        // Still update Firestore to record the inbound — prevents reprocessing same reply
    }

    // ── Update Firestore AFTER successful processing ──
    // lastCheckedAt is updated here (not at the start) so that if we crash
    // before processing, we will retry on the next cron run.
    const updatedHistory = [
        ...conversationHistory,
        {
            role: 'inbound',
            body: reply.body,
            messageId: reply.messageId,
            timestamp: reply.date?.toISOString() || new Date().toISOString(),
            isAI: false,
        },
        {
            role: 'outbound',
            body: replyText,
            messageId: sentMessageId,
            timestamp: new Date().toISOString(),
            isAI: true,
            isDealClose: dealAccepted,
        },
    ];

    await outreachDoc.ref.update({
        conversationHistory: updatedHistory,
        status: newStatus,
        lastCheckedAt: new Date(),         // update AFTER processing
        lastReplyAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });
}

// ─── Start Cron ────────────────────────────────────────────────────────────────

export function startNegotiationCron() {
    const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    if (!hasGmail) {
        console.warn('[NegotiationCron] ⚠️  GMAIL_USER/GMAIL_APP_PASSWORD not set. Cron disabled.');
        return;
    }
    console.log('[NegotiationCron] ✅ Starting — checking every 2 minutes');

    cron.schedule('*/2 * * * *', async () => {
        try {
            if (!db) return;

            const snapshot = await db.collection(OUTREACH_COLLECTION)
                .where('status', 'in', ['sent', 'negotiating'])
                .get();

            if (snapshot.empty) return;
            console.log(`[NegotiationCron] 🔄 Checking ${snapshot.docs.length} active outreach(es)...`);

            for (const doc of snapshot.docs) {
                await processOutreach(doc);
            }
        } catch (err) {
            console.error('[NegotiationCron] Error:', err.message);
        }
    });
}

export async function simulateNegotiationRound(outreachDoc) {
    await processOutreach(outreachDoc);
}
