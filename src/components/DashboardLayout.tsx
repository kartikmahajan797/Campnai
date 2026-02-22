import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../lib/useAuth';
import { Plus, Search, User, Briefcase, MessageSquare, Menu, X, LogOut, Sparkles, Trash2, Rocket, Calendar } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import campnaiLogo from '../assets/campnailogo.png';
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

import { PremiumBackground } from './ui/premium-background';

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

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive: boolean;
    isExpanded: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, onClick, isActive, isExpanded }) => {
    return (
        <div className={`relative flex justify-center group ${isExpanded ? 'w-[90%]' : 'w-12 mx-auto'}`}>
            <button
                onClick={onClick}
                className={`flex items-center gap-3 rounded-2xl transition-all duration-300 hover:bg-zinc-100 dark:hover:bg-white/5 overflow-hidden whitespace-nowrap w-full ${
                    isActive 
                    ? 'text-zinc-900 dark:text-white font-medium bg-zinc-200 dark:bg-white/10 shadow-sm' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                } ${
                    isExpanded 
                    ? 'px-4 py-3 justify-start' 
                    : 'h-12 justify-center'
                }`}
            >
                <div className={`shrink-0 transition-transform duration-200 ${isActive && !isExpanded ? 'scale-110' : ''}`}>
                    {icon}
                </div>
                <span className={`text-sm transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    {label}
                </span>
            </button>
            
            {/* Custom Tooltip */}
            {!isExpanded && (
                <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap shadow-xl">
                    {label}
                    {/* Tooltip Arrow */}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-r-4 border-y-transparent border-r-zinc-900 dark:border-r-zinc-100" />
                </div>
            )}
        </div>
    );
};

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
        <div className="flex h-screen bg-transparent text-foreground overflow-hidden relative">

            <PremiumBackground />

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

            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[40] md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed md:relative top-0 left-0 h-full z-[50] bg-white/80 dark:bg-background/40 backdrop-blur-2xl transition-all duration-300 flex flex-col overflow-x-hidden shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-zinc-200 dark:border-white/5 ${
                    sidebarOpen ? 'w-[260px] translate-x-0' : 'w-[80px] -translate-x-full md:translate-x-0'
                }`}
            >
                {/* Logo Area */}
                <Link
                    to="/dashboard"
                    onClick={() => onNewChat?.()}
                    className={`h-16 w-full flex items-center hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors border-b border-zinc-200 dark:border-white/5 shrink-0 ${sidebarOpen ? 'px-6 justify-start gap-3' : 'justify-center'}`}
                >
                    <img src={campnaiLogo} alt="CampnAI" className="h-8 w-auto object-contain brightness-0 dark:invert shrink-0" />
                    <span className={`text-foreground font-semibold text-xl tracking-tight dark:text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                        CampnAI
                    </span>
                </Link>

                {/* Primary Navigation */}
                <nav className="w-full flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-4 flex flex-col items-center gap-2">
                    <SidebarItem
                        icon={<Plus size={22} strokeWidth={2.5} />}
                        label="New Chat"
                        onClick={() => { onNewChat?.(); navigate('/dashboard'); }}
                        isActive={false}
                        isExpanded={sidebarOpen}
                    />

                    <SidebarItem
                        icon={<Search size={22} strokeWidth={2.5} />}
                        label="Search"
                        onClick={() => {}}
                        isActive={false}
                        isExpanded={sidebarOpen}
                    />

                    <SidebarItem
                        icon={<User size={22} strokeWidth={2.5} />}
                        label="Account"
                        onClick={() => navigate('/dashboard/account')}
                        isActive={isActive('/dashboard/account')}
                        isExpanded={sidebarOpen}
                    />

                    {/* <SidebarItem
                        icon={<Briefcase size={22} strokeWidth={2.5} />}
                        label="Find Creators"
                        onClick={() => navigate('/campaigns')}
                        isActive={isActive('/campaigns')}
                        isExpanded={sidebarOpen}
                    /> */}

                    <SidebarItem
                        icon={<Calendar size={22} strokeWidth={2.5} />}
                        label="Campaigns"
                        onClick={() => navigate('/dashboard/history')}
                        isActive={isActive('/dashboard/history')}
                        isExpanded={sidebarOpen}
                    />

                    <SidebarItem
                        icon={<MessageSquare size={22} strokeWidth={2.5} />}
                        label="Profiles"
                        onClick={() => {}}
                        isActive={false}
                        isExpanded={sidebarOpen}
                    />

                    <div className="mt-4 w-full flex justify-center px-4">
                        <button
                            onClick={() => navigate('/campaign/new')}
                            className={`flex items-center justify-center rounded-xl bg-black text-white hover:opacity-90 transition-all duration-300 shadow-md shadow-primary/20 overflow-hidden whitespace-nowrap group ${
                                sidebarOpen ? 'w-[90%] gap-2 py-3 px-4' : 'w-12 h-12 p-0'
                            }`}
                        >
                            <Rocket size={20} className="shrink-0 group-hover:-translate-y-0.5 transition-transform" />
                            <span className={`font-bold tracking-wide uppercase transition-all duration-300 ${
                                sidebarOpen ? 'text-sm opacity-100 w-auto' : 'opacity-0 w-0 text-[0px]'
                            }`}>
                                Create Campaign
                            </span>
                        </button>
                    </div>

                    {sidebarOpen && (
                         <div className="w-full mt-6">
                            <div className="flex items-center px-6 py-2 mb-2 border-t border-zinc-200 dark:border-white/5 pt-4">
                                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Your chats</span>
                            </div>

                            <div className="px-4 space-y-1">
                                {isLoading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-8 bg-muted/50 rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                ) : chatSessions.length > 0 ? (
                                    chatSessions.map(chat => (
                                        <div
                                            key={chat.session_id}
                                            className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-sm cursor-pointer ${activeSessionId === chat.session_id
                                                ? 'bg-white/10 dark:bg-white/5 text-foreground shadow-sm'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100'
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
                                    <div className="px-2 text-xs text-muted-foreground">No recent chats</div>
                                )}
                            </div>
                        </div>
                    )}
                </nav>

                {/* User Profile Footer */}
                <div className={`w-full p-3 border-t border-zinc-200 dark:border-white/5 mt-auto flex flex-col items-center shrink-0 bg-transparent`}>
                    {isLoading ? (
                         <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse bg-white/5" />
                    ) : user && (
                        <div className="flex flex-col items-center gap-2 w-full">
                            <div className={`flex items-center w-full overflow-hidden transition-all duration-300 ${sidebarOpen ? 'gap-3 px-2 justify-start' : 'justify-center'}`}>
                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-900 dark:text-zinc-100 font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm transition-transform hover:scale-105 cursor-pointer" title={user.email || ''}>
                                    {getUserInitial()}
                                </div>
                                <div className={`flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                        {getUserDisplayName()}
                                    </span>
                                    <span className="text-xs text-zinc-500 truncate">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                            
                            <button
                                onClick={handleLogout}
                                className={`flex items-center justify-center rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 shrink-0 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-[90%] px-4 py-2 gap-2 mt-2 bg-zinc-50 dark:bg-white/5' : 'w-10 h-10 p-0'}`}
                                title="Sign Out"
                            >
                                <LogOut size={18} className="shrink-0" />
                                <span className={`text-sm font-medium transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 text-[0px]'}`}>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1 flex flex-col relative">

                <header className="h-16 flex items-center justify-between px-6 border-b border-white/20 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-muted-foreground hover:text-foreground transition flex-shrink-0 md:hidden"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-muted-foreground hover:text-foreground transition flex-shrink-0 hidden md:block"
                            aria-label="Toggle sidebar desktop"
                        >
                            {sidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                            {title && (
                                <div className="text-muted-foreground text-sm font-medium truncate">{title}</div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {headerAction}
                        <ModeToggle />
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
