import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { auth } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../../config/api';
import {
  FileText, TrendingUp, Users, Shield, DollarSign, Target,
  BarChart3, AlertTriangle, CheckCircle2, ArrowRight, Download,
  Loader2, ChevronDown, ChevronUp, Star, Zap, Globe, Award,
} from 'lucide-react';

interface ReportData {
  report_id: string;
  generated_at: string;
  version: string;
  sections: {
    executive_summary: any;
    brand_insights: any;
    influencer_leaderboard: any;
    campaign_strategy: any;
    budget_allocation: any;
    financial_projections: any;
    risk_assessment: any;
    performance_benchmarks: any;
  };
  meta: any;
}

// ─── Confidence Bar ──────────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs font-medium text-black/50 dark:text-white/50 w-28 truncate">{label}</span>
    <div className="flex-1 h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
    <span className="text-xs font-bold text-black/70 dark:text-white/70 w-10 text-right">{value}%</span>
  </div>
);

// ─── Score Breakdown Bar ─────────────────────────────────────────────────────
const ScoreBar: React.FC<{ label: string; score: number; weight: string }> = ({ label, score, weight }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40 w-24 truncate">{label}</span>
    <div className="flex-1 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${score >= 70 ? 'bg-black dark:bg-white' : score >= 40 ? 'bg-black/50 dark:bg-white/50' : 'bg-black/20 dark:bg-white/20'}`} style={{ width: `${score}%` }} />
    </div>
    <span className="text-[10px] font-bold text-black/60 dark:text-white/60 w-8 text-right">{score}</span>
  </div>
);

