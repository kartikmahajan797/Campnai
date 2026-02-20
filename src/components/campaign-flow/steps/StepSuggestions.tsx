import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { useNavigate } from 'react-router-dom';
import {
  X, CheckCircle2, TrendingUp, Target, Zap, Info,
  Instagram, Youtube, MapPin, Users, ArrowRight, AlertCircle, RotateCcw, FileText
} from 'lucide-react';
import { auth } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../../config/api';
import { CampaignService } from '../../../services/CampaignService';
import type { InfluencerSuggestion } from '../CampaignContext';
import { calculateInfluencerDisplayFields, formatFollowers, normalizeInfluencerData, getBanner } from '../../../utils/influencerUtils';
import { DUMMY_INFLUENCER } from '../../../utils/dummyData';
import { FreelancerProfileCard } from '../../ui/freelancer-profile-card';
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
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


async function fetchInfluencers(preferences: {
  primaryGoal: string;
  budgetRange: string;
  timeline: string;
}): Promise<InfluencerSuggestion[]> {
  try {
    const user = auth.currentUser || await new Promise<any>((resolve) => {
      const unsub = auth.onAuthStateChanged(u => { unsub(); resolve(u); });
    });
    if (!user) {
      console.warn('[Campaign] No auth user — cannot fetch influencers');
      return [];
    }

    const token = await user.getIdToken();

    const queryParts: string[] = [];
    if (preferences.primaryGoal) queryParts.push(preferences.primaryGoal);
    if (preferences.budgetRange) queryParts.push(preferences.budgetRange);
    const query = queryParts.length > 0
      ? `influencers for ${queryParts.join(' ')}`
      : 'top influencers for brand campaign';

    const params = new URLSearchParams({ q: query, topK: '10' });
    const url = `${API_BASE_URL}/search-influencers?${params}`;
    console.log('[Campaign] Fetching:', url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('[Campaign] Response status:', res.status);

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[Campaign] Search API error:', res.status, errBody);
      return [];
    }

    const data = await res.json();
    console.log('[Campaign] Got', data.total, 'influencers from API');

    return (data.influencers || []).map((inf: any, idx: number) => {
      // ── API returns NESTED object (formatForSearchAPI output) ──────────
      // inf.match.score, inf.audience.mf_split, inf.pricing.display,
      // inf.contact.phone, inf.contact.email, inf.engagement_rate (flat),
      // inf.handle (flat), inf.instagram_url (flat), inf.followers (flat)

      const matchScore = Math.round(inf.match?.score ?? 0);
      const er = parseFloat(String(inf.engagement_rate || 0)) || 0;
      const avgViewsNum = parseInt(String(inf.avg_views || 0)) || 0;

      // Audience nested
      const mfSplit = inf.audience?.mf_split || null;
      const indiaSplit = inf.audience?.india_split || null;
      const ageGroup = inf.audience?.age_group || null;
      const indiaPct = inf.audience?.india_pct ?? null;

      // Brand
      const brandFit = inf.brand_fit || null;
      const vibe = inf.vibe || null;

      // Pricing nested
      const priceDisplay = inf.pricing?.display || null;

      // Contact nested
      const phone = inf.contact?.phone || null;
      const email = inf.contact?.email || null;

      // Instagram
      const igUrl = inf.instagram_url || '';
      const handle = inf.handle || (inf.name ? `@${inf.name.replace(/\s+/g, '_').toLowerCase()}` : '—');

      // ── Engagement display ────────────────────────────────────────────
      const erDisplay = er > 0 ? `${er}%` : null;

      const { whySuggested, expectedROI, performanceBenefits } = calculateInfluencerDisplayFields({
        niche: (inf.niche || inf.type || '—').split(',')[0].trim(),
        location: inf.location || '—',
        matchScore,
        engagementRate: String(er), // ensure string for util if needed, but util handles it
        avgViews: String(avgViewsNum),
        mfSplit,
        indiaSplit,
        ageGroup,
        brandFit,
        vibe,
      });

      const safeId = inf.id ? String(inf.id) : `inf_${idx}_${(handle || inf.name || 'anon').replace(/[^a-z0-9]/gi, '')}`;

      return {
        id: safeId,
        name: inf.name || 'Unknown Creator',
        handle,
        platform: 'Instagram' as const,
        followers: inf.followers ? formatFollowers(Number(inf.followers)) : '—',
        niche: (inf.niche || inf.type || '—').split(',')[0].trim(),
        pricePerPost: priceDisplay || '—',
        location: inf.location || '—',
        matchScore,
        engagementRate: erDisplay,
        avatar: '',
        tier: matchScore >= 65 ? 'A' as const : 'B' as const,
        whySuggested: whySuggested || '',
        expectedROI: expectedROI || '',
        performanceBenefits: performanceBenefits || '',
        vibe,
        brandFit,
        mfSplit,
        indiaSplit,
        ageGroup,
        avgViews: avgViewsNum > 0 ? formatFollowers(avgViewsNum) : null,
        phone,
        email,
        instagramUrl: igUrl || null,
        scoreBreakdown: inf.score_breakdown || null,
        executionSteps: [
          'Initial outreach via DM or email',
          'Share campaign brief & mood board',
          'Content creation & review round',
          'Publish and track performance metrics',
        ],
      };
    });
  } catch (err) {
    console.error('Failed to fetch influencers:', err);
    return [];
  }
}


