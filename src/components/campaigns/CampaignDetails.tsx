import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import { CampaignService } from '@/services/CampaignService';
import { normalizeInfluencerData, formatFollowers } from '@/utils/influencerUtils';
import { DUMMY_INFLUENCER } from '@/utils/dummyData';
import {
  ArrowLeft, Send, Heart, X, Users, TrendingUp, MapPin, Bookmark, BookmarkCheck,
  ChevronRight, Sparkles, Instagram,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CampaignInfo {
  id: string;
  name?: string;
  status?: string;
  analysisResult?: any;
  preferences?: any;
  suggestions?: any[];
  shortlist?: string[];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const CampaignDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [shortlist, setShortlist] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await CampaignService.getCampaign(id);
        if (data) {
          setCampaign({ id, ...data } as any);
          setShortlist(data.shortlist || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const allInfluencers = useMemo(() => {
    if (!campaign?.suggestions) return [DUMMY_INFLUENCER];
    const normalized = campaign.suggestions.map((s: any) => normalizeInfluencerData(s));
    return [DUMMY_INFLUENCER, ...normalized.filter(s => s.id !== DUMMY_INFLUENCER.id)];
  }, [campaign]);

  const shortlistedInfluencers = useMemo(
    () => allInfluencers.filter(inf => shortlist.includes(inf.id)),
    [allInfluencers, shortlist]
  );

  const toggleShortlist = async (infId: string) => {
    const isAdding = !shortlist.includes(infId);
    const newList = isAdding
      ? [...shortlist, infId]
      : shortlist.filter(x => x !== infId);
    setShortlist(newList);
    if (id) {
      try { await CampaignService.saveShortlist(id, newList); }
      catch (e) { console.error(e); }
    }
  };

  const brandName = campaign?.name || campaign?.analysisResult?.brand_name || 'Campaign';
  const industry = campaign?.analysisResult?.industry || '';
  const budget = campaign?.preferences?.budgetRange || campaign?.analysisResult?.budget_range || '—';
  const goal = campaign?.preferences?.primaryGoal || campaign?.analysisResult?.marketing_goal || '—';
  const timeline = campaign?.preferences?.timeline || '—';

  if (loading) {
    return (
      <DashboardLayout title="Campaign">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-3 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout title="Campaign">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-zinc-500 text-lg">Campaign not found</p>
          <button onClick={() => navigate('/campaigns')} className="text-sm underline text-zinc-400 hover:text-zinc-200">
            Back to Campaigns
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span onClick={() => navigate('/campaigns')} className="cursor-pointer hover:text-zinc-200 transition">Campaigns</span>
          <ChevronRight size={14} />
          <span className="text-zinc-200">{brandName}</span>
        </div>
      }
    >
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">

        {/* ── Main layout: left sidebar + right grid ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT SIDEBAR */}
          <div className="w-64 shrink-0 border-r border-white/10 bg-zinc-950/40 backdrop-blur-sm flex flex-col">
            {/* Brand card */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
                <Sparkles size={12} />
                Campaign
              </div>
              <h2 className="text-xl font-black text-white mb-1">{brandName}</h2>
              {industry && <p className="text-xs text-zinc-500 font-medium">{industry}</p>}
            </div>

            {/* Details */}
            <div className="p-6 space-y-5 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Budget</span>
                <span className="text-sm font-semibold text-white">{budget}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Goal</span>
                <span className="text-sm font-semibold text-white capitalize">{goal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Timeline</span>
                <span className="text-sm font-semibold text-white capitalize">{timeline}</span>
              </div>
            </div>

            {/* Outreach button */}
            <div className="p-4 border-t border-white/5">
              <button
                onClick={() => navigate(`/campaigns/${id}/track`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-zinc-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-lg"
              >
                <Send size={14} />
                Outreach
              </button>
            </div>
          </div>

          {/* RIGHT CONTENT — All Suggested */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">All Suggested</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{allInfluencers.length} creators found</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {allInfluencers.map((inf) => {
                const isSelected = shortlist.includes(inf.id);
                return (
                  <div
                    key={inf.id}
                    className={`
                      relative rounded-2xl border p-5 transition-all duration-200 cursor-pointer group
                      ${isSelected
                        ? 'border-white/30 bg-white/[0.08] shadow-lg shadow-white/5'
                        : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                      }
                    `}
                  >
                    {/* Bookmark toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleShortlist(inf.id); }}
                      className={`absolute top-4 right-4 p-1.5 rounded-full transition-all ${
                        isSelected
                          ? 'text-pink-400 bg-pink-500/20'
                          : 'text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-pink-400 hover:bg-pink-500/10'
                      }`}
                    >
                      <Heart size={16} fill={isSelected ? 'currentColor' : 'none'} />
                    </button>

                    {/* Avatar */}
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-black text-zinc-400">
                        {inf.name?.charAt(0)?.toLowerCase() || '?'}
                      </div>
                    </div>

                    {/* Name & niche */}
                    <div className="text-center mb-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide">{inf.name}</h4>
                      <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{inf.niche || '—'}</p>
                      {inf.location && inf.location !== '—' && (
                        <p className="text-[10px] text-zinc-600 flex items-center justify-center gap-1 mt-1">
                          <MapPin size={9} />{inf.location}
                        </p>
                      )}
                      {inf.handle && (
                        <p className="text-[10px] text-zinc-600 mt-0.5">@{inf.handle?.replace('@', '')}</p>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-5 mb-4">
                      <div className="text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-yellow-500/70 flex items-center gap-1">
                          <span>★</span> Score
                        </p>
                        <p className="text-sm font-black text-white">{inf.matchScore || 0}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-pink-500/70 flex items-center gap-1">
                          <Users size={8} /> Fans
                        </p>
                        <p className="text-sm font-black text-white">{inf.followers || '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-green-500/70 flex items-center gap-1">
                          <TrendingUp size={8} /> Rate
                        </p>
                        <p className="text-sm font-black text-white">{inf.engagementRate || '—'}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    {inf.brandFit && (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {inf.brandFit.split(',').filter(Boolean).slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400 font-medium uppercase tracking-wide">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR: Shortlisted influencers ── */}
        {shortlistedInfluencers.length > 0 && (
          <div className="shrink-0 border-t border-white/10 bg-zinc-950/60 backdrop-blur-xl px-8 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <BookmarkCheck size={14} className="text-pink-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Selected ({shortlistedInfluencers.length})
                </span>
              </div>

              <div className="flex-1 flex items-center gap-3 overflow-x-auto py-1">
                {shortlistedInfluencers.map(inf => (
                  <div
                    key={inf.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 shrink-0 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                      {inf.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="text-xs font-semibold text-zinc-300 whitespace-nowrap">{inf.name}</span>
                    <button
                      onClick={() => toggleShortlist(inf.id)}
                      className="p-0.5 text-zinc-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate(`/campaigns/${id}/track`)}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-900 rounded-xl text-xs font-bold hover:bg-white/90 transition shadow-lg"
              >
                <Send size={12} />
                Start Outreach
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CampaignDetails;
