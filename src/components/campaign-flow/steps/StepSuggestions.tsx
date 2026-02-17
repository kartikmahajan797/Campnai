import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { useNavigate } from 'react-router-dom';
import {
  X, CheckCircle2, TrendingUp, Target, Zap, Info,
  Instagram, Youtube, MapPin, Users, ArrowRight, AlertCircle, RotateCcw
} from 'lucide-react';
import { auth } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../../config/api';
import type { InfluencerSuggestion } from '../CampaignContext';

async function fetchInfluencers(preferences: {
  primaryGoal: string;
  budgetRange: string;
  timeline: string;
}): Promise<InfluencerSuggestion[]> {
  try {
    const user = auth.currentUser;
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
      const scoreNum = parseFloat(inf.match_score) || 0;
      return {
        id: String(idx + 1),
        name: inf.name || 'Unknown Creator',
        handle: inf.instagram ? `@${inf.instagram.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, '').replace(/\/$/, '').replace('@', '')}` : '—',
        platform: 'Instagram' as const,
        followers: inf.followers ? formatFollowers(inf.followers) : '—',
        niche: inf.niche || inf.type || '—',
        pricePerPost: inf.commercials || '—',
        location: inf.location || '—',
        matchScore: Math.round(scoreNum),
        avatar: '',
        tier: scoreNum >= 60 ? 'A' as const : 'B' as const,
        whySuggested: buildWhySuggested(inf),
        expectedROI: inf.engagement_rate
          ? `${inf.engagement_rate}% engagement rate — strong audience interaction.`
          : 'Engagement data will be available after onboarding.',
        performanceBenefits: buildBenefits(inf),
        executionSteps: [
          'Initial outreach via DM or email',
          'Share campaign brief',
          'Content creation & review',
          'Publish and track performance',
        ],
      };
    });
  } catch (err) {
    console.error('Failed to fetch influencers:', err);
    return [];
  }
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function buildWhySuggested(inf: any): string {
  const parts: string[] = [];
  if (inf.niche) parts.push(`Specializes in ${inf.niche}`);
  if (inf.location) parts.push(`based in ${inf.location}`);
  if (inf.brand_fit) parts.push(`Brand fit: ${inf.brand_fit}`);
  if (inf.vibe) parts.push(`Vibe: ${inf.vibe}`);
  return parts.length > 0 ? parts.join('. ') + '.' : 'Matched based on campaign requirements.';
}

