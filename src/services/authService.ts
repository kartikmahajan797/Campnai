import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';

// Auth API base (separate from main API routes)
const AUTH_BASE_URL = API_BASE_URL.replace('/api/v1', '/api/v1/auth');

/**
 * Frontend Auth Service
 * 
 * After Firebase authentication (Google/Email), this service calls the backend
 * to establish a JWT cookie-based session with Redis storage, CSRF tokens, etc.
 * 
 * Flow:
 * 1. User authenticates via Firebase (Google popup / email+password)
 * 2. Frontend gets Firebase ID token
 * 3. Calls POST /api/v1/auth/google-auth with the ID token
 * 4. Backend verifies token, creates Redis session, sets HTTP-only JWT cookies
 * 5. Returns CSRF token + session info
 */
export const AuthService = {

  /**
   * Establish backend session after Firebase auth.
   * Call this AFTER successful Firebase login/signup.
   */
  async establishSession(): Promise<{
    csrfToken: string;
    sessionId: string;
    user: any;
  } | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('[AuthService] No Firebase user found');
        return null;
      }

      const idToken = await user.getIdToken(true);

      const response = await fetch(`${AUTH_BASE_URL}/google-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Required for cookies
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AuthService] Session establishment failed:', errorData);
        return null;
      }

      const data = await response.json();
      console.log('[AuthService] ✅ Backend session established:', data.sessionInfo?.sessionId);

      // Store CSRF token for state-changing requests
      if (data.sessionInfo?.csrfToken) {
        localStorage.setItem('csrfToken', data.sessionInfo.csrfToken);
      }

      return {
        csrfToken: data.sessionInfo?.csrfToken,
        sessionId: data.sessionInfo?.sessionId,
        user: data.user,
      };
    } catch (error) {
      console.error('[AuthService] Error establishing session:', error);
      return null;
    }
  },

  /**
   * Refresh the access token using the refresh token cookie.
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);
      return false;
    }
  },

  /**
   * Logout: revoke tokens, clear Redis session, clear cookies.
   */
  async logout(): Promise<void> {
    try {
      const csrfToken = localStorage.getItem('csrfToken');

      await fetch(`${AUTH_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken || '',
        },
        credentials: 'include',
      });

      localStorage.removeItem('csrfToken');
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
    }
  },

  /**
   * Refresh the CSRF token.
   */
  async refreshCSRF(): Promise<string | null> {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/refresh-csrf`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.csrfToken) {
        localStorage.setItem('csrfToken', data.csrfToken);
      }

      return data.csrfToken;
    } catch (error) {
      console.error('[AuthService] CSRF refresh failed:', error);
      return null;
    }
  },

  /**
   * Get my profile (uses JWT cookie auth).
   */
  async getProfile(): Promise<any> {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[AuthService] Profile fetch failed:', error);
      return null;
    }
  },

  /**
   * Get the stored CSRF token for state-changing requests.
   */
  getCSRFToken(): string | null {
    return localStorage.getItem('csrfToken');
  },
};