// ─── Collapsible Section ─────────────────────────────────────────────────────
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden transition-colors">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-6 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
        <div className="p-2 bg-black/5 dark:bg-white/10 rounded-xl">{icon}</div>
        <h3 className="flex-1 text-lg font-bold text-black dark:text-white">{title}</h3>
        {open ? <ChevronUp className="w-5 h-5 text-black/30 dark:text-white/30" /> : <ChevronDown className="w-5 h-5 text-black/30 dark:text-white/30" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Metric Card ─────────────────────────────────────────────────────────────
const MetricCard: React.FC<{ label: string; value: string | number; sub?: string; icon?: React.ReactNode }> = ({ label, value, sub, icon }) => (
  <div className="p-5 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
    <div className="flex items-center gap-2 mb-2">
      {icon && <div className="text-black/40 dark:text-white/40">{icon}</div>}
      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">{label}</span>
    </div>
    <div className="text-2xl font-bold text-black dark:text-white leading-tight">{value}</div>
    {sub && <div className="text-xs text-black/40 dark:text-white/40 mt-1">{sub}</div>}
  </div>
);

// ─── Risk Badge ──────────────────────────────────────────────────────────────
const RiskBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[severity] || colors.low}`}>
      {severity}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const StepReport: React.FC = () => {
  const { campaignId } = useCampaign();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    'Analyzing brand intelligence data...',
    'Scoring influencer matches...',
    'Generating campaign strategy...',
    'Building financial projections...',
    'Assessing risks & compliance...',
    'Compiling executive report...',
  ];

  useEffect(() => {
    if (!campaignId) {
      setError('No campaign found. Please start a new campaign.');
      setLoading(false);
      return;
    }

    // Animate loading steps
    const stepTimers = loadingSteps.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 1500)
    );

    const generateReport = async () => {
      try {
        const user = auth.currentUser;
        if (!user) { setError('Please log in to generate a report.'); setLoading(false); return; }

        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/report`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to generate report');
        }

        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Report generation failed.');
      } finally {
        setLoading(false);
      }
    };

    generateReport();
    return () => stepTimers.forEach(clearTimeout);
  }, [campaignId]);

  const handleExportPDF = () => {
    window.print();
  };

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 min-h-screen">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-black/5 dark:bg-white/5 rounded-full blur-[128px] pointer-events-none animate-pulse" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center max-w-lg w-full relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-black dark:text-white mb-2 text-center tracking-tight">Generating Intelligence Report</h2>
          <p className="text-black/50 dark:text-white/50 text-sm text-center mb-10 font-medium">Building your enterprise-grade campaign analysis.</p>

          <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-black/5 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-4 border-t-black/80 dark:border-t-white/80 border-r-black/80 dark:border-r-white/80 border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-b-black/40 dark:border-b-white/40 border-l-black/40 dark:border-l-white/40 border-t-transparent border-r-transparent animate-spin [animation-direction:reverse]" />
            <FileText className="w-8 h-8 text-black/60 dark:text-white/60" />
          </div>

          <div className="w-full flex flex-col gap-3">
            {loadingSteps.map((step, i) => (
              i <= loadingStep && (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${i < loadingStep ? 'bg-gray-100 dark:bg-white/5 border-transparent opacity-70' : 'bg-white dark:bg-white/10 border-black/10 dark:border-white/20 shadow-lg'}`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${i < loadingStep ? 'bg-green-500' : 'bg-black/60 dark:bg-white/60 animate-pulse'}`} />
                  <span className="text-sm font-bold tracking-wide">{step}</span>
                </motion.div>
              )
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 min-h-screen">
        <AlertTriangle className="w-16 h-16 text-black/30 dark:text-white/30 mb-6" />
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Report Generation Failed</h2>
        <p className="text-black/50 dark:text-white/50 text-center max-w-md">{error}</p>
      </div>
    );
  }

  if (!report) return null;

  const { sections, meta } = report;
  const exec = sections.executive_summary;
  const brand = sections.brand_insights;
  const board = sections.influencer_leaderboard;
  const strat = sections.campaign_strategy;
  const budg = sections.budget_allocation;
  const fin = sections.financial_projections;
  const risk = sections.risk_assessment;

  // ── Report UI ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full min-h-screen pt-8 px-4 md:px-8 pb-12 gap-6 max-w-[1200px] mx-auto text-black dark:text-white print:text-black print:bg-white">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-black/5 dark:bg-white/10 rounded-lg text-xs font-bold text-black/50 dark:text-white/50 tracking-wider uppercase">{report.report_id}</div>
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg text-xs font-bold text-green-700 dark:text-green-400">v{report.version}</div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{exec.brand} Intelligence Report</h1>
          <p className="text-black/50 dark:text-white/50 text-sm mt-1">Generated {new Date(report.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • {meta.processing_time_ms}ms</p>
        </div>
        <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg print:hidden">
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </motion.div>

      {/* Executive Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-black rounded-2xl p-8 shadow-2xl print:bg-black print:text-white"
      >
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest opacity-80">Executive Summary</span>
        </div>
        <p className="text-xl font-medium leading-relaxed mb-8 opacity-95">{exec.ai_strategy_summary}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/10 dark:bg-black/10 rounded-xl">
            <div className="text-2xl font-bold">{exec.total_influencers_analyzed}</div>
            <div className="text-xs opacity-60 mt-1">Influencers Analyzed</div>
          </div>
          <div className="p-4 bg-white/10 dark:bg-black/10 rounded-xl">
            <div className="text-2xl font-bold">{exec.top_tier_matches}</div>
            <div className="text-xs opacity-60 mt-1">Tier A Matches</div>
          </div>
          <div className="p-4 bg-white/10 dark:bg-black/10 rounded-xl">
            <div className="text-2xl font-bold">{exec.average_match_score}%</div>
            <div className="text-xs opacity-60 mt-1">Avg Match Score</div>
          </div>
          <div className="p-4 bg-white/10 dark:bg-black/10 rounded-xl">
            <div className="text-2xl font-bold">{formatNum(exec.estimated_reach)}</div>
            <div className="text-xs opacity-60 mt-1">Est. Reach</div>
          </div>
        </div>
      </motion.div>

      {/* Confidence Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-black/40 dark:text-white/40" />
          <span className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Data Confidence</span>
          <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${exec.confidence_overall >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : exec.confidence_overall >= 40 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            Overall: {exec.confidence_overall}%
          </div>
        </div>
        <div className="space-y-3">
          {brand.confidence_scores && Object.entries(brand.confidence_scores).filter(([k]) => k !== 'overall').map(([key, val]) => (
            <ConfidenceBar key={key} label={key.replace(/_/g, ' ')} value={val as number} />
          ))}
        </div>
      </motion.div>

      {/* Brand Insights */}
      <Section title="Brand & Market Insights" icon={<Globe className="w-5 h-5 text-black/60 dark:text-white/60" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <MetricCard label="Industry" value={exec.industry} icon={<Target className="w-4 h-4" />} />
          <MetricCard label="Campaign Goal" value={exec.campaign_goal} icon={<Zap className="w-4 h-4" />} />
          <MetricCard label="Market Position" value={brand.positioning?.market_position || '—'} icon={<Award className="w-4 h-4" />} />
          <MetricCard label="Price Segment" value={brand.pricing?.segment || '—'} icon={<DollarSign className="w-4 h-4" />} />
        </div>
        {brand.competitors && brand.competitors.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-3">Competitor Landscape</h4>
            <div className="space-y-2">
              {brand.competitors.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-black/[0.03] dark:bg-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-black/60 dark:text-white/60">{i + 1}</div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-black dark:text-white">{c.name}</span>
                    <span className="text-xs text-black/40 dark:text-white/40 ml-2">{c.key_differentiator}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Influencer Leaderboard */}
      <Section title={`Influencer Leaderboard (${board.total})`} icon={<Users className="w-5 h-5 text-black/60 dark:text-white/60" />}>
        <div className="flex items-center gap-3 mb-4">
          <div className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-bold">Tier A: {board.tier_distribution.A}</div>
          <div className="px-3 py-1 bg-black/20 dark:bg-white/20 text-black dark:text-white rounded-full text-xs font-bold">Tier B: {board.tier_distribution.B}</div>
          <div className="px-3 py-1 bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60 rounded-full text-xs font-bold">Tier C: {board.tier_distribution.C}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="text-left py-3 px-2 text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40">#</th>
                <th className="text-left py-3 px-2 text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Creator</th>
                <th className="text-left py-3 px-2 text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Niche</th>
                <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Followers</th>
                <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40">ER</th>
                <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Score</th>
                <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Tier</th>
              </tr>
            </thead>
            <tbody>
              {board.entries.map((inf: any) => (
                <tr key={inf.rank} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-2 font-bold text-black/30 dark:text-white/30">{inf.rank}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-bold">{inf.name?.charAt(0)}</div>
                      <div>
                        <div className="font-semibold text-black dark:text-white">{inf.name}</div>
                        <div className="text-[10px] text-black/40 dark:text-white/40">{inf.handle} • {inf.location}</div>
                      </div>
                      {inf.is_shortlisted && <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-black/60 dark:text-white/60">{inf.niche || '—'}</td>
                  <td className="py-3 px-2 text-right font-semibold">{formatNum(inf.followers)}</td>
                  <td className="py-3 px-2 text-right">{inf.engagement_rate ? `${inf.engagement_rate}%` : '—'}</td>
                  <td className="py-3 px-2 text-right font-bold">{inf.match_score}%</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${inf.tier === 'A' ? 'bg-black dark:bg-white text-white dark:text-black' : inf.tier === 'B' ? 'bg-black/20 dark:bg-white/20 text-black dark:text-white' : 'bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/50'}`}>
                      {inf.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Campaign Strategy */}
      <Section title="Campaign Strategy" icon={<Target className="w-5 h-5 text-black/60 dark:text-white/60" />}>
        {/* Channel Strategy */}
        {strat.channel_strategy && (
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-3">Channel Strategy</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strat.channel_strategy.map((ch: any, i: number) => (
                <div key={i} className="p-4 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-sm text-black dark:text-white">{ch.platform}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ch.priority === 'primary' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60'}`}>{ch.priority}</span>
                  </div>
                  <p className="text-sm font-medium text-black/60 dark:text-white/60 mb-2">{ch.rationale}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ch.content_types?.map((t: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded text-[11px] font-semibold text-black/70 dark:text-white/70">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Scaling Roadmap */}
        {strat.scaling_roadmap && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-3">Scaling Roadmap</h4>
            <div className="flex flex-col md:flex-row gap-3">
              {Object.entries(strat.scaling_roadmap).map(([phase, data]: [string, any], i) => (
                <div key={phase} className="flex-1 p-4 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <span className="text-xs font-bold text-black/40 dark:text-white/40 uppercase">Week {data.weeks}</span>
                  </div>
                  <div className="font-semibold text-base text-black dark:text-white mb-2">{data.focus}</div>
                  <div className="text-sm text-black/60 dark:text-white/60 font-medium">KPI: {data.kpi}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Budget & Financial Projections */}
      <Section title="Budget & Financial Projections" icon={<DollarSign className="w-5 h-5 text-black/60 dark:text-white/60" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Total Budget" value={`₹${(budg.total_budget / 100000).toFixed(1)}L`} icon={<DollarSign className="w-4 h-4" />} />
          <MetricCard label="Est. Reach" value={formatNum(fin.reach.estimated)} icon={<Users className="w-4 h-4" />} />
          <MetricCard label="Est. Impressions" value={formatNum(fin.reach.impressions)} icon={<BarChart3 className="w-4 h-4" />} />
          <MetricCard label="CPM" value={fin.cost_metrics.cpm} icon={<TrendingUp className="w-4 h-4" />} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <MetricCard label="Est. Engagements" value={formatNum(fin.engagement.estimated_engagements)} />
          <MetricCard label="Est. Clicks" value={formatNum(fin.engagement.estimated_clicks)} />
          <MetricCard label="Expected ROI" value={fin.roi_estimate.expected_roi} sub={fin.roi_estimate.confidence} />
        </div>
        {/* Budget Allocation */}
        {budg.allocation && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-3">Budget Allocation</h4>
            <div className="space-y-2">
              {Object.entries(budg.allocation).map(([tier, data]: [string, any]) => (
                <div key={tier} className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase text-black/50 dark:text-white/50 w-24">{tier}</span>
                  <div className="flex-1 h-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${data.pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-black/60 dark:text-white/60 w-12 text-right">{data.pct}%</span>
                  <span className="text-xs text-black/40 dark:text-white/40 w-24 text-right">₹{(data.amount / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Risk Assessment */}
      <Section title={`Risk Assessment (${risk.total_risks} identified)`} icon={<Shield className="w-5 h-5 text-black/60 dark:text-white/60" />} defaultOpen={risk.high_severity > 0}>
        {risk.high_severity > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">{risk.high_severity} high-severity risk{risk.high_severity > 1 ? 's' : ''} detected</span>
          </div>
        )}
        <div className="space-y-3">
          {risk.risks.map((r: any, i: number) => (
            <div key={i} className="p-4 bg-black/[0.03] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <RiskBadge severity={r.severity} />
                <span className="font-bold text-sm text-black dark:text-white">{r.category}</span>
              </div>
              <p className="text-sm font-medium text-black/80 dark:text-white/80 mb-3">{r.description}</p>
              <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <span className="text-xs text-green-700 dark:text-green-400">{r.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Performance Benchmarks */}
      {sections.performance_benchmarks && Object.keys(sections.performance_benchmarks).length > 0 && (
        <Section title="Performance Benchmarks" icon={<BarChart3 className="w-5 h-5 text-black/60 dark:text-white/60" />} defaultOpen={false}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(sections.performance_benchmarks).map(([key, val]) => (
              <MetricCard key={key} label={key.replace(/_/g, ' ')} value={val as string} />
            ))}
          </div>
        </Section>
      )}

      {/* Footer */}
      <div className="text-center py-6 text-xs text-black/30 dark:text-white/30 print:text-black/50">
        <p>Generated by Campnai Intelligence Engine v{report.version} • {report.report_id}</p>
        <p className="mt-1">Confidence Level: {meta.confidence_level} • Data Sources: {meta.data_sources}</p>
      </div>
    </div>
  );
};

export default StepReport;
