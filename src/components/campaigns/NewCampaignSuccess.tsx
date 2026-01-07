import React, { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const NewCampaignSuccess = () => {
    const navigate = useNavigate();
    const [isNaming, setIsNaming] = useState(false);
    const [campaignName, setCampaignName] = useState("");

    const handleSave = () => {
        if (campaignName.trim()) {
            navigate(`/campaigns/${campaignName.trim()}`);
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 hover:text-slate-300 cursor-pointer" onClick={() => navigate('/campaigns')}>Campaigns</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-white font-medium">New Campaign</span>
        </div>
    );

    return (
        <DashboardLayout title={breadcrumbs}>
            <div className="flex items-center justify-center h-full w-full p-6">
                <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 flex items-center justify-center gap-3">
                            Your campaign is almost ready <Sparkles className="text-yellow-400 w-6 h-6" />
                        </h2>

                        <p className="text-slate-400 text-lg mb-8">
                            Add a name and start outreach.
                        </p>

                        {!isNaming ? (
                            <>
                                <Button
                                    className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-8 py-6 rounded-xl text-lg font-medium w-full shadow-lg shadow-indigo-500/20 mb-6"
                                    onClick={() => setIsNaming(true)}
                                >
                                    Name Campaign
                                </Button>

                                <button
                                    className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
                                    onClick={() => navigate('/campaigns')}
                                >
                                    &lt; Back to Campaigns
                                </button>
                            </>
                        ) : (
                            <div className="w-full space-y-4">
                                <input
                                    type="text"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    placeholder="Enter campaign name (e.g. 'June Skincare Push')"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave();
                                    }}
                                />
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsNaming(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-6 rounded-xl transition"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={!campaignName.trim()}
                                        className="flex-1 bg-[#6366f1] hover:bg-[#5558e6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-6 rounded-xl transition shadow-lg shadow-indigo-500/20"
                                    >
                                        Save & Continue
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NewCampaignSuccess;
