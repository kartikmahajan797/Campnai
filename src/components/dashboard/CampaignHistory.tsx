import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignService, CampaignData } from '../../services/CampaignService';
import DashboardLayout from '../DashboardLayout';
import { Loader2, Calendar, ArrowRight, Trash2, AlertCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useChatSessions } from '../../lib/useChatSessions';

interface ExpandedCampaign extends CampaignData {
    id: string;
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

const DeleteConfirmModal = ({
    campaign,
    onConfirm,
    onCancel,
    deleting,
}: {
    campaign: ExpandedCampaign;
    onConfirm: () => void;
    onCancel: () => void;
    deleting: boolean;
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-md p-8 animate-in zoom-in-95 duration-150">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 mx-auto mb-5">
                <AlertTriangle size={26} className="text-red-500 dark:text-red-400" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-2">
                Delete Campaign?
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-1">
                You are about to permanently delete:
            </p>
            <p className="text-base font-bold text-zinc-800 dark:text-zinc-200 text-center mb-5 px-4 truncate">
                "{campaign.name || 'Untitled Campaign'}"
            </p>

            {/* Warning box */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl p-4 mb-6 flex gap-3">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                    This will <strong>permanently delete</strong> the campaign and <strong>all its outreach data</strong> — including emails sent, conversation history, and negotiation replies. This action cannot be undone.
                </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    disabled={deleting}
                    className="flex-1 h-11 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={deleting}
                    className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-red-500/20"
                >
                    {deleting
                        ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting…</>
                        : <><Trash2 size={14} /> Delete Everything</>
                    }
                </button>
            </div>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CampaignHistory = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<ExpandedCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<ExpandedCampaign | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { sessions: chatSessions, isLoading: isSessionsLoading, deleteSession } = useChatSessions();

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const data = await CampaignService.getUserCampaigns();
            setCampaigns(data);
        } catch (err) {
            console.error('Failed to load campaigns', err);
            setError('Failed to load your campaigns.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResume = (id: string) => {
        navigate(`/campaign/new?id=${id}`);
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await CampaignService.deleteCampaign(confirmDelete.id);
            setCampaigns(prev => prev.filter(c => c.id !== confirmDelete.id));
            setConfirmDelete(null);
        } catch (err) {
            console.error('Failed to delete', err);
            alert('Failed to delete campaign. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp._seconds * 1000 || timestamp);
            return format(date, 'MMM d, yyyy').toUpperCase();
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <DashboardLayout
            chatSessions={chatSessions}
            isLoading={isSessionsLoading}
            onDeleteSession={deleteSession}
            title="My Campaigns"
        >
            <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Campaign History</h1>
                        <p className="text-muted-foreground">View and resume your past campaigns.</p>
                    </div>
                    <button
                        onClick={() => navigate('/campaign/new')}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20"
                    >
                        <span className="text-lg leading-none">+</span> New Campaign
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading campaigns...</p>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center text-destructive flex flex-col items-center gap-3">
                        <AlertCircle size={32} />
                        <p>{error}</p>
                        <button onClick={fetchCampaigns} className="underline font-medium hover:text-destructive/80">Try Again</button>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-dashed border-white/20">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                            <Calendar size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No campaigns found</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            You haven't created any campaigns yet. Start a new one to see it here.
                        </p>
                        <button
                            onClick={() => navigate('/campaign/new')}
                            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition shadow-lg shadow-primary/20 cursor-pointer"
                        >
                            Start First Campaign
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 overflow-y-auto">
                        {campaigns.map((campaign) => (
                            <div
                                key={campaign.id}
                                className="group relative w-full overflow-hidden rounded-2xl bg-white/60 dark:bg-black/30 backdrop-blur-md p-8 flex flex-col items-center border border-white/20 transition-all duration-300 shadow-lg min-h-[380px] hover:bg-white/80 dark:hover:bg-black/40 hover:shadow-xl hover:border-white/30 hover:-translate-y-1"
                            >
                                {/* Top row: status + date */}
                                <div className="w-full flex justify-between items-center mb-6">
                                    <span className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase border ${campaign.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' :
                                            campaign.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' :
                                                'bg-zinc-50 text-zinc-500 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                        }`}>
                                        {campaign.status || 'DRAFT'}
                                    </span>
                                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
                                        <Calendar size={12} />
                                        {formatDate(campaign.createdAt)}
                                    </span>
                                </div>

                                {/* ─── Delete button — top-right, shows on hover ─── */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDelete(campaign);
                                    }}
                                    className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100 duration-200"
                                    title="Delete Campaign"
                                >
                                    <Trash2 size={15} />
                                </button>

                                {/* Campaign name + industry */}
                                <div className="text-center mb-6 w-full">
                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 truncate px-2" title={campaign.name}>
                                        {campaign.name || 'Untitled Campaign'}
                                    </h3>
                                    {campaign.analysisResult?.industry && (
                                        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider line-clamp-1">
                                            {campaign.analysisResult.industry}
                                        </p>
                                    )}
                                </div>

                                {/* Goal */}
                                <div className="flex-1 w-full flex flex-col items-center justify-center mb-6 px-4">
                                    {campaign.analysisResult?.marketing_goal ? (
                                        <div className="text-center">
                                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase block mb-2">GOAL</span>
                                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-relaxed">
                                                {campaign.analysisResult.marketing_goal}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-sm font-medium text-zinc-400 italic">Setup pending...</div>
                                    )}
                                </div>

                                {/* Resume button */}
                                <div className="w-full mt-auto">
                                    <button
                                        onClick={() => handleResume(campaign.id)}
                                        className="w-full h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 font-bold rounded-lg text-sm tracking-wide shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        Resume Campaign <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Confirm Delete Modal ─── */}
            {confirmDelete && (
                <DeleteConfirmModal
                    campaign={confirmDelete}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => !deleting && setConfirmDelete(null)}
                    deleting={deleting}
                />
            )}
        </DashboardLayout>
    );
};

export default CampaignHistory;
