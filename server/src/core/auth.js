import { firebaseAdmin } from "./config.js";

/**
 * Express middleware – verifies Firebase ID token from Authorization header.
 * Attaches decoded user to req.user on success.
 */
export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ detail: "Missing or invalid Authorization header." });
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        const decoded = await firebaseAdmin.auth().verifyIdToken(token);
        req.user = decoded; 
        next();
    } catch (err) {
        console.error("Authentication Error:", err); // Log the error for debugging

        const code = err.code || "";

        if (code === "auth/id-token-expired") {
            return res.status(401).json({ detail: "Token has expired. Please sign in again." });
        }
        if (code === "auth/id-token-revoked") {
            return res.status(401).json({ detail: "Token has been revoked. Please sign in again." });
        }
        if (code === "auth/argument-error" || code === "auth/invalid-id-token") {
            return res.status(401).json({ detail: "Invalid authentication token." });
        }

        return res.status(401).json({ detail: "Authentication failed." });
    }
}
