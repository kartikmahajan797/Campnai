import React from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import { useAuth } from '@/lib/useAuth';
import { auth } from '@/firebaseConfig';
import { API_BASE_URL } from '@/config/api';
import { DUMMY_INFLUENCER } from '@/utils/dummyData';

import {
    ChevronRight, MessageCircle, Mail, X,
    Bot, User, ArrowLeft, CheckCircle2, Clock,
    Send, Sparkles, Users, Zap, TrendingUp, RefreshCw,
} from 'lucide-react';

import OutreachReviewModal from './OutreachReviewModal';
import { CampaignService } from '@/services/CampaignService';
import { normalizeInfluencerData } from '@/utils/influencerUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (ts: string) => {
    try {
        return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
};

const fmtDate = (ts: string) => {
    try {
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch { return ''; }
};

// Indian rupee formatter — handles string/number, always adds commas
const fmtINR = (val: number | string | undefined | null): string => {
    const raw = typeof val === 'string' ? val.replace(/,/g, '') : String(val ?? 0);
    const n = parseInt(raw, 10);
    if (isNaN(n)) return '0';
    return n.toLocaleString('en-IN');
};

// Strip quoted reply lines — handles both > lines and Gmail-style "On ... wrote:" headers
const cleanBody = (body: string) => {
    if (!body) return '';
    // Remove everything from "On <date>...wrote:" onwards (Gmail quote header, may span multiple lines)
    let cleaned = body.replace(/\r\n/g, '\n');
    // Remove Gmail/Outlook style quote headers
    cleaned = cleaned.replace(/On .+?(?:wrote:|\nwrote:)[\s\S]*/s, '').trim();
    // Also strip any lines starting with >
    const lines = cleaned.split('\n');
    const clean: string[] = [];
    for (const line of lines) {
        if (line.trim().startsWith('>')) break;
        clean.push(line);
    }
    return clean.join('\n').trim();
};

// ─── Split-panel Conversation Modal ───────────────────────────────────────────

const ConversationModal = ({
    outreach, onClose, onSimulate, simulating,
}: {
    outreach: any; onClose: () => void; onSimulate: () => void; simulating: boolean;
}) => {
    const messages: any[] = outreach.conversationHistory || [];
    const endRef = React.useRef<HTMLDivElement>(null);
    const isDone = outreach.status === 'deal_closed';
    const isNegotiating = outreach.status === 'negotiating';
    const msgCount = messages.length;
    const inboundCount = messages.filter((m) => m.role === 'inbound').length;

    React.useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgCount]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="relative bg-white dark:bg-zinc-950 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden border border-zinc-200 dark:border-zinc-800">

                {/* X button — absolute top-right outside header to save space */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-20 p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition backdrop-blur-sm"
                >
                    <X size={18} />
                </button>

                {/* ─── LEFT PANEL: Influencer info ─── */}
                <div className="w-72 shrink-0 flex flex-col border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    {/* Header - Centered */}
                    <div className="px-6 py-8 flex flex-col items-center text-center border-b border-zinc-100 dark:border-zinc-800">
                        <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center font-black text-zinc-700 dark:text-zinc-200 text-3xl border border-zinc-200 dark:border-zinc-700 mb-4">
                            {outreach.influencerName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg leading-tight mb-1">{outreach.influencerName}</h3>
                        <p className="text-xs text-zinc-400 font-medium break-all px-2">{outreach.influencerEmail}</p>

                        {/* Status Badge */}
                        <div className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                            isDone
                                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                                : 'bg-white text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                        }`}>
                            {isDone ? <CheckCircle2 size={12} /> : isNegotiating ? <Sparkles size={12} /> : <Clock size={12} />}
                            {isDone ? 'Deal Closed' : isNegotiating ? 'Negotiating' : 'Awaiting Reply'}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="px-6 py-6 space-y-6 flex-1 overflow-y-auto">
                        {/* Budget */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Budget</span>
                            <div className="text-right">
                                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                      ₹{fmtINR(outreach.minBudget)}
                                  </p>
                                  <p className="text-[10px] text-zinc-400">to ₹{fmtINR(outreach.maxBudget)}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Messages</span>
                            <div className="text-right">
                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{msgCount}</p>
                                <p className="text-[10px] text-zinc-400">{inboundCount} from influencer</p>
                            </div>
                        </div>

                        {/* Campaign */}
                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2">Campaign</p>
                            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{outreach.campaignName || '—'}</p>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-500 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <Mail size={10} />
                                <span className="truncate">{outreach.emailSubject}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    {!isDone && (
                        <div className="p-4 mt-auto border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                            <button
                                onClick={onSimulate}
                                disabled={simulating}
                                className="w-full h-9 flex items-center justify-center gap-2 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                            >
                                {simulating
                                    ? <><div className="w-3 h-3 border-2 border-zinc-400 border-t-zinc-700 rounded-full animate-spin" /> Checking inbox…</>
                                    : <><Zap size={12} /> Check for replies</>
                                }
                            </button>
                            <p className="text-center text-[10px] text-zinc-300 dark:text-zinc-600 mt-2">Auto-syncs every 2 min</p>
                        </div>
                    )}
                </div>

                {/* ─── RIGHT PANEL: Chat ─── */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
                    {/* Chat header */}
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Thread</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
                            <Mail size={10} /> Email only · WhatsApp coming soon
                        </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-zinc-50/50 dark:bg-zinc-900/30">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-zinc-400 py-16">
                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <MessageCircle size={20} className="opacity-40" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No messages yet</p>
                                    <p className="text-xs mt-1">Waiting for the influencer to reply...</p>
                                </div>
                            </div>
                        )}

                        {messages.map((msg: any, i: number) => {
                            const isOut = msg.role === 'outbound';
                            const prevMsg = messages[i - 1];
                            const showDate = !prevMsg || fmtDate(msg.timestamp) !== fmtDate(prevMsg.timestamp);

                            return (
                                <React.Fragment key={i}>
                                    {showDate && (
                                        <div className="flex items-center gap-4 my-4">
                                            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                                            <span className="text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-600 font-semibold">{fmtDate(msg.timestamp)}</span>
                                            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                                        </div>
                                    )}
                                    <div className={`flex gap-3 ${isOut ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold mt-1 shadow-sm ${
                                            isOut
                                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                                : 'bg-white text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                        }`}>
                                            {isOut ? (msg.isAI ? <Bot size={14} /> : <User size={14} />) : outreach.influencerName?.charAt(0)?.toUpperCase()}
                                        </div>

                                        {/* Bubble */}
                                        <div className={`max-w-[80%] flex flex-col gap-1 ${isOut ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 px-1">
                                                {isOut ? (
                                                    <>
                                                        <span>{fmt(msg.timestamp)}</span>
                                                        {msg.isAI && <span className="font-semibold text-zinc-500 flex items-center gap-0.5 border border-zinc-100 dark:border-zinc-800 rounded px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-900">AI</span>}
                                                    </>
                                                ) : (
                                                    <><span className="font-semibold text-zinc-600 dark:text-zinc-300">{outreach.influencerName?.split(' ')[0]}</span><span>{fmt(msg.timestamp)}</span></>
                                                )}
                                            </div>
                                            <div className={`px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                                                isOut
                                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-tr-sm'
                                                    : 'bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700 rounded-tl-sm'
                                            }`}>
                                                {cleanBody(msg.body)}
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        <div ref={endRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Portal Hover Popup ───────────────────────────────────────────────────────

const PortalHoverPopup = ({ item, parentRef }: { item: any, parentRef: React.RefObject<HTMLDivElement> }) => {
    const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

    React.useEffect(() => {
        if (parentRef.current) {
            const rect = parentRef.current.getBoundingClientRect();
            // Center horizontally, position above
            setCoords({
                top: rect.top - 8, // 8px gap above
                left: rect.left + rect.width / 2,
            });
        }
    }, [item]);

    if (!coords) return null;

    return createPortal(
        <div
            className="fixed z-[9999] w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
            style={{
                top: coords.top,
                left: coords.left,
                transform: 'translate(-50%, -100%)',
            }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 text-base border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    {item.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{item.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{item.handle}</p>
                </div>
            </div>
            <div className="space-y-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                {item.location && <p className="flex items-center gap-2"><span className="text-zinc-300">📍</span> <span className="text-zinc-700 dark:text-zinc-300 font-medium">{item.location}</span></p>}
                {item.niche && <p className="flex items-center gap-2"><span className="text-zinc-300">🎯</span> <span className="text-zinc-700 dark:text-zinc-300 font-medium">{item.niche}</span></p>}
                {item.followers && <p className="flex items-center gap-2"><span className="text-zinc-300">👥</span> <span className="text-zinc-700 dark:text-zinc-300 font-medium">{item.followers} followers</span></p>}
                {item.email && <p className="flex items-center gap-2"><span className="text-zinc-300">✉️</span> <span className="truncate">{item.email}</span></p>}
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-3 h-3 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200 dark:border-zinc-800 rotate-45" />
        </div>,
        document.body
    );
};

// ─── Creator Card ─────────────────────────────────────────────────────────────

const CreatorCard = ({ item, onClick }: { item: any; onClick: () => void }) => {
    const [hovered, setHovered] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm border border-zinc-200 dark:border-white/10 rounded-xl p-4 hover:border-zinc-400 dark:hover:border-white/30 hover:shadow-md transition-all cursor-pointer group"
        >
            {hovered && <PortalHoverPopup item={item} parentRef={cardRef} />}
            
            {/* Absolute badge top-right */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 shadow-sm">
                    Outreach <ArrowLeft size={8} className="rotate-180" />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 text-base border border-zinc-200 dark:border-zinc-700 shrink-0">
                    {item.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1 pr-16 h-10 flex flex-col justify-center">
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-tight">{item.name}</h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5 leading-tight">{item.handle || item.email}</p>
                </div>
            </div>

            {(item.niche || item.location || item.followers) && (
                <div className="flex gap-2 mt-3.5 overflow-hidden">
                    {item.niche && <span className="text-[10px] whitespace-nowrap text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-100 dark:border-zinc-800">{item.niche}</span>}
                    {item.location && <span className="text-[10px] whitespace-nowrap text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-100 dark:border-zinc-800">📍 {item.location}</span>}
                    {item.followers && <span className="text-[10px] whitespace-nowrap text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-100 dark:border-zinc-800">👥 {item.followers}</span>}
                </div>
            )}
        </div>
    );
};

// ─── Outreach Card ────────────────────────────────────────────────────────────

const OutreachCard = ({ outreach, onClick }: { outreach: any; onClick: () => void }) => {
    const [hovered, setHovered] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);
    const isDone = outreach.status === 'deal_closed';
    const isNeg = outreach.status === 'negotiating';
    const msgCount = outreach.conversationHistory?.length || 0;
    const lastMsg = outreach.conversationHistory?.slice(-1)[0];

    const popupItem = {
        name: outreach.influencerName,
        email: outreach.influencerEmail,
        handle: `Last active: ${lastMsg ? fmt(lastMsg.timestamp) : 'Just now'}`,
        // Re-use popup structure
    };

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm border border-zinc-200 dark:border-white/10 rounded-xl p-4 hover:border-zinc-400 dark:hover:border-white/30 hover:shadow-md transition-all cursor-pointer group"
        >
            {hovered && <PortalHoverPopup item={popupItem} parentRef={cardRef} />}

            {/* Top row */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 text-base border border-zinc-200 dark:border-zinc-700 shrink-0">
                    {outreach.influencerName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{outreach.influencerName}</h4>
                    <p className="text-[11px] text-zinc-400 truncate">{outreach.influencerEmail}</p>
                </div>
                {msgCount > 0 && (
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 h-5 w-5 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 shrink-0">
                        {msgCount}
                    </span>
                )}
            </div>


            {/* Status row */}
            <div className="flex items-center gap-2 mt-3 justify-between">
                <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                    isDone
                        ? 'text-zinc-700 bg-zinc-100 border-zinc-300 dark:text-zinc-300 dark:bg-zinc-800 dark:border-zinc-600'
                        : isNeg
                        ? 'text-zinc-700 bg-zinc-100 border-zinc-300 dark:text-zinc-200 dark:bg-zinc-800 dark:border-zinc-700'
                        : 'text-zinc-500 bg-zinc-50 border-zinc-200 dark:text-zinc-500 dark:bg-zinc-900 dark:border-zinc-700'
                }`}>
                    {isDone ? <CheckCircle2 size={10} /> : isNeg ? <><Sparkles size={10} /></> : <Clock size={10} />}
                    {isDone ? 'Deal Closed' : isNeg ? 'Negotiating' : 'Awaiting Reply'}
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">₹{fmtINR(outreach.minBudget)}–₹{fmtINR(outreach.maxBudget)}</span>
            </div>
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CampaignCommandCenter = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const decodedId = decodeURIComponent(id || 'Campaign');
    const { user } = useAuth();

    const [selectedInfluencer, setSelectedInfluencer] = React.useState<any>(null);
    const [sendingOutreach, setSendingOutreach] = React.useState(false);
    const [outreachSuccess, setOutreachSuccess] = React.useState<string | null>(null);
    const [outreaches, setOutreaches] = React.useState<any[]>([]);
    const [activeConversation, setActiveConversation] = React.useState<any>(null);
    const [simulating, setSimulating] = React.useState(false);
    const [campaign, setCampaign] = React.useState<any>(null);
    const [isOptimizing, setIsOptimizing] = React.useState(false);

    // Ref to active conversation id — avoids stale closure in polling interval
    const activeConvIdRef = React.useRef<string | null>(null);
    React.useEffect(() => {
        activeConvIdRef.current = activeConversation?.id ?? null;
    }, [activeConversation]);

    React.useEffect(() => {
        if (id) {
            CampaignService.getCampaign(id)
                .then(data => setCampaign(data))
                .catch(console.error);
        }
    }, [id]);

    const fetchOutreaches = React.useCallback(async () => {
        if (!id || !auth.currentUser) return;
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${API_BASE_URL}/campaigns/${id}/outreaches`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setOutreaches(data);
                // Only update modal if it's already open (use ref to avoid stale closure)
                const openId = activeConvIdRef.current;
                if (openId) {
                    const updated = data.find((o: any) => o.id === openId);
                    if (updated) setActiveConversation(updated);
                }
            }
        } catch (e) { console.error(e); }
    }, [id]);

    React.useEffect(() => {
        fetchOutreaches();
        const iv = setInterval(fetchOutreaches, 10000);
        return () => clearInterval(iv);
    }, [id, fetchOutreaches]);

    const handleSimulate = async () => {
        if (!activeConversation || !auth.currentUser) return;
        setSimulating(true);
        try {
            const token = await auth.currentUser.getIdToken();
            await fetch(
                `${API_BASE_URL}/campaigns/${id}/outreaches/${activeConversation.id}/simulate-reply`,
                { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
            );
            await fetchOutreaches();
        } catch (e) { console.error(e); }
        finally { setSimulating(false); }
    };

    const handleOutreachSend = async (
        channels: string[],
        messages: { whatsapp: string; email: string },
        budget: { min: number; max: number },
    ) => {
        if (!channels.includes('email') || !selectedInfluencer) {
            setSelectedInfluencer(null); return;
        }
        const [emailSubjectLine, ...bodyLines] = messages.email.split('\n\n');
        const influencerEmail = selectedInfluencer.email ||
            prompt(`Enter email for ${selectedInfluencer.name}:`);
        if (!influencerEmail) return;

        setSendingOutreach(true);
        try {
            const token = await auth.currentUser!.getIdToken();
            const res = await fetch(`${API_BASE_URL}/campaigns/${id}/send-outreach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    influencerEmail,
                    influencerName: selectedInfluencer.name,
                    influencerId: selectedInfluencer.id,
                    emailSubject: emailSubjectLine.trim(),
                    emailBody: bodyLines.join('\n\n').trim(),
                    minBudget: budget.min,
                    maxBudget: budget.max,
                    brandName: campaign?.name || campaign?.analysisResult?.brand_name || 'Our Brand',
                    campaignName: campaign?.name || decodedId,
                }),
            });
            if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
            setOutreachSuccess(`Outreach sent to ${selectedInfluencer.name}!`);
            setTimeout(() => setOutreachSuccess(null), 5000);
            fetchOutreaches();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSendingOutreach(false);
            setSelectedInfluencer(null);
        }
    };



    const handleOptimize = async () => {
        setIsOptimizing(true);
        // "Optimize" - force re-sync and layout check
        await fetchOutreaches();
        await new Promise(r => setTimeout(r, 800));
        setIsOptimizing(false);
    };
    const shortlistedInfluencers = React.useMemo(() => {
        const all = campaign?.suggestions
            ? campaign.suggestions.map((s: any) => normalizeInfluencerData(s))
            : [];
        const ids = campaign?.shortlist || [];
        return [DUMMY_INFLUENCER, ...all.filter((s: any) => ids.includes(s.id) && s.id !== DUMMY_INFLUENCER.id)];
    }, [campaign]);

    const outreachByInfluencer = React.useMemo(() => {
        const map: Record<string, any> = {};
        for (const o of outreaches) { if (o.influencerId) map[o.influencerId] = o; }
        return map;
    }, [outreaches]);

    const cols = [
        {
            id: 'shortlisted', title: 'Shortlisted', icon: <Users size={14} className="text-zinc-500" />,
            items: shortlistedInfluencers.filter(inf => !outreachByInfluencer[inf.id]),
            render: (inf: any) => <CreatorCard key={inf.id} item={{ ...inf, location: inf.location }} onClick={() => setSelectedInfluencer(inf)} />,
        },
        {
            id: 'sent', title: 'Outreach Sent', icon: <Send size={14} className="text-zinc-500" />,
            items: outreaches.filter(o => o.status === 'sent'),
            render: (o: any) => <OutreachCard key={o.id} outreach={o} onClick={() => setActiveConversation(o)} />,
        },
        {
            id: 'negotiating', title: 'Negotiating', icon: <Sparkles size={14} className="text-zinc-500" />,
            items: outreaches.filter(o => o.status === 'negotiating'),
            render: (o: any) => <OutreachCard key={o.id} outreach={o} onClick={() => setActiveConversation(o)} />,
        },
        {
            id: 'live', title: 'Content Live', icon: <CheckCircle2 size={14} className="text-zinc-500" />,
            items: outreaches.filter(o => o.status === 'deal_closed'),
            render: (o: any) => <OutreachCard key={o.id} outreach={o} onClick={() => setActiveConversation(o)} />,
        },
    ];

    return (
        <DashboardLayout
            title={
                <div className="flex items-center gap-2 text-sm text-zinc-400 overflow-hidden whitespace-nowrap min-w-0">
                    <span onClick={() => navigate('/campaigns')} className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition">Campaigns</span>
                    <ChevronRight size={14} />
                    <span onClick={() => navigate(`/campaigns/${encodeURIComponent(decodedId)}`)} className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition truncate">{campaign?.name || decodedId}</span>
                    <ChevronRight size={14} />
                    <span className="text-zinc-700 dark:text-zinc-200">Command Center</span>
                </div>
            }
        >
            <div className="h-[calc(100vh-64px)] bg-transparent flex flex-col overflow-hidden">

                {/* Page header */}
                <div className="px-8 pt-6 pb-4 shrink-0 border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Command Center</h1>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <span className="text-sm text-zinc-500">{campaign?.name || decodedId}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 font-medium ml-auto">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                            LIVE · updates every 10s
                        </div>

                        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleOptimize}
                                disabled={isOptimizing}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-black dark:bg-white dark:text-black rounded-lg shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                {isOptimizing ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} fill="currentColor" />}
                                Optimize
                            </button>
                        </div>
                    </div>
                </div>

                {/* Kanban */}
                <div className="flex-1 overflow-hidden px-8 py-6">
                    <div className="flex gap-5 h-full">
                        {cols.map(col => (
                            <div key={col.id} className="flex-1 min-w-0 flex flex-col h-full">
                                {/* Column header */}
                                <div className="flex items-center justify-between mb-3 shrink-0">
                                    <div className="flex items-center gap-2">
                                        {col.icon}
                                        <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">{col.title}</h3>
                                    </div>
                                    <span className="text-[10px] font-semibold text-zinc-400 bg-white dark:bg-zinc-900 w-5 h-5 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800">
                                        {col.items.length}
                                    </span>
                                </div>
                                {/* Divider */}
                                <div className="h-px bg-zinc-200 dark:bg-zinc-800 mb-3 shrink-0" />
                                {/* Cards */}
                                <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                                    {col.items.length === 0 && (
                                        <div className="flex items-center justify-center h-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] text-zinc-300 dark:text-zinc-700">
                                            Empty
                                        </div>
                                    )}
                                    {col.items.map(col.render as any)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toast */}
            {outreachSuccess && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium px-6 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    ✓ {outreachSuccess}
                </div>
            )}

            {selectedInfluencer && (
                <OutreachReviewModal
                    influencer={selectedInfluencer}
                    campaign={campaign}
                    userDisplayName={user?.displayName || user?.email || 'Campaign Manager'}
                    onClose={() => setSelectedInfluencer(null)}
                    onSend={handleOutreachSend}
                />
            )}

            {activeConversation && (
                <ConversationModal
                    outreach={activeConversation}
                    onClose={() => setActiveConversation(null)}
                    onSimulate={handleSimulate}
                    simulating={simulating}
                />
            )}
        </DashboardLayout>
    );
};

export default CampaignCommandCenter;