const InfoModal: React.FC<{
  influencer: InfluencerSuggestion;
  onClose: () => void;
}> = ({ influencer, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-black/20 dark:bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-5xl h-[90vh] bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-2xl relative shadow-2xl flex flex-col md:flex-row overflow-hidden transition-colors duration-300"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-6 right-6 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors p-2 z-50 bg-black/5 dark:bg-black/50 rounded-full backdrop-blur-md"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full md:w-1/3 h-full overflow-y-auto bg-black/5 dark:bg-white/5 border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 p-8 md:p-10 flex flex-col gap-8 transition-colors custom-scrollbar">
          <div className="flex flex-col items-center text-center">
            {(() => {
              return (
                <div className="relative mb-8 mt-4">
                   <div className="absolute inset-0 rounded-full border-2 border-zinc-50 dark:border-zinc-800 scale-110" />
                   <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-900 shadow-xl mx-auto bg-zinc-100 dark:bg-zinc-800">
                     <AvatarFallback className="text-5xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{influencer.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                   </Avatar>
                </div>
              );
            })()}
            <h3 className="text-black dark:text-white text-3xl font-bold leading-tight mb-3 transition-colors px-4 text-center">{influencer.name}</h3>
            <a
              href={`https://www.instagram.com/${influencer.handle?.replace('@', '') || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black/50 dark:text-white/50 text-lg font-medium mb-8 transition-colors hover:text-black dark:hover:text-white hover:underline"
            >
              {influencer.handle}
            </a>

            <div className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold shadow-lg tracking-wide mb-8 transition-colors">
              {influencer.matchScore}% Match Score
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center gap-1 shadow-sm dark:shadow-none transition-colors">
                <Users className="w-5 h-5 text-black/50 dark:text-white/50 mb-1" />
                <span className="text-lg font-bold text-black dark:text-white">{influencer.followers}</span>
                <span className="text-[10px] uppercase text-black/30 dark:text-white/30 font-bold tracking-wider">Followers</span>
              </div>
              <div className="p-4 bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center gap-1 shadow-sm dark:shadow-none transition-colors">
                <TrendingUp className="w-5 h-5 text-black/50 dark:text-white/50 mb-1" />
                <span className="text-lg font-bold text-black dark:text-white">
                  {influencer.engagementRate || '—'}
                </span>
                <span className="text-[10px] uppercase text-black/30 dark:text-white/30 font-bold tracking-wider">Engagement</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {influencer.location !== '—' && (
              <div className="flex items-center gap-3 text-black/60 dark:text-white/60 text-sm p-3 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-black/5 dark:border-none transition-colors">
                <MapPin className="w-4 h-4 text-black/40 dark:text-white/40" />
                <span>{influencer.location}</span>
              </div>
            )}
            {influencer.pricePerPost && influencer.pricePerPost !== '—' && (
              <div className="flex items-center gap-3 text-black/60 dark:text-white/60 text-sm p-3 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-black/5 dark:border-none transition-colors">
                <span className="font-semibold text-black dark:text-white">Est. {influencer.pricePerPost}</span>
              </div>
            )}
            {influencer.phone && (
              <div className="flex items-center gap-3 text-black/60 dark:text-white/60 text-sm p-3 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-none transition-colors">
                <span>📞 {influencer.phone}</span>
              </div>
            )}
            {influencer.email && (
              <div className="flex items-center gap-3 text-black/60 dark:text-white/60 text-sm p-3 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-none transition-colors">
                <span>✉️ {influencer.email}</span>
              </div>
            )}
          </div>

          <div className="mt-auto">
            <a
              href={`https://www.instagram.com/${influencer.handle?.replace('@', '').replace(/https?:\/\/(www\.)?instagram\.com\//gi, '') || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 text-sm font-bold text-white dark:text-black bg-black dark:bg-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg"
            >
              <Instagram className="w-4 h-4" />
              <span>View Profile</span>
            </a>
          </div>
        </div>

        <div className="w-full md:w-2/3 p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <div className="space-y-10">

            <section>
              <div className="flex items-center gap-3 text-black/40 dark:text-white/40 text-xs font-bold tracking-widest uppercase mb-4 transition-colors">
                <Target className="w-4 h-4 text-black dark:text-white transition-colors" />
                <span>AI Analysis</span>
              </div>
              <h4 className="text-xl font-semibold text-black dark:text-white mb-3 transition-colors">Why This Creator?</h4>
              <p className="text-black/70 dark:text-white/70 text-base leading-relaxed bg-black/5 dark:bg-white/5 p-8 rounded-2xl border border-black/5 dark:border-white/5 transition-colors break-words hyphens-auto">
                {influencer.whySuggested}
              </p>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <section>
                <div className="flex items-center gap-3 text-black/40 dark:text-white/40 text-xs font-bold tracking-widest uppercase mb-4 transition-colors">
                  <TrendingUp className="w-4 h-4 text-black dark:text-white transition-colors" />
                  <span>ROI Projection</span>
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-8 rounded-2xl border border-black/5 dark:border-white/5 h-full transition-colors">
                  <p className="text-black/70 dark:text-white/70 text-sm leading-relaxed transition-colors break-words hyphens-auto">{influencer.expectedROI}</p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 text-black/40 dark:text-white/40 text-xs font-bold tracking-widest uppercase mb-4 transition-colors">
                  <Zap className="w-4 h-4 text-black dark:text-white transition-colors" />
                  <span>Key Strengths</span>
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-8 rounded-2xl border border-black/5 dark:border-white/5 h-full transition-colors">
                  <p className="text-black/70 dark:text-white/70 text-sm leading-relaxed transition-colors break-words hyphens-auto">{influencer.performanceBenefits}</p>
                </div>
              </section>
            </div>

            {/* Execution Plan */}
            {influencer.executionSteps && influencer.executionSteps.length > 0 && (
              <section>
                <div className="flex items-center gap-3 text-black/40 dark:text-white/40 text-xs font-bold tracking-widest uppercase mb-4 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-black dark:text-white transition-colors" />
                  <span>Recommended Outreach</span>
                </div>
                <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden transition-colors">
                  {influencer.executionSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-black/90 dark:text-white/90 text-sm font-bold shrink-0 transition-colors">
                        {i + 1}
                      </div>
                      <span className="text-black/80 dark:text-white/80 text-base transition-colors">{step}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Audience & Score Details */}
            {((influencer as any).scoreBreakdown || influencer.mfSplit || influencer.ageGroup) && (
              <section className="mt-12 pt-10 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3 text-black/40 dark:text-white/40 text-xs font-bold tracking-widest uppercase mb-4 transition-colors">
                  <Users className="w-4 h-4 text-black dark:text-white transition-colors" />
                  <span>Audience & Score Details</span>
                </div>
                <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 p-8 space-y-5 transition-colors">
                  {influencer.mfSplit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black/50 dark:text-white/50">Audience M/F Split</span>
                      <span className="text-black dark:text-white font-medium">{influencer.mfSplit}</span>
                    </div>
                  )}
                  {influencer.indiaSplit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black/50 dark:text-white/50">India / Global Split</span>
                      <span className="text-black dark:text-white font-medium">{influencer.indiaSplit}</span>
                    </div>
                  )}
                  {influencer.ageGroup && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black/50 dark:text-white/50">Age Concentration</span>
                      <span className="text-black dark:text-white font-medium">{influencer.ageGroup}</span>
                    </div>
                  )}
                  {influencer.avgViews && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black/50 dark:text-white/50">Avg. Views/Post</span>
                      <span className="text-black dark:text-white font-medium">{influencer.avgViews}</span>
                    </div>
                  )}
                  {influencer.scoreBreakdown && Object.keys(influencer.scoreBreakdown).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mb-3">Score Breakdown</p>
                      {Object.entries(influencer.scoreBreakdown).map(([key, val]: [string, any]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-black/50 dark:text-white/50 w-24 capitalize">{key}</span>
                          <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-black dark:bg-white rounded-full transition-all"
                              style={{ width: `${val?.score ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-black dark:text-white font-bold w-8 text-right">{val?.score ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


const StepSuggestions: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, suggestions, setSuggestions, resetCampaign, shortlist, addToShortlist, removeFromShortlist, campaignId, nextStep } = useCampaign();
  const [selectedModal, setSelectedModal] = useState<InfluencerSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Hydrate suggestions for display - mirrors CampaignDetails logic to fix missing data
  const displaySuggestions = React.useMemo(() => {
    const hydrated = suggestions.map(s => {
      let norm = normalizeInfluencerData(s) as InfluencerSuggestion;
      if (!norm.whySuggested || norm.whySuggested === '—' || !norm.expectedROI || norm.expectedROI === '—' || !norm.executionSteps) {
        const calculated = calculateInfluencerDisplayFields(norm);
        norm = { ...norm, ...calculated };
      }
      return norm;
    });
    // Always show dummy influencer first (for demo/testing)
    return [DUMMY_INFLUENCER, ...hydrated.filter(s => s.id !== DUMMY_INFLUENCER.id)];
  }, [suggestions]);

  // Reset Handler
  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetCampaign();
    setShowResetConfirm(false);
  };

  // Suggestions come from generate-suggestions endpoint (called in StepPersonalize)
  // No fallback fetch here — we always use the budget-aware backend endpoint

  const handleApprove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Approve clicked - syncing data and navigating...');

    if (!campaignId) {
      console.error("No campaign ID found, cannot save suggestions.");
      // Fallback: try to create campaign? Or just navigate to dashboard
      navigate('/dashboard');
      return;
    }

    // Force save suggestions and shortlist before navigating
    try {
      // Show some loading indicator if needed, but for now just await
      await Promise.all([
        CampaignService.updateSuggestions(campaignId, suggestions),
        CampaignService.saveShortlist(campaignId, shortlist) // Ensure shortlist is also synced
      ]);
      console.log("Data synced successfully.");
    } catch (err) {
      console.error("Error syncing campaign data:", err);
      // Proceed anyway? Or alert?
    }

    navigate(`/campaigns/${campaignId}`);
  };

  const topScore = displaySuggestions.length > 0 ? Math.max(...displaySuggestions.map(s => s.matchScore)) : 0;

  const totalPages = Math.ceil(displaySuggestions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageItems = displaySuggestions.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen pt-12 px-6 md:px-12 pb-12 gap-10 max-w-[1600px] mx-auto text-foreground relative" onClick={(e) => e.stopPropagation()}>
      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="absolute top-6 right-6 md:top-12 md:right-12 z-30 flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-background/60 backdrop-blur-md rounded-full border border-border hover:bg-muted transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden md:inline">Reset Campaign</span>
      </button>

      {/* Left Sidebar - Sticky */}
      <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-10 lg:h-fit flex flex-col gap-8">
        <div className="bg-card backdrop-blur-xl rounded-3xl p-8 border border-border shadow-md space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-black/40 dark:text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-muted-foreground">Discovery</span>
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-foreground leading-tight">
              Scout
            </h1>
            <p className="text-black/40 dark:text-muted-foreground text-base mt-2">Influencer Discovery AI</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center p-3 bg-muted/40 dark:bg-muted/20 border border-border/50 rounded-xl text-sm">
              <span className="text-muted-foreground">Analyzed</span>
              <span className="font-medium text-foreground">1,842 creators</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/40 dark:bg-muted/20 border border-border/50 rounded-xl text-sm">
              <span className="text-muted-foreground">Matches</span>
              <span className="font-bold text-foreground">Top {displaySuggestions.length > 0 ? displaySuggestions.length : '10'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/40 dark:bg-muted/20 border border-border/50 rounded-xl text-sm">
              <span className="text-muted-foreground">Goal</span>
              <span className="font-medium text-foreground">{preferences.primaryGoal || 'Engagement'}</span>
            </div>
          </div>

          <div className="pt-4 w-full space-y-3">
            {/* Action Buttons */}
            <button
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-colors shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isGeneratingReport || isSkipping}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsGeneratingReport(true);
                if (campaignId) {
                  try {
                    await Promise.all([
                      CampaignService.updateSuggestions(campaignId, suggestions),
                      CampaignService.saveShortlist(campaignId, shortlist),
                    ]);
                  } catch (err) { console.error('Sync error:', err); }
                }
                nextStep(); 
              }}
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generate Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-muted-foreground bg-transparent hover:bg-secondary/20 hover:text-foreground rounded-2xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-border/50"
              disabled={isGeneratingReport || isSkipping}
              onClick={async (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 setIsSkipping(true);
                 await handleApprove(e);
                 // State stays true until navigation
              }}
            >
              {isSkipping ? (
                 <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <span>{shortlist.length > 0 ? `Save & View ${shortlist.length} Shortlisted` : 'Skip to Details'}</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Right Content - Scrollable Grid */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 pb-4 pt-2 mb-4 border-b border-border/40">
          <h2 className="text-3xl font-light text-foreground mb-1 transition-colors">
            <span className="font-bold">Shortlisted Creators</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl transition-colors">
            Scout has identified the best matches for your campaign based on your brief.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-8 py-20 text-center flex-1">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-black/5 dark:border-white/5" />
              <div className="absolute inset-0 rounded-full border-4 border-t-black dark:border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 rounded-full bg-black/5 dark:bg-white/5 blur-xl animate-pulse" />
            </div>
            <p className="text-black/50 dark:text-white/50 text-lg font-medium animate-pulse">
              Searching for the best creators...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center flex-1">
            <AlertCircle className="w-12 h-12 text-gray-400" />
            <p className="text-2xl font-semibold text-black">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && displaySuggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center flex-1">
            <AlertCircle className="w-12 h-12 text-gray-400" />
            <p className="text-2xl font-semibold text-black">No creators found</p>
            <p className="text-black/50 text-base max-w-md">
              Please go back to Personalize and click "Find Creators" to search based on your budget and goal.
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          {currentPageItems.map((inf, i) => {
            const isShortlisted = shortlist.includes(inf.id);
            // Construct fallback URL - use strict instagram unavatar with no fallback to avoid generic logos/twitch
            const handle = inf.instagramUrl 
              ? inf.instagramUrl.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, '').replace(/\/$/, '')
              : (inf.handle ? inf.handle.replace('@', '') : undefined);
            const igFallback = handle ? `https://unavatar.io/instagram/${handle}?fallback=false` : undefined;
            
            return (
              <FreelancerProfileCard
                key={inf.id}
                name={inf.name}
                title={inf.niche || inf.handle}
                avatarSrc={igFallback || ''}
                backupSrc={inf.avatar || undefined}
                rating={inf.matchScore ? `${inf.matchScore}%` : "New"}
                duration={inf.followers}
                rate={inf.engagementRate || '—'}
                location={inf.location !== '—' ? inf.location : undefined}
                handle={inf.handle}
                instagramUrl={inf.instagramUrl || undefined}
                isBookmarked={isShortlisted}
                onBookmark={() => isShortlisted ? removeFromShortlist(inf.id) : addToShortlist(inf.id)}
                onGetInTouch={() => setSelectedModal(inf)}
                tools={
                  (inf.brandFit || "").split(',').filter(Boolean).slice(0, 3).map((tag) => tag.trim())
                }
                className="w-full"
              />
            );
          })}
        </div>

        {!isLoading && displaySuggestions.length > 0 && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12 pt-8 border-t border-black/5 dark:border-white/5">
            <button
              className="flex items-center gap-2 px-6 h-12 text-base font-semibold text-black dark:text-white bg-transparent border border-black/30 dark:border-white/30 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/60 dark:hover:border-white/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-black/30 dark:disabled:hover:border-white/30"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentPage > 1) setCurrentPage(currentPage - 1);
              }}
              disabled={currentPage === 1}
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span>Prev</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`min-w-[48px] h-12 px-4 text-base font-semibold rounded-xl border transition-all ${currentPage === page
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-transparent text-black dark:text-white border-black/30 dark:border-white/30 hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/60 dark:hover:border-white/60'
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentPage(page);
                }}
              >
                {page}
              </button>
            ))}

            <button
              className="flex items-center gap-2 px-6 h-12 text-base font-semibold text-black dark:text-white bg-transparent border border-black/30 dark:border-white/30 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/60 dark:hover:border-white/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-black/30 dark:disabled:hover:border-white/30"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
              }}
              disabled={currentPage === totalPages}
            >
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedModal && (
          <InfoModal
            influencer={selectedModal}
            onClose={() => {
              console.log('Closing modal');
              setSelectedModal(null);
            }}
          />
        )}
      </AnimatePresence>


      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your current results and preferences. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} className="bg-red-600 text-white hover:bg-red-700 border-none">Reset Campaign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StepSuggestions;