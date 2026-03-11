/**
 * Output Sanitization Utilities
 * 
 * Provides safe encoding and sanitization for output to prevent:
 * - XSS attacks via error messages
 * - Information disclosure through stack traces
 * - Injection attacks through unescaped user input in responses
 */

/**
 * Sanitize error messages for client-facing responses
 * Removes stack traces and sensitive internals
 * 
 * @param {Error|string} error - Error object or message
 * @param {boolean} isDev - Whether in development mode
 * @returns {string} Sanitized error message
 */
export function sanitizeErrorMessage(error, isDev = false) {
    if (typeof error === "string") {
        return sanitizeString(error);
    }

    if (error instanceof Error) {
        // In development, show full error details
        if (isDev) {
            return {
                message: sanitizeString(error.message),
                stack: error.stack?.split("\n").slice(0, 5).join("\n"), // Limit stack trace
                name: error.name,
            };
        }

        // In production, show only safe generic messages
        const safeMessages = {
            ValidationError: "Invalid input provided",
            UnauthorizedError: "Authentication required",
            ForbiddenError: "Access denied",
            NotFoundError: "Resource not found",
            RateLimitError: "Too many requests",
            DatabaseError: "An error occurred while processing your request",
            NetworkError: "A network error occurred",
        };

        return safeMessages[error.name] || "An unexpected error occurred";
    }

    return "An unexpected error occurred";
}

/**
 * Sanitize string to prevent XSS in JSON responses
 * Note: Express automatically encodes JSON, but this adds extra safety
 * 
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
    if (typeof str !== "string") return String(str);

    // Remove potential script tags and dangerous patterns
    return str
        .replace(/<script[^>]*>.*?<\/script>/gis, "")
        .replace(/<iframe[^>]*>.*?<\/iframe>/gis, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim()
        .slice(0, 500); // Limit length
}

/**
 * Sanitize object for output - recursively clean all string values
 * 
 * @param {object} obj - Input object
 * @param {number} depth - Current recursion depth (max 5)
 * @returns {object} Sanitized object
 */
export function sanitizeObject(obj, depth = 0) {
    if (depth > 5) return "[Max depth reached]";
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === "string") {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.slice(0, 100).map((item) => sanitizeObject(item, depth + 1));
    }

    if (typeof obj === "object") {
        const sanitized = {};
        const sensitiveKeys = ["password", "token", "secret", "apiKey", "privateKey", "sessionId", "ssn", "credit_card"];

        for (const [key, value] of Object.entries(obj)) {
            // Redact sensitive keys
            if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
                sanitized[key] = "[REDACTED]";
            } else {
                sanitized[key] = sanitizeObject(value, depth + 1);
            }
        }

        return sanitized;
    }

    return obj;
}

/**
 * Create a safe error response object for API responses
 * 
 * @param {Error|string} error - Error object or message
 * @param {number} statusCode - HTTP status code
 * @param {object} metadata - Optional additional metadata
 * @returns {object} Safe response object
 */
export function createSafeErrorResponse(error, statusCode = 500, metadata = {}) {
    const isDev = process.env.NODE_ENV !== "production";

    const response = {
        success: false,
        error: {
            message: typeof error === "string" ? sanitizeString(error) : sanitizeErrorMessage(error, isDev),
            code: statusCode,
        },
    };

    // Only include metadata in development or for specific safe fields
    if (isDev && metadata) {
        response.error.metadata = sanitizeObject(metadata);
    } else if (metadata?.timestamp || metadata?.requestId) {
        response.error.metadata = {
            timestamp: metadata.timestamp,
            requestId: metadata.requestId,
        };
    }

    return response;
}

/**
 * HTML encode string for use in HTML context
 * (Though this backend is JSON API, useful for email templates)
 * 
 * @param {string} str - Input string
 * @returns {string} HTML-encoded string
 */
export function htmlEncode(str) {
    if (typeof str !== "string") return String(str);

    const htmlEntities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;",
    };

    return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char]);
}

/**
 * Validate and sanitize user input for database queries
 * Additional layer on top of mongo-sanitize
 * 
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
    if (typeof input !== "string") return input;

    return input
        .replace(/[\$\{\}]/g, "") // Remove MongoDB operators
        .replace(/[;<>]/g, "") // Remove potential injection chars
        .trim()
        .slice(0, 1000); // Reasonable length limit
}

export default {
    sanitizeErrorMessage,
    sanitizeString,
    sanitizeObject,
    createSafeErrorResponse,
    htmlEncode,
    sanitizeInput,
};
