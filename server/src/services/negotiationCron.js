/**
 * Enterprise Negotiation Automation - Version 3.0
 * 
 * Features:
 * - Intelligent price analysis and market comparison
 * - Dynamic negotiation strategies
 * - Unique email generation (no templates)
 * - Campaign isolation & thread management
 * - Deal closing automation
 * - Analytics tracking
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: MULTI-LAYER DEDUPLICATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This system prevents duplicate email replies using 5 layers of protection:
 * 
 * 1. ATOMIC LOCKING
 *    - Uses Firestore transactions to acquire exclusive lock
 *    - Only one cron job can process an outreach at a time
 *    - Prevents race conditions from parallel executions
 * 
 * 2. MESSAGE HASH TRACKING
 *    - Generates SHA-256 hash from: influencerId + campaignId + normalizedText + timestamp
 *    - Stores all processed hashes in `processedMessageHashes` array
 *    - Rejects any message with matching hash
 * 
 * 3. TIMESTAMP VALIDATION
 *    - Tracks `lastProcessedTimestamp` for each outreach
 *    - Only processes messages AFTER this timestamp
 *    - Prevents reprocessing old messages
 * 
 * 4. MESSAGE ID DEDUPLICATION
 *    - Tracks all messageIds in conversationHistory
 *    - Filters out messages already in conversation
 * 
 * 5. SMART DATE RANGE
 *    - Fetches emails only AFTER the last message timestamp
 *    - Reduces unnecessary IMAP scanning
 * 
 * RESULT: Zero duplicate emails, even with:
 * - Multiple cron jobs running simultaneously
 * - Same message appearing in multiple IMAP fetches
 * - System restarts during processing
 * - Delayed email delivery
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import cron from 'node-cron';
import crypto from 'crypto';
import { db, geminiModel, firebaseAdmin } from '../core/config.js';
import { sendEmail, fetchReplies } from './emailService.js';
import {
    analyzeMarketValue,
    comparePriceAndStrategy,
    generateNegotiationEmail,
    generateDealCloseEmail,
    extractPriceFromMessage,
    extractPricingPackages,
    calculateNegotiationMetrics
} from './negotiationEngine.js';

const OUTREACH_COLLECTION = 'campaign_outreaches';

// ─── Helper: Clean undefined values from object ───────────────────────────────
function cleanUndefined(obj) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

// ─── CRITICAL: Message Deduplication System ───────────────────────────────────
/**
 * Generate unique hash for a message to prevent duplicate processing
 * @param {string} influencerId - Unique influencer identifier
 * @param {string} campaignId - Campaign ID
 * @param {string} messageText - Raw message text
 * @param {string} timestamp - Message timestamp
 * @returns {string} SHA-256 hash
 */
function generateMessageHash(influencerId, campaignId, messageText, timestamp) {
    // Normalize message text to detect duplicates even with minor variations
    const normalized = (messageText || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

    // Include timestamp to ensure uniqueness
    const composite = `${influencerId}|${campaignId}|${normalized}|${timestamp}`;
    return crypto.createHash('sha256').update(composite).digest('hex');
}

/**
 * Check if message was already processed
 * @param {Array} processedHashes - Array of previously processed message hashes
 * @param {string} hash - Current message hash
 * @returns {boolean} True if already processed
 */
function isMessageProcessed(processedHashes, hash) {
    return processedHashes && processedHashes.includes(hash);
}

/**
 * Atomic lock mechanism to prevent race conditions with stale lock detection
 * @param {Object} outreachRef - Firestore document reference
 * @returns {Promise<boolean>} True if lock acquired, false otherwise
 */
async function acquireProcessingLock(outreachRef) {
    try {
        // Atomic operation: only update if not locked or lock is stale
        const result = await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(outreachRef);
            if (!doc.exists) return false;

            const data = doc.data();

            // Check if lock exists and if it's stale (older than 2 minutes)
            if (data.isProcessingLocked) {
                const LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes (same as cron interval)
                const lockTime = data.lockAcquiredAt?.toDate?.() || null;

                if (lockTime) {
                    const lockAge = Date.now() - lockTime.getTime();
                    if (lockAge > LOCK_TIMEOUT_MS) {
                        console.log(`[Lock] ⚠️  Stale lock detected (${Math.round(lockAge / 1000)}s old) - forcing release`);
                        // Lock is stale, proceed to acquire new lock
                    } else {
                        console.log(`[Lock] Already locked - another process is handling this (${Math.round(lockAge / 1000)}s ago)`);
                        return false;
                    }
                } else {
                    // Lock exists but has no timestamp - treat as stale and force release
                    console.log('[Lock] ⚠️  Lock missing timestamp - treating as stale and forcing release');
                    // Proceed to acquire new lock below
                }
            }

            // Acquire lock (either new or replacing stale lock)
            transaction.update(outreachRef, {
                isProcessingLocked: true,
                lockAcquiredAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
            });
            return true;
        });
        return result;
    } catch (error) {
        console.error('[Lock] Error acquiring lock:', error.message);
        return false;
    }
}

