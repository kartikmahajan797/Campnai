/**
 * Re-export the dual-auth middleware from the new security layer.
 * Supports both JWT cookie auth AND Firebase Bearer auth for backward compatibility.
 *
 * All existing imports of `authenticate` from this file will continue to work.
 */
export { authenticate } from "../middleware/auth.middleware.js";