function buildBenefits(inf: any): string {
  const parts: string[] = [];
  if (inf.engagement_rate) parts.push(`${inf.engagement_rate}% engagement rate`);
  if (inf.avg_views) parts.push(`${formatFollowers(inf.avg_views)} avg views`);
  if (inf.mf_split) parts.push(`Audience split: ${inf.mf_split}`);
  if (inf.age_concentration) parts.push(`Age concentration: ${inf.age_concentration}`);
  return parts.length > 0 ? parts.join(', ') + '.' : 'Performance data available after campaign starts.';
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
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-[2rem] relative shadow-2xl flex flex-col md:flex-row overflow-hidden transition-colors duration-300 custom-scrollbar"
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

        <div className="w-full md:w-1/3 bg-black/5 dark:bg-white/5 border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 p-8 md:p-10 flex flex-col gap-8 transition-colors">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-white/10 border border-black/10 dark:border-white/20 flex items-center justify-center text-black dark:text-white text-4xl font-bold shadow-2xl mb-6 transition-colors">
              {influencer.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <h3 className="text-black dark:text-white text-2xl font-bold leading-tight mb-2 transition-colors">{influencer.name}</h3>
            <a 
              href={`https://www.instagram.com/${influencer.handle?.replace('@', '') || ''}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black/50 dark:text-white/50 text-base font-medium mb-6 transition-colors hover:text-black dark:hover:text-white hover:underline"
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
                {typeof influencer.performanceBenefits === 'string' && influencer.performanceBenefits.includes('%') ? `${influencer.performanceBenefits.split('%')[0]}%` : 'New'}
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
           {influencer.pricePerPost !== '—' && (
             <div className="flex items-center gap-3 text-black/60 dark:text-white/60 text-sm p-3 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-black/5 dark:border-none transition-colors">
                <span>Est. {influencer.pricePerPost}</span>
             </div>
           )}
        </div>
        
        <div className="mt-auto">
           <a
              href={`https://www.instagram.com/${influencer.handle?.replace('@', '').replace(/https?:\/\/(www\.)?instagram\.com\//gi, '') || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 text-sm font-bold text-white dark:text-black bg-black dark:bg-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg"
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
            <p className="text-black/70 dark:text-white/70 text-base leading-relaxed bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-black/5 dark:border-white/5 transition-colors break-words hyphens-auto">
              {influencer.whySuggested}
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section>
               <div className="flex items-center gap-3 text-black/40 dark:text-white/40 text-xs font-bold tracking-widest uppercase mb-4 transition-colors">
                <TrendingUp className="w-4 h-4 text-black dark:text-white transition-colors" />
                <span>ROI Projection</span>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-black/5 dark:border-white/5 h-full transition-colors">
                 <p className="text-black/70 dark:text-white/70 text-sm leading-relaxed transition-colors break-words hyphens-auto">{influencer.expectedROI}</p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 text-black/40 dark:text-white/40 text-xs font-bold tracking-widest uppercase mb-4 transition-colors">
                <Zap className="w-4 h-4 text-black dark:text-white transition-colors" />
                <span>Key Strengths</span>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-black/5 dark:border-white/5 h-full transition-colors">
                 <p className="text-black/70 dark:text-white/70 text-sm leading-relaxed transition-colors break-words hyphens-auto">{influencer.performanceBenefits}</p>
              </div>
            </section>
          </div>

          {/* Execution Plan */}
          <section>
            <div className="flex items-center gap-3 text-black/40 dark:text-white/40 text-xs font-bold tracking-widest uppercase mb-4 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-black dark:text-white transition-colors" />
              <span>Recommended Outreach</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden transition-colors">
               {influencer.executionSteps?.map((step, i) => (
                 <div key={i} className="flex items-center gap-4 p-5 border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-black/90 dark:text-white/90 text-sm font-bold shrink-0 transition-colors">
                      {i + 1}
                    </div>
                    <span className="text-black/80 dark:text-white/80 text-base transition-colors">{step}</span>
                 </div>
               ))}
            </div>
          </section>

        </div>
      </div>
    </motion.div>
  </motion.div>
  );
};

const InfluencerCard: React.FC<{
  influencer: InfluencerSuggestion;
  index: number;
  onInfo: () => void;
}> = ({ influencer, index, onInfo }) => {
  const instagramUsername = influencer.handle?.replace('@', '').replace(/https?:\/\/(www\.)?instagram\.com\//gi, '') || '';
  const instagramLink = `https://www.instagram.com/${instagramUsername}`;

  return (
    <div 
      className={`relative flex flex-col gap-6 p-8 bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-[2rem] transition-all duration-300 overflow-visible backdrop-blur-md`}
      onClick={onInfo}
      style={{ cursor: 'pointer' }}
    >
      <div className="absolute top-6 right-6 px-4 py-2 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white rounded-xl text-sm font-bold shadow-lg z-10 transition-colors">
        {influencer.matchScore}% Match
      </div>

      <div className="flex items-center gap-6 mb-2">
        <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-black dark:text-white text-3xl font-bold shrink-0 shadow-lg group-hover:border-black/20 dark:group-hover:border-white/20 transition-colors">
          {influencer.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h4 className="text-black dark:text-white font-bold text-2xl truncate leading-tight group-hover:text-black/80 dark:group-hover:text-white/90 transition-colors">{influencer.name}</h4>
          <span className="text-black/50 dark:text-white/50 text-base font-medium truncate transition-colors">{influencer.niche}</span>
          {influencer.location !== '—' && (
            <div className="flex items-center gap-1.5 text-black/50 dark:text-white/50 text-sm mt-1 transition-colors">
              <MapPin className="w-4 h-4 text-black/40 dark:text-white/40" />
              <span>{influencer.location}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="flex items-center gap-4 p-5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
          <Users className="w-6 h-6 text-black/50 dark:text-white/50 shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="text-black dark:text-white font-bold text-xl leading-tight truncate transition-colors">{influencer.followers}</div>
            <div className="text-black/40 dark:text-white/40 text-xs font-bold uppercase tracking-wider mt-0.5 transition-colors">Followers</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
          <TrendingUp className="w-6 h-6 text-black/50 dark:text-white/50 shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="text-black dark:text-white font-bold text-xl leading-tight truncate transition-colors">
              {typeof influencer.performanceBenefits === 'string' && influencer.performanceBenefits.includes('%') ? `${influencer.performanceBenefits.split('%')[0]}%` : 'New'}
            </div>
            <div className="text-black/40 dark:text-white/40 text-xs font-bold uppercase tracking-wider mt-0.5 transition-colors">Engagement</div>
          </div>
        </div>
      </div>

      {influencer.pricePerPost !== '—' && (
         <div className="px-2">
            <span className="text-black/60 dark:text-white/60 text-sm font-medium transition-colors">Est. Commercials: </span>
            <span className="text-black dark:text-white font-semibold text-base transition-colors">{influencer.pricePerPost}</span>
         </div>
      )}

      <div className="flex items-center gap-4 mt-auto pt-4">
        <button 
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 text-base font-bold text-white dark:text-black bg-black dark:bg-white rounded-2xl shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-all border-none transform active:scale-[0.98]"
          onClick={(e) => {
            e.stopPropagation();
            onInfo();
          }}
        >
          <span>View Profile</span>
        </button>
        
        <a
          href={instagramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 text-black/70 dark:text-white/70 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 hover:-translate-y-px transition-all flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Instagram className="w-6 h-6" />
        </a>
      </div>
    </div>
  );
};

const StepSuggestions: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, suggestions, setSuggestions, resetCampaign } = useCampaign();
  const [selectedModal, setSelectedModal] = useState<InfluencerSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(suggestions.length === 0);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4; 

  // Reset Handler
  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Start a new campaign? This will clear your current results.")) {
      resetCampaign();
      // Reload to ensure a fresh start from the Welcome screen
      setTimeout(() => window.location.reload(), 100);
    }
  }; 
  
  useEffect(() => {
    if (suggestions.length > 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const results = await fetchInfluencers(preferences);
        if (!cancelled) {
          setSuggestions(results);
          setCurrentPage(1);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load recommendations. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [preferences, suggestions.length, setSuggestions]);

  const handleApprove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Approve clicked - navigating to dashboard');
    navigate('/dashboard');
  };

  const topScore = suggestions.length > 0 ? Math.max(...suggestions.map(s => s.matchScore)) : 0;

  const totalPages = Math.ceil(suggestions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageItems = suggestions.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col w-full min-h-screen pt-12 px-6 md:px-12 pb-12 gap-10 max-w-[1600px] mx-auto overflow-hidden text-black dark:text-white bg-white/0 transition-colors" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-black/5 dark:bg-white/5 rounded-full blur-[150px] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/5 dark:bg-white/5 rounded-full blur-[150px] pointer-events-none opacity-50" />
      
      {/* Reset Button */}
      <button 
        onClick={handleReset}
        className="absolute top-6 right-6 md:top-12 md:right-12 z-30 flex items-center gap-2 px-4 py-2 text-sm font-medium text-black/60 dark:text-white/60 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all hover:text-black dark:hover:text-white"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden md:inline">Reset Campaign</span>
      </button>
      
      <div className="flex flex-col items-center text-center mb-10 relative z-20">
        <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-3 tracking-tight transition-colors">Scout</h1>
        <p className="text-base text-black/50 dark:text-white/50 mb-8 max-w-lg mx-auto transition-colors">Influencer Discovery AI</p>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          <div className="flex gap-3 items-center text-black/70 dark:text-white/70 text-base transition-colors">
            <CheckCircle2 className="w-5 h-5 text-black dark:text-white transition-colors" />
            <span>Analyzed 1,842 creators</span>
          </div>
          <div className="flex gap-3 items-center text-black/70 dark:text-white/70 text-base transition-colors">
            <Target className="w-5 h-5 text-black dark:text-white transition-colors" />
            <span>Top {suggestions.length > 0 ? suggestions.length : '10'} matches</span>
          </div>
          <div className="flex gap-3 items-center text-black/70 dark:text-white/70 text-base transition-colors">
             <TrendingUp className="w-5 h-5 text-black dark:text-white transition-colors" />
             <span>Optimized for {preferences.primaryGoal || 'Engagement'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden pb-4 relative z-10 w-full">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-black dark:text-white mb-3 transition-colors">
            <span className="font-bold">Scout</span> has shortlisted{' '}
            <span className="font-bold">creators</span> for your campaign.
          </h2>
          <p className="text-black/40 dark:text-white/40 text-base mb-8 max-w-2xl mx-auto transition-colors">
            Based on your brief and strategy parameters.
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
             {!isLoading && suggestions.length > 0 && topScore > 0 && (
               <div className="px-5 py-2 bg-black/5 dark:bg-white/10 rounded-full border border-black/10 dark:border-white/10 text-black/80 dark:text-white/80 text-base font-medium backdrop-blur-md transition-colors">
                 Match Score: <span className="text-black dark:text-white font-bold ml-1.5 transition-colors">{topScore}%</span>
               </div>
             )}
          </div>
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
            <p className="text-2xl font-semibold text-white">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center flex-1">
            <AlertCircle className="w-12 h-12 text-gray-400" />
            <p className="text-2xl font-semibold text-white">No matching creators found</p>
            <p className="text-white/40 text-base max-w-md">
              We're still building our database for this niche. Try broadening your campaign parameters.
            </p>
          </div>
        )}

        {/* Influencer Grid */}
        {!isLoading && suggestions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 w-full flex-1 overflow-y-auto pr-2 custom-scrollbar px-4">
            {currentPageItems.map((inf, i) => (
              <InfluencerCard
                key={inf.id}
                influencer={inf}
                index={i}
                onInfo={() => {
                  console.log('Opening modal for:', inf.name);
                  setSelectedModal(inf);
                }}
              />
            ))}
          </div>
        )}

        {!isLoading && suggestions.length > 0 && (
           <div className="mt-12 flex flex-col gap-6 pb-8">
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
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
                      className={`min-w-[48px] h-12 px-4 text-base font-semibold rounded-xl border transition-all ${
                        currentPage === page 
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

              <div className="flex flex-col items-center gap-2 mt-4">
                <button
                  className="w-full max-w-md flex items-center justify-center gap-2 px-6 py-4 text-lg font-bold text-white dark:text-black bg-black dark:bg-white border border-black/20 dark:border-white/20 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.06)] hover:bg-gray-800 dark:hover:bg-[#f0f0f0] hover:shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all cursor-pointer"
                  onClick={handleApprove}
                >
                  <span>Approve Shortlist & Begin Outreach</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
           </div>
        )}
      </div>

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
    </div>
  );
};

export default StepSuggestions;