/**
 * Release processing lock
 * @param {Object} outreachRef - Firestore document reference
 */
async function releaseProcessingLock(outreachRef) {
    try {
        await outreachRef.update({
            isProcessingLocked: false,
            lockReleasedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('[Lock] Error releasing lock:', error.message);
    }
}

// ─── Acceptance Detection ─────────────────────────────────────────────────────

const ACCEPTANCE_PHRASES = [
    'i accept', "i'm in", 'let\'s do it', 'deal done',
    'agreed', 'confirmed', 'ok deal', 'okk deal', 'okk done', 'ok done',
    'let\'s proceed', 'i agree', 'works for me',
    'i accept the proposal', 'i accept the offer', 'i accept your offer',
    'yes i accept', 'yes, i accept',
    'perfect deal', 'deal confirmed', 'happy to proceed',
    'happy with that', 'that works', 'that\'s fine',
    'let\'s close this', 'done deal', 'we have a deal',
    'let\'s finalize', 'let\'s move forward', 'ready to sign'
];

const QUOTE_INDICATORS = [
    'my rate', 'my commercials', 'my pricing', 'my charges',
    'are as follows', 'would be', 'packages are',
    'options are', 'deliverables', 'reel +', 'post +', 'stories',
    'can be adjusted', 'depending on', 'open to discussing'
];

const REJECTION_PHRASES = [
    'too low', 'can\'t accept', 'cannot accept', 'not possible',
    'won\'t work', 'doesn\'t work', 'not interested', 'pass on this',
    'decline', 'sorry, but', 'unfortunately'
];

/**
 * Smart acceptance detection - only true acceptance, not quotes (Fallback)
 */
function isAcceptanceFallback(text) {
    const lower = text.toLowerCase().trim();

    // Check for rejection first
    if (REJECTION_PHRASES.some(p => lower.includes(p))) {
        console.log('[Acceptance] Message contains rejection phrase - NOT an acceptance');
        return false;
    }

    // Check if it's a pricing quote (not an acceptance)
    const hasQuoteIndicator = QUOTE_INDICATORS.some(p => lower.includes(p));
    if (hasQuoteIndicator) {
        console.log('[Acceptance] Message contains pricing quote indicators - NOT an acceptance');
        return false;
    }

    // Check for actual acceptance phrases
    const hasAcceptance = ACCEPTANCE_PHRASES.some(p => lower.includes(p));
    if (hasAcceptance) {
        console.log('[Acceptance] ✅ Genuine acceptance detected!');
        return true;
    }

    console.log('[Acceptance] No clear acceptance found');
    return false;
}

/**
 * AI-powered acceptance detection
 */
async function detectAcceptanceAI(message, conversationHistory, quotedPrice, maxBudget) {
    try {
        const recentHistory = (conversationHistory || []).slice(-5).map(h => 
            `${h.role === 'inbound' ? 'Influencer' : 'Brand'}: ${h.body}`
        ).join('\n\n');

        const prompt = `
Analyze the influencer's latest message to determine if they explicitly agreed to a deal.

Recent Conversation Context:
${recentHistory || 'No previous context'}

Latest Message from Influencer:
"${message}"

Brand's Max Budget: ₹${maxBudget}
Extracted Quoted Price from message: ${quotedPrice > 0 ? '₹' + quotedPrice : 'None'}

Your task:
Determine if the influencer has formally ACCEPTED a collaboration/deal.
An acceptance means they explicitly agree to do the work at a mutually understood price.
- If they are just giving their rates/packages but haven't agreed to proceed yet, it is NOT an acceptance.
- If we proposed a price (e.g., "we can do 40k") and they replied "sounds good", "let's do it", "agreed", "done", that IS an acceptance.
- If they just say "my charges are 50k", that's a quote (negotiation), NOT an acceptance.
- If they say "I can do this for 40k, let me know", that is a quote/offer, NOT an acceptance.
- If they say "ok done at 40k" or "agreed at 40k", that IS an acceptance.
- If they simply say "done" or "deal" to our offer, that IS an acceptance.

Return ONLY a valid JSON object with this structure (no markdown, no backticks):
{
  "isDealAccepted": boolean,
  "reason": "short explanation of why"
}
`;
        const result = await geminiModel.generateContent(prompt);
        let raw = result.response.text().trim();
        
        raw = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();
        
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]);
            console.log(`[Acceptance AI] Result: ${parsed.isDealAccepted} - Reason: ${parsed.reason}`);
            return parsed.isDealAccepted === true;
        }
        
        return isAcceptanceFallback(message);
    } catch (err) {
        console.warn('[Acceptance AI] AI detection failed, falling back to manual rule:', err.message);
        return isAcceptanceFallback(message);
    }
}


