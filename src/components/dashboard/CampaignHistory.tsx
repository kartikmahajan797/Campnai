import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignService, CampaignData } from '../../services/CampaignService';
import DashboardLayout from '../DashboardLayout';
import { Loader2, Calendar, ArrowRight, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useChatSessions } from '../../lib/useChatSessions';

interface ExpandedCampaign extends CampaignData {
    id: string;
}

const CampaignHistory = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<ExpandedCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Using chat sessions hook for layout compatibility
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
            console.error("Failed to load campaigns", err);
            setError("Failed to load your campaigns.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResume = (id: string) => {
        navigate(`/campaign/new?id=${id}`);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp._seconds * 1000 || timestamp);
            return format(date, 'MMM d, yyyy');
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
                        <p className="text-muted-foreground">Loading specific campaign data...</p>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center text-destructive flex flex-col items-center gap-3">
                        <AlertCircle size={32} />
                        <p>{error}</p>
                        <button onClick={fetchCampaigns} className="underline font-medium hover:text-destructive/80">Try Again</button>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-2xl border border-dashed border-border/50">
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
                                className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden flex flex-col h-[280px]"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="text-primary" />
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                                            campaign.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            campaign.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                            {campaign.status || 'DRAFT'}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar size={10} />
                                            {formatDate(campaign.createdAt)}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1" title={campaign.name}>
                                        {campaign.name || 'Untitled Campaign'}
                                    </h3>
                                </div>

                                <div className="space-y-2 flex-1 overflow-hidden">
                                    {campaign.analysisResult?.industry && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Industry:</span> <span className="font-medium text-foreground">{campaign.analysisResult.industry}</span>
                                        </div>
                                    )}
                                    {campaign.analysisResult?.marketing_goal && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Goal:</span> <span className="font-medium text-foreground line-clamp-2">{campaign.analysisResult.marketing_goal}</span>
                                        </div>
                                    )}
                                    {!campaign.analysisResult && (
                                        <div className="text-sm text-muted-foreground italic mt-4">
                                            Draft setup pending...
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                                    <button 
                                        onClick={() => handleResume(campaign.id)}
                                        className="w-full bg-primary/5 hover:bg-primary/10 text-primary font-medium py-2 rounded-lg transition text-center text-sm border border-primary/10 hover:border-primary/20 cursor-pointer"
                                    >
                                        Resume Campaign
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CampaignHistory;
