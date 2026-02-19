import cron from 'node-cron';
import { db, geminiModel, firebaseAdmin } from '../core/config.js';
import { sendEmail, fetchReplies } from './emailService.js';

const OUTREACH_COLLECTION = 'campaign_outreaches';

// ─── Acceptance Detection ─────────────────────────────────────────────────────
// If influencer's message clearly accepts the deal, stop negotiating

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
    // Strategy adapts to conversation length
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

// ─── Build closing / confirmation email ────────────────────────────────────────

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

    // Fetch real replies from IMAP
    const sinceDate = lastCheckedAt?.toDate
        ? lastCheckedAt.toDate()
        : new Date(Date.now() - 48 * 60 * 60 * 1000);

    let newReplies = [];
    try {
        // Match subject leniently: e.g. "Collab: Arnav Prajapati" (ignore "x Swiggy" if inconsistent)
        const baseSubject = (emailSubject || '').replace(/^Re:\s*/i, '').trim();
        // Remove " x Something" suffix
        const subjectKey = baseSubject.replace(/\s+x\s+.*$/i, '').trim();

        console.log(`[Cron] 🔎 Searching for replies to "${subjectKey}" (base: "${baseSubject}")`);
        const all = await fetchReplies({ sinceDate, subjectContains: subjectKey });

        // Filter: only accept messages from the influencer, not already in history
        newReplies = all.filter(r => {
            const alreadyKnown = conversationHistory.some(h => h.messageId === r.messageId);
            return !alreadyKnown;
        });
    } catch (e) {
        console.warn(`[Cron] IMAP error for ${influencerName}:`, e.message);
    }

    // Always update lastCheckedAt
    await outreachDoc.ref.update({ lastCheckedAt: new Date() });

    if (newReplies.length === 0) {
        return; // Waiting for real reply — do nothing
    }

    console.log(`[Cron] 📬 ${newReplies.length} new reply(ies) from ${influencerName}`);

    for (const reply of newReplies) {
        const historyText = conversationHistory
            .map(h => `${h.role === 'outbound' ? brandName : influencerName}: ${h.body}`)
            .join('\n\n');

        const msgCount = conversationHistory.filter(h => h.role === 'inbound').length;
        const dealAccepted = isAcceptance(reply.body);

        let replyText;
        let newStatus = status === 'sent' ? 'negotiating' : 'negotiating';

        if (dealAccepted) {
            // ── Influencer accepted — send confirmation and close ──
            console.log(`[Cron] 🎉 Deal ACCEPTED by ${influencerName}!`);
            newStatus = 'deal_closed';
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
            // ── Negotiation in progress — AI counter-reply ──
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

        // Send reply via Gmail
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
        }

        // Update Firestore
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
            lastReplyAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });

        // Re-read history for next message in this batch
        conversationHistory.push(...updatedHistory.slice(conversationHistory.length));

        if (dealAccepted) break; // No more processing after deal closed
    }
}

// ─── Start Cron ────────────────────────────────────────────────────────────────

export function startNegotiationCron() {
    const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    if (!hasGmail) {
        console.warn('[NegotiationCron] ⚠️  GMAIL_USER/GMAIL_APP_PASSWORD not set. Cron disabled.');
        return;
    }
    console.log('[NegotiationCron] ✅ Starting — checking for real influencer replies every 2 minutes');

    cron.schedule('*/30 * * * * *', async () => {
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

// Keep export for manual trigger from outreach.js (but only uses real IMAP)
export async function simulateNegotiationRound(outreachDoc) {
    await processOutreach(outreachDoc);
}
