import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Instagram, MapPin, Users, TrendingUp, Zap, Target,
  CheckCircle2, Phone, Mail, ExternalLink, ArrowLeft, ChevronDown, ChevronUp, FileText, ArrowRight, LayoutDashboard
} from 'lucide-react';
import { CampaignService } from '../../services/CampaignService';
import type { InfluencerSuggestion } from '../campaign-flow/CampaignContext';
import { calculateInfluencerDisplayFields, formatFollowers, normalizeInfluencerData, getBanner } from '../../utils/influencerUtils';
import { FreelancerProfileCard } from '../ui/freelancer-profile-card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { PremiumBackground } from '../ui/premium-background';
import OutreachReviewModal from './OutreachReviewModal';

// ── helpers ───────────────────────────────────────────────────────────────────
function parseER(val: string | number | null | undefined): string {
  if (!val) return '—';
  const n = parseFloat(String(val));
  if (isNaN(n) || n === 0) return '—';
  return `${n}%`;
}

// ── Full-detail modal ─────────────────────────────────────────────────────────
const InfluencerModal: React.FC<{
  influencer: InfluencerSuggestion;
  onClose: () => void;
  onOutreach: () => void;
}> = ({ influencer: inf, onClose, onOutreach }) => {
  const igUsername = inf.handle?.replace('@', '') || '';
  const igLink = (inf as any).instagramUrl || (igUsername ? `https://www.instagram.com/${igUsername}` : '#');

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-border"
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-5 right-5 z-10 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* LEFT PANEL */}
        <div className="w-full md:w-[280px] shrink-0 bg-muted/30 border-b md:border-b-0 md:border-r border-border p-7 flex flex-col gap-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-foreground">
              {inf.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground leading-tight">{inf.name}</h3>
              <p className="text-muted-foreground text-sm mt-0.5">{inf.handle || '—'}</p>
            </div>
            {inf.matchScore > 0 && (
              <div className="px-4 py-1.5 bg-foreground text-background rounded-full text-sm font-bold">
                {inf.matchScore}% Match
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background rounded-2xl p-3 text-center border border-border">
              <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="font-bold text-foreground text-base">{inf.followers || '—'}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Followers</div>
            </div>
            <div className="bg-background rounded-2xl p-3 text-center border border-border">
              <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="font-bold text-foreground text-base">{parseER(inf.engagementRate)}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Engagement</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {inf.location && inf.location !== '—' && (
              <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4 text-muted-foreground/60 shrink-0" /><span>{inf.location}</span></div>
            )}
            {inf.niche && inf.niche !== '—' && (
              <div className="flex items-center gap-2 text-muted-foreground"><Zap className="w-4 h-4 text-muted-foreground/60 shrink-0" /><span>{inf.niche}</span></div>
            )}
            {inf.pricePerPost && inf.pricePerPost !== '—' && (
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <span className="text-muted-foreground text-xs">Est.</span><span>{inf.pricePerPost}</span>
              </div>
            )}
            {(inf as any).phone && (
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4 text-muted-foreground/60 shrink-0" /><span>{(inf as any).phone}</span></div>
            )}
            {(inf as any).email && (
              <div className="flex items-center gap-2 text-muted-foreground break-all"><Mail className="w-4 h-4 text-muted-foreground/60 shrink-0" /><span className="text-xs">{(inf as any).email}</span></div>
            )}
          </div>

          <button 
              onClick={onOutreach}
              className="flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-colors mt-auto mb-3"
          >
            <Zap className="w-4 h-4" /> Send Outreach
          </button>

          <a href={igLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-foreground text-background rounded-2xl font-semibold text-sm hover:opacity-80 transition-colors">
            <Instagram className="w-4 h-4" /> View Profile
          </a>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 overflow-y-auto p-7 space-y-7">
          {/* Why This Creator */}
          <section>
            <Label icon={<Target className="w-4 h-4 text-muted-foreground" />} text="Why This Creator?" />
            <p className="text-muted-foreground text-sm leading-relaxed bg-muted/30 rounded-2xl p-5 border border-border">
              {inf.whySuggested || '—'}
            </p>
          </section>

          {/* ROI + Strengths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <section>
              <Label icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />} text="ROI Projection" />
              <div className="bg-muted/30 rounded-2xl p-5 border border-border h-full">
                <p className="text-muted-foreground text-sm leading-relaxed">{inf.expectedROI || '—'}</p>
              </div>
            </section>
            <section>
              <Label icon={<Zap className="w-4 h-4 text-muted-foreground" />} text="Key Strengths" />
              <div className="bg-muted/30 rounded-2xl p-5 border border-border h-full">
                <p className="text-muted-foreground text-sm leading-relaxed">{inf.performanceBenefits || '—'}</p>
              </div>
            </section>
          </div>

          {/* Audience Details */}
          {((inf as any).mfSplit || (inf as any).indiaSplit || (inf as any).ageGroup || (inf as any).avgViews) && (
            <section>
              <Label icon={<Users className="w-4 h-4 text-muted-foreground" />} text="Audience Details" />
              <div className="bg-muted/30 rounded-2xl p-5 border border-border space-y-3">
                {[(inf as any).mfSplit && ['M/F Split', (inf as any).mfSplit],
                  (inf as any).indiaSplit && ['India / Global', (inf as any).indiaSplit],
                  (inf as any).ageGroup && ['Age Group', (inf as any).ageGroup],
                  (inf as any).avgViews && ['Avg Views/Post', (inf as any).avgViews]
                ].filter(Boolean).map(([label, value]: any) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Brand Fit + Vibe */}
          {((inf as any).brandFit || (inf as any).vibe) && (
            <section>
              <Label icon={<Zap className="w-4 h-4 text-muted-foreground" />} text="Brand Fit" />
              <div className="bg-muted/30 rounded-2xl p-5 border border-border space-y-3">
                {(inf as any).brandFit && (
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {(inf as any).brandFit.split(',').map((tag: string) => (
                        <span key={tag} className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">{tag.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(inf as any).vibe && (
                  <p className="text-muted-foreground text-sm italic leading-relaxed">"{(inf as any).vibe}"</p>
                )}
              </div>
            </section>
          )}

          {/* Score Breakdown */}
          {(inf as any).scoreBreakdown && Object.keys((inf as any).scoreBreakdown).length > 0 && (
            <section>
              <Label icon={<CheckCircle2 className="w-4 h-4 text-muted-foreground" />} text="Score Breakdown" />
              <div className="bg-muted/30 rounded-2xl p-5 border border-border space-y-3">
                {Object.entries((inf as any).scoreBreakdown).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 capitalize">{key}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-foreground rounded-full" style={{ width: `${val?.score ?? 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-foreground w-7 text-right">{val?.score ?? 0}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Label: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
    {icon}<span>{text}</span>
  </div>
);



// ── Main Page ─────────────────────────────────────────────────────────────────
const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModal, setSelectedModal] = useState<InfluencerSuggestion | null>(null);
  const [outreachInfluencer, setOutreachInfluencer] = useState<InfluencerSuggestion | null>(null);

  const handleOutreachSend = (channels: string[], messages: any) => {
      console.log("Sending outreach via:", channels, messages);
      // Simulate API call
      setTimeout(() => {
        setOutreachInfluencer(null);
        if (id) {
            navigate(`/campaigns/${id}/track`);
        }
      }, 500);
  };

  useEffect(() => {
    if (!id) return;
    CampaignService.getCampaign(id)
      .then(data => { setCampaign(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-black/40 text-lg">Campaign not found.</p>
        <button onClick={() => navigate('/dashboard')} className="px-5 py-2 bg-black text-white rounded-full text-sm font-semibold">Back to Dashboard</button>
      </div>
    );
  }

  // Get shortlisted influencers (filter from suggestions using shortlist IDs, or use all suggestions)
  const rawSuggestions: InfluencerSuggestion[] = campaign.suggestions || [];
  
  const allSuggestions = rawSuggestions.map(s => {
      let norm = normalizeInfluencerData(s) as InfluencerSuggestion;

      if (!norm.whySuggested || norm.whySuggested === '—' || !norm.expectedROI || norm.expectedROI === '—') {
        const calculated = calculateInfluencerDisplayFields(norm);
        norm = { ...norm, ...calculated };
      }
      return norm;
  });

  const shortlistIds: string[] = campaign.shortlist || [];

  const shortlisted = shortlistIds.length > 0
    ? allSuggestions.filter(s => shortlistIds.includes(s.id))
    : allSuggestions;

  const analysis = campaign.analysisResult?.analysis || {};
  const meta = campaign.analysisResult?.meta || {};

  const toggleShortlist = async (infId: string) => {
      const isShortlisted = shortlistIds.includes(infId);
      let newShortlistIds;
      if (isShortlisted) {
          newShortlistIds = shortlistIds.filter(id => id !== infId);
      } else {
          newShortlistIds = [...shortlistIds, infId];
      }
      
      setCampaign((prev: any) => ({ ...prev, shortlist: newShortlistIds }));
      
      try {
          if (id) await CampaignService.saveShortlist(id, newShortlistIds);
      } catch (err) {
          console.error("Failed to update shortlist", err);
      }
  };

  return (
    <div className="min-h-screen py-10 px-4 md:px-10 flex flex-col lg:flex-row gap-10 max-w-[1600px] mx-auto relative font-sans selection:bg-black/10 dark:selection:bg-white/20 selection:text-black dark:selection:text-white">
      <PremiumBackground />
      
      {/* Left Sidebar - Sticky */}
      <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-10 lg:h-fit flex flex-col gap-8">
        {/* Back */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Campaign Info Card */}
        <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Campaign</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              {analysis.brand_name || campaign.name || 'Campaign Details'}
            </h1>
            <p className="text-muted-foreground text-base mt-2">{analysis.industry || ''}</p>
          </div>

          <div className="flex flex-col gap-3">
             {meta.top_match_score > 0 && (
                <div className="flex justify-between items-center p-3 bg-muted/40 border border-border/50 rounded-xl text-sm">
                  <span className="text-muted-foreground">Top Match Score</span>
                  <span className="font-bold text-foreground">{meta.top_match_score}%</span>
                </div>
              )}
              {campaign.preferences?.budgetRange && (
                <div className="flex justify-between items-center p-3 bg-muted/40 border border-border/50 rounded-xl text-sm">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium text-foreground">{campaign.preferences.budgetRange}</span>
                </div>
              )}
              {campaign.preferences?.primaryGoal && (
                <div className="flex justify-between items-center p-3 bg-muted/40 border border-border/50 rounded-xl text-sm">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-medium text-foreground">{campaign.preferences.primaryGoal}</span>
                </div>
              )}
              {campaign.preferences?.timeline && (
                <div className="flex justify-between items-center p-3 bg-muted/40 border border-border/50 rounded-xl text-sm">
                   <span className="text-muted-foreground">Timeline</span>
                   <span className="font-medium text-foreground">{campaign.preferences.timeline}</span>
                </div>
              )}
          </div>

          {/* Action Button */}


          
          <button
              onClick={() => navigate(`/campaign/new?id=${id}&step=5`)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg hover:shadow-primary/20"
            >
              <FileText className="w-4 h-4" />
              Generate Report
              <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Right Content */}
      <main className="flex-1 space-y-12">
        
        {/* Shortlisted Influencers */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Shortlisted Influencers <span className="text-muted-foreground ml-2">{shortlisted.length}</span>
            </h2>
          </div>

          {shortlisted.length === 0 ? (
            <div className="bg-card rounded-3xl p-12 border border-border text-center">
              <Users className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">No influencers shortlisted yet.</p>
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {shortlisted.map(inf => (
                  <FreelancerProfileCard
                    key={inf.id}
                    name={inf.name}
                    title={inf.niche || inf.handle}
                    avatarSrc={(inf.avatar && inf.avatar !== '') ? inf.avatar : ((inf as any).instagramUrl ? `https://unavatar.io/instagram/${(inf as any).instagramUrl.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, '').replace(/\/$/, '')}` : `https://unavatar.io/instagram/${(inf.handle || '').replace('@', '')}`)}
                    rating={inf.matchScore ? `${inf.matchScore}%` : "New"}
                    duration={inf.followers || '—'}
                    rate={inf.engagementRate || '—'}
                    location={inf.location !== '—' ? inf.location : undefined}
                    handle={inf.handle}
                    instagramUrl={(inf as any).instagramUrl || undefined}
                    isBookmarked={true}
                    onBookmark={() => toggleShortlist(inf.id)}
                    onGetInTouch={() => setSelectedModal(inf)}
                    tools={(inf.brandFit || "").split(',').filter(Boolean).slice(0, 3).map((tag: string) => tag.trim())}
                    className="w-full"
                  />
                ))}
              </div>
          )}
        </div>

        {/* All Suggestions (if shortlist is different) */}
        {shortlistIds.length > 0 && allSuggestions.length > shortlisted.length && (
          <div>
            <div className="flex items-center gap-3 mb-6 pt-10 border-t border-border">
               <h2 className="text-2xl font-bold text-foreground">
                All Suggested <span className="text-muted-foreground ml-2">{allSuggestions.length}</span>
              </h2>
            </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {allSuggestions.filter(s => !shortlistIds.includes(s.id)).map(inf => (
                  <FreelancerProfileCard
                    key={inf.id}
                    name={inf.name}
                    title={inf.niche || inf.handle}
                    avatarSrc={(inf.avatar && inf.avatar !== '') ? inf.avatar : ((inf as any).instagramUrl ? `https://unavatar.io/instagram/${(inf as any).instagramUrl.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, '').replace(/\/$/, '')}` : `https://unavatar.io/instagram/${(inf.handle || '').replace('@', '')}`)}
                    rating={inf.matchScore ? `${inf.matchScore}%` : "New"}
                    duration={inf.followers || '—'}
                    rate={inf.engagementRate || '—'}
                    location={inf.location !== '—' ? inf.location : undefined}
                    handle={inf.handle}
                    instagramUrl={(inf as any).instagramUrl || undefined}
                    isBookmarked={false}
                    onBookmark={() => toggleShortlist(inf.id)}
                    onGetInTouch={() => setSelectedModal(inf)}
                    tools={(inf.brandFit || "").split(',').filter(Boolean).slice(0, 3).map((tag: string) => tag.trim())}
                    className="w-full"
                  />
                ))}
              </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedModal && (
          <InfluencerModal
            influencer={selectedModal}
            onClose={() => setSelectedModal(null)}
            onOutreach={() => {
                setOutreachInfluencer(selectedModal);
                setSelectedModal(null);
            }}
          />
        )}
        
        {outreachInfluencer && (
            <OutreachReviewModal
                influencer={outreachInfluencer}
                onClose={() => setOutreachInfluencer(null)}
                onSend={(channels, messages) => {
                   handleOutreachSend(channels, messages);
                }}
            />
        )}
      </AnimatePresence>

      {/* Fixed Bottom Bar for Outreach Launch */}
      {shortlisted.length > 0 && (
        <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} 
            className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border flex justify-between items-center px-10 shadow-2xl z-40"
        >
            <div className="flex items-center gap-4">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-xs font-bold">
                    {shortlisted.length} Imported
                </div>
                <span className="text-muted-foreground text-sm font-medium">Ready for outreach sequence</span>
            </div>
            
             <button
              onClick={() => navigate(`/campaigns/${id}/track`)}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg hover:shadow-primary/20"
            >
              Launch Outreach Campaign <ArrowRight className="w-4 h-4" />
            </button>
        </motion.div>
      )}
    </div>
  );
};


export default CampaignDetails;
