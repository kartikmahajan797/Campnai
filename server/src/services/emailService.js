import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';

// ─── SMTP Transport ────────────────────────────────────────────────────────────

function createTransport() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

export async function sendEmail({ to, subject, body, replyToMessageId, inReplyTo }) {
    const transport = createTransport();
    const mailOptions = {
        from: `Campnai <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text: body,
        headers: {},
    };
    if (inReplyTo) mailOptions.headers['In-Reply-To'] = inReplyTo;
    if (replyToMessageId) mailOptions.headers['References'] = replyToMessageId;
    const info = await transport.sendMail(mailOptions);
    console.log(`[EmailService] ✉️  Sent to ${to} — msgId: ${info.messageId}`);
    return { messageId: info.messageId };
}

// ─── Body extractor ────────────────────────────────────────────────────────────

function extractBody(rawSource) {
    if (!rawSource) return '';
    const raw = rawSource.toString('utf8');

    const headerBodySplit = raw.indexOf('\r\n\r\n');
    if (headerBodySplit === -1) return raw.substring(0, 1000).trim();

    const headers = raw.substring(0, headerBodySplit).toLowerCase();
    let body = raw.substring(headerBodySplit + 4);

    // Decode quoted-printable
    body = body.replace(/=\r\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16))
    );

    // If multipart — extract first text/plain part
    const boundaryMatch = headers.match(/boundary="?([^";\r\n]+)"?/);
    if (boundaryMatch) {
        const boundary = boundaryMatch[1].trim();
        const parts = body.split(`--${boundary}`);
        for (const part of parts) {
            const lp = part.toLowerCase();
            if (lp.includes('content-type: text/plain') || lp.includes('content-type:text/plain')) {
                const partBody = part.substring(part.indexOf('\r\n\r\n') + 4);
                return partBody.replace(/\r\n/g, '\n').trim().substring(0, 2000);
            }
        }
    }

    // Plain body — strip quoted reply lines
    const lines = body.replace(/\r\n/g, '\n').split('\n');
    const cleanLines = [];
    for (const line of lines) {
        if (line.startsWith('>') || (line.startsWith('On ') && line.includes('wrote:'))) break;
        cleanLines.push(line);
    }
    return cleanLines.join('\n').trim().substring(0, 2000);
}

// ─── Core IMAP fetch (shared) ──────────────────────────────────────────────────

async function _doImapFetch({ subjectContains, since, debugAll = false }) {
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
        logger: false,
    });

    const results = [];
    const skipped = { own: 0, subject: 0 };

    console.log(`[EmailService] 🔍 IMAP search since: ${since.toISOString()}, subject contains: "${subjectContains}"`);

    try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
            // ── UID search ──
            const uids = await client.search({ since }, { uid: true });
            console.log(`[EmailService] Found ${uids.length} UIDs in INBOX since ${since.toISOString()}`);

            if (uids.length === 0) return { results, skipped };

            // Take last 100 (newest) — use UID mode in fetch
            const fetchUids = uids.slice(-100);

            for await (const msg of client.fetch(
                fetchUids,
                { uid: true, envelope: true, source: true },
                { uid: true }   // ← Treat range as UIDs, NOT sequence numbers
            )) {
                try {
                    const { from, subject: subj, messageId, inReplyTo, date } = msg.envelope;
                    const fromAddr = (from?.[0]?.address || '').toLowerCase();
                    const subjectStr = subj || '';
                    const msgId = messageId || '';
                    const ownEmail = (process.env.GMAIL_USER || '').toLowerCase();

                    // Debug: log ALL non-own messages when asked
                    if (debugAll && fromAddr !== ownEmail) {
                        console.log(`[EmailService] 📨 Non-own: from="${fromAddr}", subj="${subjectStr}"`);
                    }

                    // Skip our own outbound emails
                    if (fromAddr === ownEmail) {
                        skipped.own++;
                        continue;
                    }

                    // Subject filter
                    const strip = (s) => (s || '').replace(/^(Re:|Fwd:)\s*/gi, '').trim().toLowerCase();
                    const normSubj = strip(subjectStr);
                    const normKey = strip(subjectContains);

                    if (subjectContains && !normSubj.includes(normKey)) {
                        skipped.subject++;
                        continue;
                    }

                    const body = extractBody(msg.source);
                    if (!body) {
                        console.warn(`[EmailService] ⚠️  Empty body for: "${subjectStr}"`);
                        continue;
                    }

                    console.log(`[EmailService] ✅ Match: from=${fromAddr}, subj="${subjectStr}", body[0..80]="${body.substring(0, 80)}"`);
                    results.push({ from: fromAddr, subject: subjectStr, body, messageId: msgId, inReplyTo, date });
                } catch (msgErr) {
                    console.warn('[EmailService] ⚠️  parse error:', msgErr.message);
                }
            }
        } finally {
            lock.release();
        }
    } catch (err) {
        console.error('[EmailService] ❌ IMAP error:', err.message);
    } finally {
        try { await client.logout(); } catch (_) {}
    }

    console.log(`[EmailService] Result: ${results.length} matched, ${skipped.own} skipped(own), ${skipped.subject} skipped(subject)`);
    return { results, skipped };
}

// ─── Public: fetchReplies ─────────────────────────────────────────────────────

export async function fetchReplies({ sinceDate, subjectContains }) {
    // Always look back 72h minimum — don't miss replies due to timestamp drift
    const minLookback = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const since = (sinceDate && new Date(sinceDate) < minLookback)
        ? new Date(sinceDate)
        : minLookback;

    const { results } = await _doImapFetch({ subjectContains, since });
    return results;
}

// ─── Public: debugFetchAll — for /test-imap endpoint ─────────────────────────

export async function debugFetchAll() {
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
    return _doImapFetch({ subjectContains: null, since, debugAll: true });
}