async function processOutreach(outreachDoc) {
    const data = outreachDoc.data();
    const {
        influencerEmail, emailSubject,
        lastCheckedAt, outboundMessageId,
        brandName, campaignName, minBudget, maxBudget, influencerName,
        status, influencerId, campaignId,
        influencerMetrics = {}, // followers, engagementRate, niche, location
        processedMessageHashes = [], // Track processed messages
        lastProcessedTimestamp = null // Last processed message time
    } = data;

    // Use let for conversationHistory as it will be reassigned later
    let conversationHistory = data.conversationHistory || [];

    // ══╣ CRITICAL: ATOMIC LOCK ╠═══════════════════════════════════════════════
    // Prevent race conditions when multiple cron jobs run simultaneously
    console.log(`[Cron] 🔐 [${influencerName}] Attempting to acquire processing lock...`);
    const lockAcquired = await acquireProcessingLock(outreachDoc.ref);
    if (!lockAcquired) {
        console.log(`[Cron] ⏭️  [${influencerName}] Already being processed by another job - skipping`);
        return;
    }
    console.log(`[Cron] ✅ [${influencerName}] Lock acquired - proceeding with processing`);

    // IMPORTANT: Always release lock when done, even if error occurs
    try {
        console.log(`[Cron] 🔄 [${influencerName}] Starting _processOutreachLocked...`);
        const result = await _processOutreachLocked(outreachDoc, data, {
            influencerEmail, emailSubject, lastCheckedAt, outboundMessageId,
            brandName, campaignName, minBudget, maxBudget, influencerName,
            status, influencerId, campaignId, influencerMetrics,
            conversationHistory, processedMessageHashes, lastProcessedTimestamp
        });
        console.log(`[Cron] ✅ [${influencerName}] _processOutreachLocked completed`);
        return result;
    } catch (error) {
        console.error(`[Cron] ❌ [${influencerName}] Error in _processOutreachLocked:`, error.message);
        throw error; // Re-throw to ensure finally block still executes
    } finally {
        console.log(`[Cron] 🔓 [${influencerName}] Releasing lock...`);
        await releaseProcessingLock(outreachDoc.ref);
        console.log(`[Cron] ✅ [${influencerName}] Lock released successfully`);
    }
}

