// Chat API service — secured with credentials + CSRF
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import { secureFetch } from './secureFetch';

export const chatService = {
  /**
   * Send a message to Neo AI (streaming)
   */
  async sendMessage(message, sessionId = null, onChunk) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await secureFetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message, session_id: sessionId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || 'Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
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
   */
  async getChatHistory(sessionId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await secureFetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
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
   */
  async clearChatHistory(sessionId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await secureFetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
        method: 'DELETE',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to clear chat history');
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
   * Get all chat sessions
   */
  async getSessions() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await secureFetch(`${API_BASE_URL}/chat/sessions`, {
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
