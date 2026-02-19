import React, { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { CampaignService } from '@/services/CampaignService';

const NewCampaignSuccess = () => {
    const navigate = useNavigate();
    const [isNaming, setIsNaming] = useState(false);
    const [campaignName, setCampaignName] = useState("");

    const { state } = useLocation();
    const campaignId = state?.campaignId;
    
    // If we don't have an ID (e.g. direct access), we can't really "save" to a campaign.
    // But for the user's specific "Process not found" error, we need to ensure we don't navigate to a non-existent route.

    const handleSave = async () => {
        if (!campaignName.trim()) return;
        
        try {
            if (campaignId) {
                // Update the actual campaign
                await CampaignService._updateCampaign(campaignId, { name: campaignName.trim() });
                navigate(`/campaigns/${campaignId}`);
            } else {
                // Fallback for testing/direct access without ID:
                // We could create a dummy campaign, but that might be complex.
                // For now, let's redirect to dashboard or campaigns with a toast.
                // Or, assume the user might have entered a name for a *new* campaign context that doesn't exist yet.
                // Given the error "Process not found", navigating to /campaigns/Name is the issue.
                // Let's navigate to /campaigns instead.
                console.warn("No campaign ID found to update. Redirecting to campaigns list.");
                navigate('/campaigns');
            }
        } catch (error) {
            console.error("Failed to update name:", error);
            // Optionally show error toast
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => navigate('/campaigns')}>Campaigns</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">New Campaign</span>
        </div>
    );

    return (
        <DashboardLayout title={breadcrumbs}>
            <div className="flex items-center justify-center h-full w-full p-6">
                <div className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10">
                        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3 flex items-center justify-center gap-3">
                            Your campaign is almost ready <Sparkles className="text-yellow-400 w-6 h-6" />
                        </h2>

                        <p className="text-muted-foreground text-lg mb-8">
                            Add a name and start outreach.
                        </p>

                        {!isNaming ? (
                            <>
                                <Button
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-xl text-lg font-medium w-full shadow-lg shadow-primary/20 mb-6"
                                    onClick={() => setIsNaming(true)}
                                >
                                    Name Campaign
                                </Button>

                                <button
                                    className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
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
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave();
                                    }}
                                />
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsNaming(false)}
                                        className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground font-medium py-6 rounded-xl transition"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={!campaignName.trim()}
                                        className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-medium py-6 rounded-xl transition shadow-lg shadow-primary/20"
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
