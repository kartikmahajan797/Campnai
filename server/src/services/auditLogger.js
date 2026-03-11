/**
 * Audit Logging Service
 * 
 * Provides secure, comprehensive logging for security-critical events.
 * - Logs to console in structured format (can be extended to file/external service)
 * - Sanitizes sensitive data before logging
 * - Tracks authentication, authorization, and data access events
 */

import { redisClient } from "../config/redis.js";

const AUDIT_LOG_PREFIX = "audit:log:";
const AUDIT_LOG_TTL = 7 * 24 * 60 * 60; // 7 days retention

// Event types
export const AuditEventType = {
    // Authentication
    LOGIN_SUCCESS: "auth.login.success",
    LOGIN_FAILURE: "auth.login.failure",
    LOGOUT: "auth.logout",
    TOKEN_REFRESH: "auth.token.refresh",
    PASSWORD_RESET_REQUEST: "auth.password.reset.request",
    PASSWORD_RESET_COMPLETE: "auth.password.reset.complete",
    OTP_SENT: "auth.otp.sent",
    OTP_VERIFIED: "auth.otp.verified",
    OTP_FAILED: "auth.otp.failed",

    // Authorization
    ACCESS_DENIED: "authz.access.denied",
    PERMISSION_VIOLATION: "authz.permission.violation",

    // Data Access
    CAMPAIGN_CREATED: "data.campaign.created",
    CAMPAIGN_UPDATED: "data.campaign.updated",
    CAMPAIGN_DELETED: "data.campaign.deleted",
    REPORT_GENERATED: "data.report.generated",
    OUTREACH_SENT: "data.outreach.sent",

    // Security
    CSRF_VIOLATION: "security.csrf.violation",
    RATE_LIMIT_EXCEEDED: "security.rate_limit.exceeded",
    INVALID_TOKEN: "security.token.invalid",
    SESSION_EXPIRED: "security.session.expired",
    SUSPICIOUS_ACTIVITY: "security.suspicious.activity",
};

/**
 * Sanitize user object to remove sensitive fields
 */
function sanitizeUser(user) {
    if (!user) return null;

    const { password, ...safe } = user;
    return {
        uid: user.uid || user._id || user.id || "unknown",
        email: maskEmail(user.email),
    };
}

/**
 * Mask email to show only first char and domain
 */
function maskEmail(email) {
    if (!email || typeof email !== "string") return "unknown";
    const [local, domain] = email.split("@");
    if (!domain) return "invalid";
    return `${local[0]}***@${domain}`;
}

/**
 * Sanitize req object to remove sensitive data
 */
function sanitizeRequest(req) {
    if (!req) return null;

    return {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.get("user-agent"),
    };
}

/**
 * Log an audit event
 * 
 * @param {string} eventType - Event type from AuditEventType
 * @param {object} options - Additional context
 * @param {object} options.user - User object (will be sanitized)
 * @param {object} options.req - Express request object (will be sanitized)
 * @param {object} options.metadata - Additional metadata (will NOT be sanitized - use carefully)
 * @param {string} options.severity - 'info' | 'warning' | 'error' | 'critical'
 */
export async function logAuditEvent(eventType, options = {}) {
    const {
        user = null,
        req = null,
        metadata = {},
        severity = "info",
    } = options;

    const timestamp = new Date().toISOString();
    const auditEntry = {
        timestamp,
        eventType,
        severity,
        user: sanitizeUser(user),
        request: sanitizeRequest(req),
        metadata: sanitizeMeasurements(metadata),
    };

    // Log to console in production-safe format
    const logLine = JSON.stringify(auditEntry);

    switch (severity) {
        case "critical":
        case "error":
            console.error(`[AUDIT] ${logLine}`);
            break;
        case "warning":
            console.warn(`[AUDIT] ${logLine}`);
            break;
        default:
            console.info(`[AUDIT] ${logLine}`);
    }

    // Store in Redis for short-term analysis (7 days)
    try {
        const logKey = `${AUDIT_LOG_PREFIX}${timestamp}:${eventType}`;
        await redisClient.set(logKey, logLine, { EX: AUDIT_LOG_TTL });
    } catch (err) {
        console.error("[AUDIT] Failed to store audit log in Redis:", err.message);
    }
}

/**
 * Sanitize metadata to remove sensitive values
 */
function sanitizeMeasurements(metadata) {
    if (!metadata || typeof metadata !== "object") return metadata;

    const sanitized = { ...metadata };
    const sensitiveKeys = ["password", "token", "secret", "apiKey", "privateKey", "otp"];

    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
            sanitized[key] = "[REDACTED]";
        }
    }

    return sanitized;
}

/**
 * Get recent audit logs for a user (for security dashboard)
 * 
 * @param {string} userId - User ID
 * @param {number} limit - Max number of logs to return
 */
export async function getUserAuditLogs(userId, limit = 50) {
    try {
        const pattern = `${AUDIT_LOG_PREFIX}*`;
        const keys = await redisClient.keys(pattern);

        const logs = [];
        for (const key of keys.slice(0, limit * 2)) { // Fetch more to filter
            const logData = await redisClient.get(key);
            if (logData) {
                const log = JSON.parse(logData);
                if (log.user?.uid === userId) {
                    logs.push(log);
                    if (logs.length >= limit) break;
                }
            }
        }

        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (err) {
        console.error("[AUDIT] Failed to fetch user audit logs:", err.message);
        return [];
    }
}

/**
 * Express middleware to automatically log failed authorization attempts
 */
export function auditAuthFailureMiddleware(req, res, next) {
    const originalStatus = res.status.bind(res);

    res.status = function (code) {
        if (code === 401 || code === 403) {
            logAuditEvent(
                code === 401 ? AuditEventType.INVALID_TOKEN : AuditEventType.ACCESS_DENIED,
                {
                    user: req.user,
                    req,
                    severity: "warning",
                    metadata: { statusCode: code },
                }
            );
        }
        return originalStatus(code);
    };

    next();
}

export default {
    logAuditEvent,
    getUserAuditLogs,
    auditAuthFailureMiddleware,
    AuditEventType,
};
