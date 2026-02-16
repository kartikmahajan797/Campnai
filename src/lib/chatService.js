// Chat API service
import { auth } from '../firebaseConfig';

import { API_BASE_URL } from '../config/api';

/**
 * Get Firebase ID token for current user
 */
async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated. Please sign in.');
  }
  return user.getIdToken();
}

export const chatService = {
  /**
   * Send a message to Neo AI
   * @param {string} message - User message
   * @param {string} sessionId - Chat session ID
   * @param {function} onChunk - Callback for streaming chunks
   * @returns {Promise<{response: string, session_id: string}>}
   */
  async sendMessage(message, sessionId = null, onChunk) {
    try {
      const token = await getAuthToken();
      const controller = new AbortController();
      // Increase timeout for streaming (sometimes connection stays open long)
      const timeoutId = setTimeout(() => controller.abort(), 120000); 

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || 'Failed to send message');
      }

      // Handle streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      
      // Get session ID from header
      const newSessionId = response.headers.get("X-Session-Id");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        if (onChunk) onChunk(chunk);
      }

      return { response: fullText, session_id: newSessionId || sessionId };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  },

  /**
   * Get chat history for a session
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<{session_id: string, messages: Array, total: number}>}
   */
  async getChatHistory(sessionId) {
    try {
      const token = await getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch chat history');
      }

      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  },

  /**
   * Clear chat history for a session
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<{status: string, deleted_messages: number, session_id: string}>}
   */
  async clearChatHistory(sessionId) {
    try {
      const token = await getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to clear chat history');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  },

  async getSessions() {
    try {
      const token = await getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    } catch (error) {
      return { sessions: [] };
    }
  },
};