// ─── Main Processing Logic (Lock-Protected) ───────────────────────────────────
async function _processOutreachLocked(outreachDoc, data, {
    influencerEmail, emailSubject, lastCheckedAt, outboundMessageId,
    brandName, campaignName, minBudget, maxBudget, influencerName,
    status, influencerId, campaignId, influencerMetrics,
    conversationHistory, processedMessageHashes, lastProcessedTimestamp
}) {

    if (status === 'deal_closed') {
        console.log(`[Cron] ⏭️  Deal already closed for ${influencerName}`);
        return;
    }

    // ══╣ CAMPAIGN VALIDATION + DYNAMIC BRAND NAME ╠══════════════════════════
    // CRITICAL: Always resolve the CORRECT brand name from the campaign document.
    // The outreach document might have stale/incorrect brandName from creation time.
    // The campaign's analysisResult.brand_name is the single source of truth.
    let resolvedBrandName = brandName; // fallback to outreach's brandName
    if (campaignId) {
        try {
            const campaignRef = db.collection('user_campaigns').doc(campaignId);
            const campaignSnap = await campaignRef.get();
            if (!campaignSnap.exists) {
                console.log(`[Cron] ⏭️  Campaign deleted for ${influencerName} - skipping outreach`);
                return;
            }
            // Extract authoritative brand name from campaign
            const campaignData = campaignSnap.data();
            const campaignBrandName = campaignData?.analysisResult?.brand_name
                || campaignData?.name
                || brandName;
            if (campaignBrandName && campaignBrandName !== brandName) {
                console.log(`[Cron] 🔄 Brand name corrected: "${brandName}" → "${campaignBrandName}" (from campaign)`);
            }
            resolvedBrandName = campaignBrandName || brandName;
        } catch (err) {
            console.warn(`[Cron] ⚠️  Campaign validation error for ${influencerName}:`, err.message);
            return;
        }
    }
    // Use resolvedBrandName from here on
    const activeBrandName = resolvedBrandName || 'Our Brand';
    console.log(`[Cron] 🏷️  Active brand: "${activeBrandName}" for ${influencerName}`);

    // ══╣ CAMPAIGN ISOLATION ╠══════════════════════════════════════════════════
    // Build the set of already-processed messageIds for THIS specific campaign
    // This prevents cross-campaign mixing and duplicate processing
    const processedIds = new Set(
        conversationHistory.map(h => h.messageId).filter(Boolean)
    );

    // ══╣ IMAP SEARCH WINDOW ╠══════════════════════════════════════════════════
    // CRITICAL: Use the timestamp of the LAST message in conversation history
    // This ensures we only fetch NEW emails, not old ones from the same thread
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let sinceDate = thirtyDaysAgo;

    // Get the timestamp of the most recent message in conversation
    if (conversationHistory.length > 0) {
        const sortedHistory = [...conversationHistory].sort((a, b) => {
            const dateA = new Date(a.timestamp || 0);
            const dateB = new Date(b.timestamp || 0);
            return dateB - dateA; // Most recent first
        });
        const lastMessage = sortedHistory[0];
        if (lastMessage?.timestamp) {
            const lastMessageDate = new Date(lastMessage.timestamp);
            // Add 1 second to avoid fetching the same message again
            sinceDate = new Date(lastMessageDate.getTime() + 1000);
            console.log(`[Cron] 📅 Last message was at: ${lastMessage.timestamp}`);
            console.log(`[Cron] 📅 Will search for emails since: ${sinceDate.toISOString()}`);
        }
    } else {
        // No conversation history - use lastCheckedAt or fallback to 30 days
        if (lastCheckedAt?.toDate) {
            sinceDate = lastCheckedAt.toDate();
        } else if (typeof lastCheckedAt === 'string') {
            sinceDate = new Date(lastCheckedAt);
        }
    }

    // Safety: Don't search older than 30 days
    if (sinceDate < thirtyDaysAgo) sinceDate = thirtyDaysAgo;

    // ══╣ CRITICAL VALIDATION ╠═════════════════════════════════════════════════
    // MUST have influencer email to avoid picking up wrong emails as replies
    if (!influencerEmail || !influencerEmail.includes('@')) {
        console.error(`[Cron] ❌ Invalid influencerEmail for ${influencerName}: "${influencerEmail}" - SKIPPING to prevent false replies`);
        return;
    }

    // ══╣ FETCH EMAILS ╠════════════════════════════════════════════════════════
    const baseSubject = (emailSubject || '').replace(/^Re:\s*/i, '').trim();
    const outreachId = outreachDoc.id;
    console.log(`[Cron] 🔍 Checking ${influencerName}`);
    console.log(`[Cron]    Campaign: "${campaignName}" (ID: ${campaignId || 'N/A'})`);
    console.log(`[Cron]    Outreach ID: ${outreachId}`);
    console.log(`[Cron]    Expected sender: ${influencerEmail}`);

    let allFetched = [];
    try {
        allFetched = await fetchReplies({
            sinceDate,
            subjectContains: baseSubject,
            expectedSender: influencerEmail
        });
    } catch (e) {
        console.warn(`[Cron] ⚠️  IMAP error for ${influencerName}:`, e.message);
        return;
    }

    // ══╣ STRICT DEDUPLICATION ╠════════════════════════════════════════════════
    const strip = (s) => (s || '').replace(/^(Re:|Fwd:)\s*/gi, '').trim().toLowerCase();
    const expectedSubj = strip(baseSubject);

    const newReplies = allFetched.filter(r => {
        if (!r.messageId) {
            console.log(`[Cron] ⏭️  [${influencerName}] No messageId - skipped`);
            return false;
        }
        if (processedIds.has(r.messageId)) {
            console.log(`[Cron] ✓ [${influencerName}] Duplicate prevented: ${r.messageId.substring(0, 20)}...`);
            return false;
        }
        const replySubj = strip(r.subject);
        if (replySubj !== expectedSubj) {
            console.log(`[Cron] ⏭️  [${influencerName}] Campaign mismatch: "${r.subject}"`);
            return false;
        }
        return true;
    });

    if (newReplies.length === 0) {
        console.log(`[Cron] ✓ [${influencerName}] No new messages`);
        // Update lastCheckedAt to prevent re-scanning the same timeframe
        try {
            await outreachDoc.ref.update({
                lastCheckedAt: new Date()
            });
        } catch (e) {
            console.warn(`[Cron] ⚠️  Failed to update lastCheckedAt:`, e.message);
        }
        return;
    }

    // Process ONE reply per cycle (prevents email bursts)
    // CRITICAL: Sort by date DESCENDING to process the LATEST message first
    newReplies.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA; // newest first
    });
    console.log(`[Cron] 📬 [${influencerName}] ${newReplies.length} new repl${newReplies.length > 1 ? 'ies' : 'y'} - processing LATEST`);
    const reply = newReplies[0];

    // ══╣ DOUBLE-CHECK SENDER ╠═════════════════════════════════════════════════
    // Final safety check to ensure this reply is actually from the influencer
    if (reply.from !== influencerEmail.toLowerCase()) {
        console.error(`[Cron] ❌ CRITICAL: Reply sender mismatch!`);
        console.error(`[Cron]    Expected: ${influencerEmail}`);
        console.error(`[Cron]    Got: ${reply.from}`);
        console.error(`[Cron]    Subject: ${reply.subject}`);
        console.error(`[Cron]    SKIPPING to prevent sending wrong follow-up`);
        return;
    }
    console.log(`[Cron] ✅ Sender verified: ${reply.from}`);

    // ══╣ TIMESTAMP VALIDATION ╠════════════════════════════════════════════════
    // CRITICAL: Only process messages AFTER the last processed timestamp
    if (lastProcessedTimestamp) {
        const replyTimestamp = reply.date ? new Date(reply.date).getTime() : Date.now();
        const lastProcessed = new Date(lastProcessedTimestamp).getTime();

        if (replyTimestamp <= lastProcessed) {
            console.log(`[Cron] ⏭️  [${influencerName}] Message is older than last processed - skipping`);
            console.log(`[Cron]    Reply time: ${new Date(replyTimestamp).toISOString()}`);
            console.log(`[Cron]    Last processed: ${new Date(lastProcessed).toISOString()}`);
            return;
        }
    }

    // ══╣ MESSAGE HASH DEDUPLICATION ╠══════════════════════════════════════════
    // CRITICAL: Generate unique hash to prevent processing same message twice
    const replyTimestamp = reply.date ? reply.date.toISOString() : new Date().toISOString();
    const messageHash = generateMessageHash(
        influencerId || influencerEmail,
        campaignId || 'default',
        reply.body,
        replyTimestamp
    );

    // Check if this exact message was already processed
    if (isMessageProcessed(processedMessageHashes, messageHash)) {
        console.log(`[Cron] ⏭️  [${influencerName}] Message already processed (hash match) - SKIPPING`);
        console.log(`[Cron]    Hash: ${messageHash.substring(0, 16)}...`);
        console.log(`[Cron]    This prevents duplicate replies to the same influencer message`);
        return;
    }
    console.log(`[Cron] ✅ New message hash: ${messageHash.substring(0, 16)}... - proceeding`);

    // ══╣ IMMEDIATE DEDUPLICATION LOCK ╠════════════════════════════════════════
    // Mark this message as received IMMEDIATELY to prevent race conditions
    // This ensures parallel cron runs won't process the same message twice
    try {
        await outreachDoc.ref.update({
            conversationHistory: firebaseAdmin.firestore.FieldValue.arrayUnion({
                role: 'inbound',
                body: reply.body,
                messageId: reply.messageId,
                timestamp: reply.date?.toISOString() || new Date().toISOString(),
                isAI: false,
                processing: true // Flag to indicate we're still processing this
            }),
            lastCheckedAt: new Date()
        });
        console.log(`[Cron] 🔒 [${influencerName}] Message locked for processing: ${reply.messageId.substring(0, 20)}...`);
    } catch (lockError) {
        console.warn(`[Cron] ⚠️  [${influencerName}] Failed to lock message, skipping to prevent duplicates:`, lockError.message);
        return;
    }

    // Refresh conversationHistory after locking
    const refreshedDoc = await outreachDoc.ref.get();
    conversationHistory = refreshedDoc.data()?.conversationHistory || [];

    // ══╣ PRICE & PACKAGE EXTRACTION ╠══════════════════════════════════════════
    console.log(`[Cron] 💰 Extracting pricing packages from: "${reply.body.substring(0, 100)}..."`);

    // Extract all packages
    const pricingPackages = await extractPricingPackages(reply.body);
    let quotedPrice = 0;
    let deliverables = 'Not specified';
    let selectedPackage = null;

    if (pricingPackages.length > 0) {
        console.log(`[Cron] 📦 Found ${pricingPackages.length} package(s):`);
        pricingPackages.forEach((pkg, idx) => {
            console.log(`      ${idx + 1}. ₹${pkg.price.toLocaleString('en-IN')} - ${pkg.deliverables}`);
        });

        // Find best matching package within budget
        const withinBudget = pricingPackages.filter(pkg => pkg.price <= maxBudget);
        if (withinBudget.length > 0) {
            // Select highest-value package within budget
            selectedPackage = withinBudget.reduce((max, pkg) => pkg.price > max.price ? pkg : max, withinBudget[0]);
            console.log(`[Cron] ✅ Best package within budget: ₹${selectedPackage.price.toLocaleString('en-IN')} - ${selectedPackage.deliverables}`);
        } else {
            // All packages over budget - select lowest
            selectedPackage = pricingPackages.reduce((min, pkg) => pkg.price < min.price ? pkg : min, pricingPackages[0]);
            console.log(`[Cron] ⚠️  All packages over budget. Lowest: ₹${selectedPackage.price.toLocaleString('en-IN')} - ${selectedPackage.deliverables}`);
        }

        quotedPrice = selectedPackage.price;
        deliverables = selectedPackage.deliverables;
    } else {
        console.log(`[Cron] ℹ️  No pricing packages found in this message`);
    }

    // ══╣ MARKET VALUE ANALYSIS ╠═══════════════════════════════════════════════
    const marketValue = analyzeMarketValue({
        followers: influencerMetrics.followers || 50000,
        engagementRate: influencerMetrics.engagementRate || 3.5,
        niche: influencerMetrics.niche || '',
        location: influencerMetrics.location || ''
    });

    console.log(`[Cron] 📊 Market Analysis:
  - Market Range: ₹${marketValue.estimatedMin.toLocaleString('en-IN')} - ₹${marketValue.estimatedMax.toLocaleString('en-IN')}
  - Position: ${marketValue.marketPosition}
  - Brand Budget: ₹${minBudget.toLocaleString('en-IN')} - ₹${maxBudget.toLocaleString('en-IN')}`);

    // ══╣ DEAL ACCEPTANCE CHECK ╠═══════════════════════════════════════════════
    const dealAccepted = await detectAcceptanceAI(reply.body, conversationHistory, quotedPrice, maxBudget);

    let replyText;
    let newStatus = status;
    let analyticsData = {};

    if (dealAccepted) {
        // ═══════════════════════════════════════════════════════════════════════
        // ║                        DEAL CLOSED                                 ║
        // ═══════════════════════════════════════════════════════════════════════
        console.log(`[Cron] 🎉🎉🎉 DEAL ACCEPTED by ${influencerName}! 🎉🎉🎉`);
        newStatus = 'deal_closed';

        // Determine final price from last negotiated offer or quoted price
        let finalPrice = quotedPrice > 0 ? quotedPrice : Math.round((minBudget + maxBudget) / 2);
        let finalDeliverables = deliverables;

        // Check if we made an offer in our last message
        const lastOutbound = conversationHistory
            .filter(h => h.role === 'outbound')
            .slice(-1)[0];

        if (lastOutbound && lastOutbound.negotiatedPrice) {
            finalPrice = lastOutbound.negotiatedPrice;
            finalDeliverables = lastOutbound.deliverables || deliverables;
            console.log(`[Cron] 📌 Using last negotiated offer: ₹${finalPrice.toLocaleString('en-IN')} - ${finalDeliverables}`);
        } else if (selectedPackage) {
            finalPrice = selectedPackage.price;
            finalDeliverables = selectedPackage.deliverables;
            console.log(`[Cron] 📌 Using selected package: ₹${finalPrice.toLocaleString('en-IN')} - ${finalDeliverables}`);
        }

        console.log(`[Cron] 📝 Generating professional deal confirmation email...`);
        replyText = await generateDealCloseEmail({
            influencerName,
            brandName: activeBrandName,
            campaignName,
            finalPrice,
            deliverables: finalDeliverables,
            acceptanceMessage: reply.body,
            conversationHistory
        });

        // Calculate negotiation metrics
        const initialAsk = conversationHistory.find(h => h.influencerPrice)?.influencerPrice || finalPrice;
        const metrics = calculateNegotiationMetrics(conversationHistory, finalPrice, initialAsk, maxBudget);

        analyticsData = {
            finalPrice,
            initialAsk,
            metrics,
            closedAt: new Date().toISOString(),
            dealStatus: 'confirmed'
        };

        console.log(`[Cron] 📈 Deal Metrics:
  - Final Price: ₹${finalPrice.toLocaleString('en-IN')}
  - Initial Ask: ₹${initialAsk.toLocaleString('en-IN')}
  - Discount: ${metrics.discountAchieved}
  - Budget Used: ${metrics.budgetUtilization}
  - Time to Close: ${metrics.timeToClose}
  - Total Rounds: ${metrics.totalRounds}`);

    } else {
        // ═══════════════════════════════════════════════════════════════════════
        // ║                    NEGOTIATION CONTINUES                           ║
        // ═══════════════════════════════════════════════════════════════════════
        newStatus = 'negotiating';

        let negotiationStrategy;
        if (quotedPrice > 0) {
            // Price was quoted - analyze and strategize
            negotiationStrategy = comparePriceAndStrategy({
                askingPrice: quotedPrice,
                marketValue,
                brandMin: minBudget,
                brandMax: maxBudget
            });

            // Enhance reasoning with package information
            let enhancedReasoning = negotiationStrategy.reasoning;
            if (pricingPackages.length > 1) {
                const packageList = pricingPackages.map(p =>
                    `₹${p.price.toLocaleString('en-IN')} (${p.deliverables})`
                ).join(', ');
                enhancedReasoning += ` Influencer offered ${pricingPackages.length} packages: ${packageList}. Selected best fit: ₹${quotedPrice.toLocaleString('en-IN')} (${deliverables}).`;
            } else if (deliverables !== 'Not specified') {
                enhancedReasoning += ` Deliverables: ${deliverables}.`;
            }
            negotiationStrategy.reasoning = enhancedReasoning;

            console.log(`[Cron] 🎯 Negotiation Strategy:
  - Asking Price: ₹${quotedPrice.toLocaleString('en-IN')}
  - Deliverables: ${deliverables}
  - Packages Offered: ${pricingPackages.length}
  - Assessment: ${negotiationStrategy.priceAssessment}
  - Budget Fit: ${negotiationStrategy.budgetFit}
  - Strategy: ${negotiationStrategy.strategy}
  - Target Offer: ₹${negotiationStrategy.targetPrice.toLocaleString('en-IN')}
  - Approach: ${negotiationStrategy.approach}
  - Reasoning: ${negotiationStrategy.reasoning}`);
        } else {
            // No price mentioned - check if we already requested it
            const lastOutbound = conversationHistory
                .filter(h => h.role === 'outbound')
                .slice(-1)[0];

            const alreadyAskedForPrice = lastOutbound?.body && (
                lastOutbound.body.toLowerCase().includes('rate') ||
                lastOutbound.body.toLowerCase().includes('price') ||
                lastOutbound.body.toLowerCase().includes('pricing') ||
                lastOutbound.body.toLowerCase().includes('commercial') ||
                lastOutbound.body.toLowerCase().includes('quote')
            );

            if (alreadyAskedForPrice) {
                // We already asked for price - send acknowledgment and wait
                negotiationStrategy = {
                    strategy: 'acknowledge_interest',
                    targetPrice: Math.round((minBudget + maxBudget) / 2),
                    approach: 'polite_reminder',
                    marketRange: `₹${marketValue.estimatedMin.toLocaleString('en-IN')} - ₹${marketValue.estimatedMax.toLocaleString('en-IN')}`,
                    reasoning: 'Already requested pricing. Acknowledge interest and gently remind.',
                    incomingMessage: reply.body
                };
                console.log(`[Cron] ℹ️  Already asked for price - will send polite acknowledgment`);
            } else {
                // First time - request their quote
                negotiationStrategy = {
                    strategy: 'ask_price',
                    targetPrice: Math.round((minBudget + maxBudget) / 2),
                    approach: 'inquiry',
                    marketRange: `₹${marketValue.estimatedMin.toLocaleString('en-IN')} - ₹${marketValue.estimatedMax.toLocaleString('en-IN')}`,
                    reasoning: 'No price quoted yet. Professional inquiry for commercial rates.'
                };
                console.log(`[Cron] ℹ️  No price quoted - will request their commercial rates`);
            }
        }

        const roundNumber = conversationHistory.filter(h => h.role === 'outbound').length + 1;

        console.log(`[Cron] ✍️  Generating unique negotiation email (Round ${roundNumber})...`);
        replyText = await generateNegotiationEmail({
            influencerName,
            brandName: activeBrandName,
            campaignName,
            strategy: negotiationStrategy.strategy,
            targetPrice: negotiationStrategy.targetPrice,
            approach: negotiationStrategy.approach,
            marketRange: negotiationStrategy.marketRange,
            reasoning: negotiationStrategy.reasoning,
            conversationHistory,
            incomingMessage: reply.body,
            roundNumber
        });

        analyticsData = cleanUndefined({
            lastPrice: quotedPrice > 0 ? quotedPrice : null,
            negotiationStrategy: negotiationStrategy.strategy,
            roundNumber,
            priceAssessment: negotiationStrategy.priceAssessment || null,
            targetOffer: negotiationStrategy.targetPrice
        });
    }

    // ══╣ SEND EMAIL ╠══════════════════════════════════════════════════════════
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
        console.log(`[Cron] 📤 [${influencerName}] ${dealAccepted ? '🎊 DEAL CONFIRMATION' : 'Negotiation reply'} sent → ${sentMessageId}`);
    } catch (e) {
        console.warn(`[Cron] ⚠️  [${influencerName}] Email send failed:`, e.message);
        console.log(`[Cron] ℹ️  Continuing with database update to prevent reprocessing`);
    }

    // ══╣ UPDATE DATABASE ╠═════════════════════════════════════════════════════
    // Update the inbound message we locked earlier + add our outbound response
    const updatedHistory = conversationHistory.map(h => {
        // Find and finalize the message we marked as processing
        if (h.messageId === reply.messageId && h.processing) {
            // Remove processing flag by destructuring it out
            const { processing, ...cleanMessage } = h;
            return cleanUndefined({
                ...cleanMessage,
                influencerPrice: quotedPrice > 0 ? quotedPrice : null,
                pricingPackages: pricingPackages.length > 0 ? pricingPackages : null,
                deliverables: deliverables !== 'Not specified' ? deliverables : null
            });
        }
        return h;
    });

    // Add our outbound response with negotiation details
    updatedHistory.push(cleanUndefined({
        role: 'outbound',
        body: replyText,
        messageId: sentMessageId,
        timestamp: new Date().toISOString(),
        isAI: true,
        isDealClose: dealAccepted,
        negotiatedPrice: dealAccepted ? (analyticsData.finalPrice || null) : (analyticsData.targetOffer || null),
        deliverables: dealAccepted ? deliverables : null,
        ...analyticsData
    }));

    const updateData = {
        conversationHistory: updatedHistory,
        status: newStatus,
        lastCheckedAt: new Date(),
        lastReplyAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        messagesCount: updatedHistory.length,
        // CRITICAL: Add message hash to prevent duplicate processing
        processedMessageHashes: firebaseAdmin.firestore.FieldValue.arrayUnion(messageHash),
        // CRITICAL: Update last processed timestamp
        lastProcessedTimestamp: replyTimestamp,
    };

    // Add deal-specific data
    if (dealAccepted) {
        updateData.dealMetrics = analyticsData;
        updateData.dealConfirmedAt = firebaseAdmin.firestore.FieldValue.serverTimestamp();
    }

    // Track last quoted price
    if (quotedPrice > 0) {
        updateData.lastQuotedPrice = quotedPrice;
        updateData.priceHistory = firebaseAdmin.firestore.FieldValue.arrayUnion({
            price: quotedPrice,
            timestamp: new Date().toISOString()
        });
    }

    await outreachDoc.ref.update(updateData);

    // ══╣ PROCESSING SUMMARY ╠══════════════════════════════════════════════════
    console.log(`\n[Cron] ═══════════════════════════════════════════════════════`);
    console.log(`[Cron] ✅ [${influencerName}] Processing Complete`);
    console.log(`[Cron] ═══════════════════════════════════════════════════════`);
    console.log(`   Campaign: ${campaignName}`);
    console.log(`   Brand: ${activeBrandName}`);
    console.log(`   Action: ${dealAccepted ? '🎊 DEAL CLOSED' : '💬 Negotiation Reply Sent'}`);
    console.log(`   Status: ${status} → ${newStatus}`);
    console.log(`   Total Messages: ${updatedHistory.length}`);
    if (pricingPackages.length > 0) {
        console.log(`   Packages Received: ${pricingPackages.length}`);
        console.log(`   Selected Package: ₹${quotedPrice.toLocaleString('en-IN')} - ${deliverables}`);
    }
    if (dealAccepted && analyticsData.finalPrice) {
        console.log(`   Final Deal Price: ₹${analyticsData.finalPrice.toLocaleString('en-IN')}`);
        console.log(`   Deliverables: ${deliverables}`);
    }
    console.log(`   Message Hash: ${messageHash.substring(0, 16)}...`);
    console.log(`   Processed At: ${new Date().toLocaleTimeString()}`);
    console.log(`[Cron] ═══════════════════════════════════════════════════════\n`);
}

