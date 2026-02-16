import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../lib/useAuth';
import { Plus, Search, User, Briefcase, MessageSquare, Menu, X, LogOut, Sparkles, Trash2, Rocket } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ModeToggle } from "@/components/mode-toggle";

interface ChatSession {
    session_id: string;
    title: string;
    timestamp: string | null;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: React.ReactNode;
    chatSessions?: ChatSession[];
    activeSessionId?: string | null;
    isLoading?: boolean;
    onSelectSession?: (sessionId: string) => void;
    onNewChat?: () => void;
    onDeleteSession?: (sessionId: string) => void;
    headerAction?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
    children, title, chatSessions = [], activeSessionId, isLoading = false, onSelectSession, onNewChat, onDeleteSession, headerAction
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to log out');
        }
    };

    const confirmDelete = () => {
        if (sessionToDelete && onDeleteSession) {
            onDeleteSession(sessionToDelete);
            setSessionToDelete(null);
        }
    };

    const getUserInitial = () => {
        if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return 'U';
    };

    const getUserDisplayName = () => {
        return user?.displayName || user?.email?.split('@')[0] || 'User';
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-card overflow-hidden">
            
            <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
                <AlertDialogContent className="bg-card border-border text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This action cannot be undone. This will permanently delete the chat session and remove all messages.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-none">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-card border-r border-border transition-all duration-300 flex flex-col overflow-hidden`}>

                <Link 
                    to="/dashboard" 
                    onClick={() => onNewChat?.()}
                    className="h-16 px-6 border-b border-border flex items-center gap-3 hover:bg-muted/50 transition-colors"
                >
                    <Sparkles className="text-primary" size={24} />
                    <span className="text-foreground font-semibold text-xl tracking-tight">CampnAI</span>
                </Link>

                <nav className="p-3 space-y-1">
                    <button
                        onClick={() => { onNewChat?.(); navigate('/dashboard'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition"
                    >
                        <Plus size={18} />
                        <span className="text-sm">New chat</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition">
                        <Search size={18} />
                        <span className="text-sm">Search chats</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition">
                        <User size={18} />
                        <span className="text-sm">Account</span>
                    </button>

                    <button
                        onClick={() => navigate('/campaigns')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive('/campaigns') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <Briefcase size={18} />
                        <span className="text-sm">Campaigns</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition">
                        <MessageSquare size={18} />
                        <span className="text-sm">Influencer Profiles</span>
                    </button>

                    <button
                        onClick={() => navigate('/campaign/new')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition mt-1"
                    >
                        <Rocket size={18} />
                        <span className="text-sm font-medium">Create Campaign</span>
                    </button>
                </nav>

                <div className="flex-1 overflow-y-auto min-h-0 border-t border-border mx-3 mt-2  overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex items-center justify-between px-3 py-3 sticky top-0 bg-card/95 backdrop-blur z-10">
                        <span className="text-xs text-muted-foreground uppercase font-medium">Your chats</span>
                    </div>

                    <div className="pb-3 ">
                        {isLoading ? (
                            <div className="space-y-2 px-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : chatSessions.length > 0 ? (
                            chatSessions.map(chat => (
                                <div
                                    key={chat.session_id}
                                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-sm cursor-pointer mb-1 ${
                                        activeSessionId === chat.session_id 
                                            ? 'bg-muted text-foreground' 
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    }`}
                                    onClick={() => onSelectSession?.(chat.session_id)}
                                >
                                    <span className="truncate flex-1">💬 {chat.title}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSessionToDelete(chat.session_id); }}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition ml-2 flex-shrink-0"
                                        title="Delete chat"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 text-xs text-muted-foreground">No recent chats</div>
                        )}
                    </div>
                </div>

                <div className="p-3 border-t border-border">
                    {isLoading ? (
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-muted/50 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
                                <div className="h-2 w-24 bg-muted/50 rounded animate-pulse" />
                            </div>
                        </div>
                    ) : user && (
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                                {getUserInitial()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm font-medium truncate">
                                    {getUserDisplayName()}
                                </p>
                                <p className="text-muted-foreground text-xs truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1 flex flex-col relative">

                <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-muted-foreground hover:text-foreground transition lg:hidden"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="flex items-center gap-2">
                            {title ? (
                                <span className="text-muted-foreground text-sm font-medium">{title}</span>
                            ) : (
                                <span className="text-foreground font-medium">CampnAI</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {headerAction}
                        <ModeToggle />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 transition text-sm font-medium"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
