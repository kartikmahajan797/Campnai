import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import { ChevronRight, CheckSquare, MessageSquare, Mail, AlertCircle, Phone } from 'lucide-react';
import { useChatSessions } from '../../lib/useChatSessions';

const CampaignDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const decodedId = decodeURIComponent(id || 'Campaign');
    const { sessions: chatSessions, isLoading: isSessionsLoading, deleteSession } = useChatSessions();

    // Mock data based on the image provided
    const initialInfluencers = [
        { id: 1, name: 'Aditi Kapoor', handle: '@aditix', city: 'Mumbai', whatsapp: 'No Whatsapp', email: 'No Email', selected: true },
        { id: 2, name: 'Rahul Verma', handle: '@rahulv', city: 'Delhi', whatsapp: '+91 9823 456789', email: 'rahul@example.com', selected: true },
        { id: 3, name: 'Simran Sharma', handle: '@simran.s', city: 'Mumbai', whatsapp: 'No Whatsapp', email: 'simran@gmail.com', selected: true },
        { id: 4, name: 'Ankit Yadav', handle: '@ankity_', city: 'Bangalore', whatsapp: 'No Email', email: 'No Email', selected: true },
        { id: 5, name: 'Priya Singh', handle: '@priyargs', city: 'Delhi', whatsapp: '+91 9810 123456', email: 'psingh@example.com', selected: true },
        // Add more mock data if needed for scroll testing
    ];

    const [influencers, setInfluencers] = useState(initialInfluencers);
    const selectedCount = influencers.filter(i => i.selected).length;
    const allSelected = influencers.length > 0 && selectedCount === influencers.length;

    const toggleSelection = (id: number) => {
        setInfluencers(prev => prev.map(inf =>
            inf.id === id ? { ...inf, selected: !inf.selected } : inf
        ));
    };

    const toggleAll = () => {
        setInfluencers(prev => prev.map(inf => ({ ...inf, selected: !allSelected })));
    };

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    return (
        <DashboardLayout
            title={
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span onClick={() => navigate('/campaigns')} className="cursor-pointer hover:text-foreground transition">Campaigns</span>
                    <ChevronRight size={14} />
                    <span className="text-foreground">{decodedId}</span>
                </div>
            }
            chatSessions={chatSessions}
            isLoading={isSessionsLoading}
            onDeleteSession={deleteSession}
        >
            <div className="p-8 min-h-full bg-background">
                <h2 className="text-xl font-medium text-foreground mb-6">Imported Influencers ({influencers.length})</h2>

                {/* Table Container */}
                <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-xl mb-24">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-muted-foreground">
                            <thead className="text-xs uppercase bg-muted/50 text-foreground font-medium">
                                <tr>
                                    <th className="px-6 py-4 w-12">
                                        <div
                                            onClick={toggleAll}
                                            className={`w-4 h-4 rounded border ${allSelected ? 'bg-primary/20 border-primary' : 'border-border bg-muted/50'} flex items-center justify-center cursor-pointer transition-colors`}
                                        >
                                            {allSelected && <CheckSquare size={12} className="text-primary opacity-100" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium">IG Handle</th>
                                    <th className="px-6 py-4 font-medium">City</th>
                                    <th className="px-6 py-4 font-medium">WhatsApp</th>
                                    <th className="px-6 py-4 font-medium">Email</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {influencers.map((influencer) => (
                                    <tr
                                        key={influencer.id}
                                        className={`transition-colors group ${influencer.selected ? 'bg-primary/5' : 'hover:bg-muted/20'}`}
                                        onClick={() => toggleSelection(influencer.id)}
                                    >
                                        <td className="px-6 py-4">
                                            <div
                                                className={`w-5 h-5 rounded border ${influencer.selected ? 'bg-primary/20 border-primary' : 'border-border bg-muted/50'} flex items-center justify-center cursor-pointer transition-colors`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelection(influencer.id);
                                                }}
                                            >
                                                {influencer.selected && <CheckSquare size={14} className="text-primary" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-foreground">{influencer.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{influencer.handle}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{influencer.city}</td>
                                        <td className="px-6 py-4">
                                            {influencer.whatsapp.startsWith('+') ? (
                                                <span className="text-foreground">{influencer.whatsapp}</span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-orange-400/80 text-xs bg-orange-500/10 px-2 py-1 rounded-md w-fit">
                                                    <AlertCircle size={12} />
                                                    {influencer.whatsapp}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {influencer.email.includes('@') ? (
                                                <span className="text-foreground">{influencer.email}</span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-orange-400/80 text-xs bg-orange-500/10 px-2 py-1 rounded-md w-fit">
                                                    <AlertCircle size={12} />
                                                    {influencer.email}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border bg-background/90 backdrop-blur-md z-50 flex items-center justify-between pl-72">
                    {/* pl-72 accounts for sidebar width (w-64) + padding */}
                    <div className="text-muted-foreground text-sm">
                        <span className="text-foreground font-medium">{selectedCount} influencers</span> selected
                    </div>

                    <button
                        onClick={() => setIsReviewModalOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-primary/20"
                    >
                        Review & Reach Out
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Review Modal */}
            {isReviewModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)} />
                    <div className="relative bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Review Your Outreach</h2>
                                <p className="text-sm text-muted-foreground mt-1">Review and customize outreach messages before sending.</p>
                            </div>
                            <button
                                onClick={() => setIsReviewModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-background/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">

                                {/* WhatsApp Section */}
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                                        <h3 className="font-medium text-foreground flex items-center gap-2">
                                            <MessageSquare size={16} className="text-green-500" />
                                            WhatsApp
                                        </h3>
                                    </div>

                                    <div className="flex-1 bg-card border border-border rounded-xl p-4 flex flex-col shadow-inner">
                                        <textarea
                                            className="w-full flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground resize-none text-sm leading-relaxed min-h-[300px]"
                                            defaultValue={`Hi {{ name }},\n\nWe loved your content on {{ niche }} and are launching a new {{ brand }} skincare line. We'd love to send you free products + partner on a paid campaign.\n\nLet me know if you're interested! 😉\nThanks!`}
                                        />
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                                            <span className="hover:text-primary cursor-pointer transition">Keep Editing</span>
                                            <span>222 characters</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center border border-indigo-500 shadow-lg shadow-indigo-500/20">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </div>
                                            <span className="text-foreground font-medium group-hover:text-primary transition">Send WhatsApp</span>
                                        </label>

                                        <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
                                            <span className="text-sm text-muted-foreground">Rate limit</span>
                                            <select className="bg-transparent border-none text-foreground text-sm focus:ring-0 cursor-pointer">
                                                <option>Send 5 messages / minute</option>
                                                <option>Send 10 messages / minute</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Gmail Section */}
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-4 bg-red-500 rounded-full" />
                                        <h3 className="font-medium text-foreground flex items-center gap-2">
                                            <Mail size={16} className="text-red-500" />
                                            Gmail
                                        </h3>
                                    </div>

                                    <div className="flex-1 bg-card border border-border rounded-xl flex flex-col shadow-inner overflow-hidden">
                                        {/* Subject Line */}
                                        <div className="px-4 py-3 border-b border-border flex gap-2 items-center">
                                            <span className="text-sm text-muted-foreground">Subject:</span>
                                            <input
                                                type="text"
                                                defaultValue="Let's do a collab?"
                                                className="bg-transparent border-none focus:ring-0 text-foreground text-sm flex-1 placeholder:text-muted-foreground"
                                            />
                                        </div>

                                        <div className="flex-1 p-4 flex flex-col">
                                            <textarea
                                                className="w-full flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground resize-none text-sm leading-relaxed min-h-[300px]"
                                                defaultValue={`Hi {{ name }},\n\nI hope this email finds you well! We're excited to be working with {{ brand }} for the launch of their new skincare line. We think your content would be a fantastic fit for this campaign, and we'd like to offer you free products + a paid partnership.\n\nInterested? I'd love to discuss this further, including the details of the collab and compensation.\n\nBest,\n[Your name]`}
                                            />
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                                                <span className="hover:text-primary cursor-pointer transition">Keep Editing</span>
                                                <span>293 characters</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-border bg-card flex justify-between items-center">
                            <button className="text-muted-foreground hover:text-foreground text-sm font-medium transition px-4 py-2 rounded-lg hover:bg-muted">
                                Save as Template
                            </button>
                            <button
                                onClick={() => navigate(`/campaigns/${encodeURIComponent(decodedId)}/track`)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-medium transition shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                Send Outreach
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default CampaignDetails;