// ─── Cron Scheduler ────────────────────────────────────────────────────────────

export function startNegotiationCron() {
    const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    if (!hasGmail) {
        console.warn('[NegotiationCron] ⚠️  GMAIL_USER/GMAIL_APP_PASSWORD not set. Automation disabled.');
        console.warn('[NegotiationCron] ℹ️  System will work in demo mode only.');
        return;
    }

    console.log('[NegotiationCron] ✅ Enterprise Negotiation Engine Started');
    console.log('[NegotiationCron] ⏰ Checking emails every 2 minutes');
    console.log('[NegotiationCron] 🎯 Features: Market Analysis | Dynamic Strategy | Unique Emails | Campaign Isolation');

    cron.schedule('*/2 * * * *', async () => {
        try {
            if (!db) {
                console.warn('[NegotiationCron] ⚠️  Database not initialized');
                return;
            }

            const snapshot = await db.collection(OUTREACH_COLLECTION)
                .where('status', 'in', ['sent', 'negotiating'])
                .get();

            if (snapshot.empty) {
                return; // No active negotiations
            }

            const activeCount = snapshot.docs.length;
            console.log(`\n[NegotiationCron] ═══════════════════════════════════════════`);
            console.log(`[NegotiationCron] 🔄 Checking ${activeCount} active campaign${activeCount > 1 ? 's' : ''}...`);
            console.log(`[NegotiationCron] ═══════════════════════════════════════════\n`);

            for (const doc of snapshot.docs) {
                try {
                    await processOutreach(doc);
                } catch (error) {
                    console.error(`[NegotiationCron] ❌ Error processing outreach:`, error.message);
                    // Continue to next outreach even if one fails
                }
            }

            console.log(`\n[NegotiationCron] ✅ Cycle complete\n`);
        } catch (err) {
            console.error('[NegotiationCron] ❌ Cycle error:', err.message);
        }
    });
}

// ─── Manual Trigger (for testing) ─────────────────────────────────────────────

export async function simulateNegotiationRound(outreachDoc) {
    console.log('[Manual] 🔧 Manual trigger initiated');
    await processOutreach(outreachDoc);
}

export default {
    startNegotiationCron,
    simulateNegotiationRound
};
