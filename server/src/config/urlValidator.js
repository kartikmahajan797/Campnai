import { URL } from "url";
import dns from "dns/promises";

// ─── Private/Internal IP Ranges ─────────────────────────────────────
const BLOCKED_IP_PATTERNS = [
  /^127\./,            // Loopback
  /^10\./,             // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./,       // Class C private
  /^169\.254\./,       // Link-local / AWS metadata
  /^0\./,              // Current network
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./, // Carrier-grade NAT
  /^::1$/,             // IPv6 loopback
  /^fc00:/i,           // IPv6 private
  /^fe80:/i,           // IPv6 link-local
];

/**
 * Validate a user-supplied URL to prevent SSRF.
 * - Only allows http/https protocols
 * - Resolves hostname and blocks private/internal IPs
 * - Blocks common cloud metadata endpoints
 * 
 * @param {string} input - Raw URL string from user
 * @returns {string} Validated URL string
 * @throws {Error} If URL is blocked
 */
export async function validateUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Only allow HTTP/HTTPS
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }

  // Block obvious metadata hostnames
  const blockedHosts = [
    "metadata.google.internal",
    "metadata.google.com",
    "169.254.169.254",
  ];
  if (blockedHosts.includes(url.hostname.toLowerCase())) {
    throw new Error("Access to internal services is blocked");
  }

  // Resolve hostname → IP and check against blocked ranges
  try {
    const { address } = await dns.lookup(url.hostname);
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(address)) {
        throw new Error("Access to internal/private addresses is blocked");
      }
    }
  } catch (err) {
    if (err.message.includes("blocked")) throw err;
    throw new Error(`Cannot resolve hostname: ${url.hostname}`);
  }

  return url.href;
}
