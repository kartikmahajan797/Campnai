import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import AgentActivitySidebar from './AgentActivitySidebar';
import { SidebarProvider } from "@/components/ui/sidebar";
import {
    ChevronRight,
    MoreHorizontal,
    MessageCircle,
    Mail,
    CheckCircle2,
} from 'lucide-react';

import OutreachReviewModal from './OutreachReviewModal';
import { CampaignService } from '@/services/CampaignService';
import { InfluencerSuggestion } from '../campaign-flow/CampaignContext';
import { normalizeInfluencerData } from '@/utils/influencerUtils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


const CampaignCommandCenter = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const decodedId = decodeURIComponent(id || 'Campaign');
    const [selectedInfluencer, setSelectedInfluencer] = React.useState<any>(null);

    const handleOutreachSend = (channels: string[], messages: any) => {
        console.log("Sending outreach via:", channels, messages);
        alert(`Outreach sent to ${selectedInfluencer?.name} via ${channels.join(' & ')}`);
        setSelectedInfluencer(null);
    };

    const [campaign, setCampaign] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (id) {
            CampaignService.getCampaign(id).then(data => {
                setCampaign(data);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [id]);

    const shortlistedInfluencers = React.useMemo(() => {
        if (!campaign || !campaign.suggestions) return [];
        const all = campaign.suggestions.map((s: any) => normalizeInfluencerData(s));
        const shortlistIds = campaign.shortlist || [];
        return all.filter((s: any) => shortlistIds.includes(s.id));
    }, [campaign]);

    // Dynamic Kanban Data
    const columns = [
        {
            id: 'imported',
            title: 'Imported',
            count: shortlistedInfluencers.length,
            total: shortlistedInfluencers.length,
            accent: 'border-blue-500/50',
            bgAccent: 'bg-blue-500/10',
            items: shortlistedInfluencers.map((inf: any) => ({
                id: inf.id,
                name: inf.name,
                handle: inf.handle,
                city: inf.location || 'Unknown',
                niche: inf.niche || 'General',
                status: 'ready',
                // avatar: inf.avatar || (inf.instagramUrl ? `https://unavatar.io/instagram/${inf.instagramUrl.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, '').replace(/\/$/, '')}` : null) || `https://ui-avatars.com/api/?name=${inf.name}&background=random`,
                lastActivity: 'Now'
            }))
        },
        {
            id: 'outreach',
            title: 'Outreach Sent',
            count: 0,
            total: 0,
            accent: 'border-primary/50',
            bgAccent: 'bg-primary/10',
            items: []
        },
        {
            id: 'replied',
            title: 'Replied',
            count: 0,
            total: 0,
            accent: 'border-purple-500/50',
            bgAccent: 'bg-purple-500/10',
            items: []
        },
        {
            id: 'content',
            title: 'Content Live',
            count: 0,
            total: 0,
            accent: 'border-green-500/50',
            bgAccent: 'bg-green-500/10',
            items: []
        }
    ];

    return (
        <DashboardLayout
            title={
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span onClick={() => navigate('/campaigns')} className="cursor-pointer hover:text-foreground transition">Campaigns</span>
                    <ChevronRight size={14} />
                    <span onClick={() => navigate(`/campaigns/${encodeURIComponent(decodedId)}`)} className="cursor-pointer hover:text-foreground transition">{campaign?.name || decodedId}</span>
                    <ChevronRight size={14} />
                    <span className="text-foreground">Command Center</span>
                </div>
            }
        >
            <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden">
                <SidebarProvider className="w-full h-full min-h-0">
                    {/* Main Board Area */}
                    <div className="flex-1 overflow-x-auto p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Campaign Command Center</h1>
                                    <div className="bg-card px-2.5 py-1 rounded-full flex items-center gap-2 text-[10px] text-muted-foreground border border-border font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        LIVE EXECUTION
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-muted-foreground text-sm">Real-time campaign status for</p>
                                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs border border-primary/20 font-medium">
                                        {campaign?.name || decodedId}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kanban Board */}
                        <div className="flex gap-4 min-w-max pb-4 flex-1 h-full">
                            {columns.map(column => (
                                <div key={column.id} className="w-72 flex-shrink-0 flex flex-col h-full">
                                    {/* Tab-like Header */}
                                    <div className={`flex items-center justify-between mb-4 bg-card border border-border p-4 rounded-xl border-t-2 ${column.accent} shadow-sm shrink-0`}>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-foreground text-sm">{column.title}</h3>
                                            <span className="text-xs text-muted-foreground font-medium">({column.count})</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-md border border-border/50">{column.total}</span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                        {column.items.map(item => (
                                            <div 
                                                key={item.id} 
                                                onClick={() => setSelectedInfluencer(item)}
                                                className="bg-card/80 backdrop-blur-sm border border-border/80 rounded-xl p-4 hover:border-primary/30 hover:shadow-primary/5 transition-all group cursor-pointer shadow-sm relative overflow-hidden"
                                            >
                                                {/* Hover Glow Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition duration-500 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>

                                                <div className="flex items-start gap-3 mb-3 relative z-10">
                                                    <div className="relative">
                                                        <Avatar className="w-10 h-10 border border-border/50 shadow-inner">
                                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                                {item.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${item.status === 'ready' || item.status === 'live' ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-foreground font-medium text-sm truncate group-hover:text-primary transition">{item.name}</h4>
                                                        <p className="text-muted-foreground text-xs truncate font-mono">{item.handle}</p>
                                                    </div>
                                                    <span className="text-[10px] text-slate-600 font-medium">{item.lastActivity ? item.lastActivity : 'Now'}</span>
                                                </div>

                                                {/* Status/Tags */}
                                                <div className="flex flex-wrap gap-2 mb-3 relative z-10">
                                                    {item.activityDetails && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 border border-border/50 px-2 py-1 rounded-md">
                                                            {item.activityDetails.includes('WhatsApp') && <MessageCircle size={10} className="text-green-500" />}
                                                            {item.activityDetails.includes('Email') && <Mail size={10} className="text-blue-500" />}
                                                            <span className="truncate max-w-[140px]">{item.activityDetails}</span>
                                                        </div>
                                                    )}
                                                    {!item.activityDetails && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 border border-border/50 px-2 py-1 rounded-md">
                                                            {item.city}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 border border-border/50 px-2 py-1 rounded-md">
                                                        {item.niche}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar - Agent Activity (Using Reusable Sidebar) */}
                    <AgentActivitySidebar />
                </SidebarProvider>
            </div>


            {selectedInfluencer && (
                <OutreachReviewModal
                    influencer={selectedInfluencer}
                    onClose={() => setSelectedInfluencer(null)}
                    onSend={handleOutreachSend}
                />
            )}
        </DashboardLayout>
    );
};

export default CampaignCommandCenter;
