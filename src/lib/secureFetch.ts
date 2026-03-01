/**
 * Secure API client for Campnai.
 * 
 * - Automatically attaches Firebase Bearer token (backward compat)
 * - Sends cookies with every request (credentials: 'include')
 * - Attaches CSRF token to state-changing requests (POST/PUT/PATCH/DELETE)
 */
import { auth } from '../firebaseConfig';

/** Get Firebase ID token for current user */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated. Please sign in.');
  return user.getIdToken();
}

/** Get the stored CSRF token */
function getCSRFToken(): string {
  return localStorage.getItem('csrfToken') || '';
}

/** Methods that change state and need CSRF protection */
const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

interface SecureFetchOptions extends RequestInit {
  /** Skip auth header (for public endpoints) */
  skipAuth?: boolean;
  /** Skip CSRF header */
  skipCSRF?: boolean;
}

/**
 * Secure fetch wrapper.
 * 
 * Usage:
 *   const res = await secureFetch('/api/v1/campaigns', { method: 'POST', body: ... });
 */
export async function secureFetch(
  url: string,
  options: SecureFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, skipCSRF = false, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();

  // Build headers
  const headers = new Headers(fetchOptions.headers || {});

  // Auth: attach Firebase Bearer token
  if (!skipAuth) {
    try {
      const token = await getAuthToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // If no auth, let the request proceed (cookies may be enough)
    }
  }

  // CSRF: attach token for mutations
  if (!skipCSRF && MUTATION_METHODS.includes(method)) {
    const csrf = getCSRFToken();
    if (csrf) {
      headers.set('x-csrf-token', csrf);
    }
  }

  // Content-Type default
  if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...fetchOptions,
    method,
    headers,
    credentials: 'include', // Always send cookies
  });
}
