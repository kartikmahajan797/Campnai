import { useState, useEffect } from 'react';
import { chatService } from './chatService';
import { useAuth } from './useAuth';

export const useChatSessions = () => {
    const { user, loading: authLoading } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSessions = async () => {
        if (!user) return;
        try {
            const data = await chatService.getSessions();
            setSessions(data.sessions || []);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadSessions();
        } else if (!authLoading) {
            setSessions([]);
            setIsLoading(false);
        }
    }, [user, authLoading]);

    const deleteSession = async (sessionId: string) => {
        try {
            await chatService.clearChatHistory(sessionId);
            setSessions(prev => prev.filter(s => s.session_id !== sessionId));
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    return {
        sessions,
        isLoading,
        loadSessions,
        deleteSession
    };
};
