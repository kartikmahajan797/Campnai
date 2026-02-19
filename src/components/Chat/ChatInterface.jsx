import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { chatService } from '@/lib/chatService';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Trash2, Bot } from 'lucide-react';

export const ChatInterface = ({ initialMessage }) => {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (authLoading || !user) return;

    // Get or create session ID per user
    const storageKey = `neo_session_id_${user.uid}`;
    let storedSessionId = localStorage.getItem(storageKey);
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, storedSessionId);
    }
    setSessionId(storedSessionId);

    // Load history
    loadChatHistory(storedSessionId);
  }, [user, authLoading]);

  const loadChatHistory = async (sessionId) => {
    try {
      const data = await chatService.getChatHistory(sessionId);
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      } else {
        setMessages([
          {
            role: 'assistant',
            content: "👋 Hey! I'm Neo, your AI agent for influencer marketing. I'm here to help you find the perfect influencers, negotiate deals, and close collaborations. How can I assist you today?",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      // Show welcome message on error
      setMessages([
        {
          role: 'assistant',
          content: "👋 Hey! I'm Neo, your AI agent for influencer marketing. I'm here to help you find the perfect influencers, negotiate deals, and close collaborations. How can I assist you today?",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    if (initialMessage && sessionId && !hasInitialized.current) {
      hasInitialized.current = true;
      const sendInitial = async () => {
        const userMessage = {
          role: 'user',
          content: initialMessage,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
          const response = await chatService.sendMessage(initialMessage, sessionId);
          const aiMessage = {
            role: 'assistant',
            content: response.response,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
          // silently fail
        } finally {
          setIsLoading(false);
        }
      };
      sendInitial();
    }
  }, [initialMessage, sessionId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatService.sendMessage(inputMessage, sessionId);

      // Update session ID if new
      if (response.session_id && response.session_id !== sessionId) {
        setSessionId(response.session_id);
        localStorage.setItem('neo_session_id', response.session_id);
      }

      // Add AI response to UI
      const aiMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat Error:", err);
      let userFriendlyError = "I'm having trouble connecting right now. Please try again in a moment.";
      
      if (err.message && (err.message.includes("429") || err.message.toLowerCase().includes("quota") || err.message.toLowerCase().includes("too many requests"))) {
        userFriendlyError = "I'm receiving too many requests at the moment. Please wait a few seconds and try again.";
      }

      setError(userFriendlyError);

      // Show error message in chat
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ ${userFriendlyError}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!sessionId || !user) return;

    try {
      await chatService.clearChatHistory(sessionId);

      // Create new session for this user
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storageKey = `neo_session_id_${user.uid}`;
      localStorage.setItem(storageKey, newSessionId);

      // Reset messages with welcome message
      setMessages([
        {
          role: 'assistant',
          content: "👋 Hey! I'm Neo, your AI agent for influencer marketing. I'm here to help you find the perfect influencers, negotiate deals, and close collaborations. How can I assist you today?",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError('Failed to clear chat history');
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur rounded-lg shadow-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-full">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Neo AI Agent</h2>
            <p className="text-xs text-muted-foreground">Influencer Marketing Assistant</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg}
            isUser={msg.role === 'user'}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Neo is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-6 py-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {error && (
          <div className="mb-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive-foreground">
            {error}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about influencers, pricing, deals..."
            disabled={isLoading}
            className="flex-1 bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:border-ring"
          />
          <Button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
