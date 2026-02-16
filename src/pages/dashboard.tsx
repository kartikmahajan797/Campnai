import React, { useState, useEffect, useRef } from 'react';
import { Mic, Plus, Loader2, Send, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import DashboardLayout from '../components/DashboardLayout';
import { chatService } from '../lib/chatService';
import { useChatSessions } from '../lib/useChatSessions';
import { auth } from '../firebaseConfig';
import { useAuth } from '../lib/useAuth';


const ThinkingIndicator = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6 pl-2 animate-pulse font-medium">
      <Loader2 size={16} className="animate-spin text-primary/60" />
      <span>Thinking about your request</span>
      <span className="text-muted-foreground/50">•</span>
      <span>{seconds}s</span>
    </div>
  );
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false); 
  const [sessionId, setSessionId] = useState<string | null>(routeSessionId || null);
  const [error, setError] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load sessions list
  const loadSessions = async () => {
    if (!user) return;
    try {
      const data = await chatService.getSessions();
      setChatSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  // Effect to load sessions when user authenticates
  useEffect(() => {
    if (user) {
        loadSessions();
    } else if (!authLoading) {
        // User not logged in and not loading
        setChatSessions([]);
        setIsSessionsLoading(false);
    }
  }, [user, authLoading]);

  // Effect to handle routing and history loading
  useEffect(() => {
    if (authLoading) return; // Wait for auth check

    if (!user) {
        setMessages([]);
        return;
    }

    if (routeSessionId) {
        setSessionId(routeSessionId);
        loadChatHistory(routeSessionId);
    } else {
        // New chat mode
        setSessionId(null);
        setMessages([]);
        setIsHistoryLoading(false);
    }
  }, [routeSessionId, user, authLoading]);

  const loadChatHistory = async (sid: string) => {
    setIsHistoryLoading(true);
    try {
      const data = await chatService.getChatHistory(sid);
      if (data.messages?.length > 0) setMessages(data.messages);
      else setMessages([]);
    } catch (err) {
      console.error('Failed to load history:', err);
      // setMessages([]); // Keep existing if error?
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSelectSession = (sid: string) => {
    navigate(`/dashboard/${sid}`);
  };

  const handleNewChat = async () => {
    setSessionId(null);
    setMessages([]);
    setError(null);
    setIsHistoryLoading(false);
    setInputValue('');
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const msg = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date().toISOString() }]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
        const currentSessionId = sessionId;
        
        // Add placeholder for assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]);
        
        let accumulatedResponse = "";

        const res = await chatService.sendMessage(msg, currentSessionId, (chunk) => {
            accumulatedResponse += chunk;
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsgIndex = newMessages.length - 1;
                if (lastMsgIndex >= 0 && newMessages[lastMsgIndex].role === 'assistant') {
                    // Update the last message content
                    newMessages[lastMsgIndex] = {
                        ...newMessages[lastMsgIndex],
                        content: accumulatedResponse
                    };
                }
                return newMessages;
            });
            // Stop loading as soon as we start getting text
            setIsLoading(false); 
        });
      
      if (res.session_id) {
        if (!currentSessionId) {
            navigate(`/dashboard/${res.session_id}`, { replace: true });
        }
        setSessionId(res.session_id); 
      }
      
      // Ensure final state is set (redundant but safe)
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsgIndex = newMessages.length - 1;
         if (lastMsgIndex >= 0 && newMessages[lastMsgIndex].role === 'assistant') {
            newMessages[lastMsgIndex] = {
                ...newMessages[lastMsgIndex],
                content: res.response
            };
        }
        return newMessages;
      });

      loadSessions();
    } catch (err: any) {
      setError(err.message);
      // Remove the empty assistant message if it failed completely with no content?
      // Or just append error. simple way:
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}`, timestamp: new Date().toISOString() }]);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sid: string) => {
    await chatService.clearChatHistory(sid);
    // If deleting the active session, start a new chat
    if (sid === sessionId) {
      handleNewChat();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <DashboardLayout
      chatSessions={chatSessions}
      activeSessionId={sessionId}
      isLoading={isSessionsLoading}
      onSelectSession={handleSelectSession}
      onNewChat={handleNewChat}
      onDeleteSession={handleDeleteSession}
      headerAction={
        hasMessages ? (
          <button onClick={handleNewChat} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted/50 cursor-pointer text-sm font-medium">
            <Sparkles size={16} className="text-primary" />
            New Chat
          </button>
        ) : null
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>

        {isHistoryLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm">Loading conversation...</p>
          </div>
        ) : !hasMessages ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-[700px] text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-7">
                <Sparkles size={14} />
                Powered by Neo AI
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-2 leading-tight">
                Upload your brief and
              </h1>
              <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">
                see the magic ✨
              </h1>
              <p className="text-muted-foreground text-sm mb-8">
                Your AI-powered influencer marketing assistant.
              </p>

              <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex items-center gap-3 bg-muted/50 border border-border/50 rounded-2xl px-5 py-3">
                  <Plus size={20} className="text-muted-foreground cursor-pointer flex-shrink-0" />
                  <input
                    type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
                    placeholder="Upload brief or ask anything..." autoFocus
                    className="flex-1 bg-transparent border-none outline-none text-foreground text-base placeholder:text-muted-foreground"
                  />
                  <Mic size={18} className="text-muted-foreground cursor-pointer flex-shrink-0" />
                  <button type="submit" disabled={!inputValue.trim()} className={`w-8 h-8 rounded-lg border-none flex items-center justify-center flex-shrink-0 transition-colors ${inputValue.trim() ? 'bg-foreground cursor-pointer' : 'bg-muted cursor-not-allowed'}`}>
                    <Send size={16} className={`text-background ${!inputValue.trim() && 'opacity-50'}`} />
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {[
                  { emoji: '📊', label: 'Create Campaign', text: 'Create a new campaign for ' },
                  { emoji: '🎯', label: 'Find Influencers', text: 'Find influencers for ' },
                  { emoji: '📈', label: 'View Analytics', text: 'Show me analytics for ' },
                  { emoji: '💬', label: 'Outreach Message', text: 'Write an outreach message for ' },
                ].map(a => (
                  <button key={a.label} onClick={() => setInputValue(a.text)} className="px-4 py-2 rounded-xl text-sm bg-muted/60 border border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer">
                    {a.emoji} {a.label}
                  </button>
                ))}
              </div>

              <p style={{ color: '#475569', fontSize: 14 }}>Upload your campaign brief or start a conversation to unlock AI-powered influencer marketing</p>
            </div>
          </div>
        ) : (
          /* ===== CHAT MODE ===== */
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto w-full">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'user' ? (
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3 max-w-[70%] text-[15px] leading-relaxed shadow-sm font-medium">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="text-foreground text-[15px] leading-relaxed max-w-[90%] break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                            h1: ({children}) => <h3 className="text-lg font-bold mt-4 mb-2 text-foreground">{children}</h3>,
                            h2: ({children}) => <h4 className="text-base font-bold mt-3 mb-2 text-foreground">{children}</h4>,
                            h3: ({children}) => <h5 className="text-sm font-bold mt-3 mb-1 text-foreground">{children}</h5>,
                            ul: ({children}) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                            li: ({children}) => <li>{children}</li>,
                            a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{children}</a>,
                            code: ({children}) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                            hr: () => <hr className="my-3 border-border" />,
                            table: ({children}) => (
                              <div className="overflow-x-auto my-3 rounded-lg border border-border">
                                <table className="w-full border-collapse text-sm">{children}</table>
                              </div>
                            ),
                            thead: ({children}) => <thead className="bg-muted/50">{children}</thead>,
                            tbody: ({children}) => <tbody>{children}</tbody>,
                            tr: ({children}) => <tr className="border-b border-border last:border-0">{children}</tr>,
                            th: ({children}) => <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">{children}</th>,
                            td: ({children}) => <td className="px-3 py-2 text-foreground">{children}</td>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && <ThinkingIndicator />}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Bottom Input */}
            <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 pb-6">
              <div className="max-w-3xl mx-auto w-full">
                {error && (
                  <div className="mb-3 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                    ⚠️ {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center gap-3 bg-muted/50 border border-border/50 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all">
                    <Plus size={20} className="text-muted-foreground cursor-pointer flex-shrink-0 hover:text-foreground transition-colors" />
                    <input
                      type="text" 
                      value={inputValue} 
                      onChange={e => setInputValue(e.target.value)}
                      placeholder="Ask anything..." 
                      disabled={isLoading}
                      className="flex-1 bg-transparent border-none outline-none text-foreground text-base placeholder:text-muted-foreground disabled:opacity-50"
                    />
                    <Mic size={18} className="text-muted-foreground cursor-pointer flex-shrink-0 hover:text-foreground transition-colors" />
                    <button 
                      type="submit" 
                      disabled={!inputValue.trim() || isLoading} 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        inputValue.trim() && !isLoading 
                          ? 'bg-primary text-primary-foreground hover:opacity-90 cursor-pointer shadow-sm' 
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </form>
                <div className="text-center mt-2 text-xs text-muted-foreground">
                  AI can make mistakes. Check important info.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        /* Custom animations if needed */
      `}</style>
    </DashboardLayout>
  );
};

export default Dashboard;