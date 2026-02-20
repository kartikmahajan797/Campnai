import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { auth } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../../config/api';
import {
  FileText, TrendingUp, Users, Shield, DollarSign, Target,
  BarChart3, AlertTriangle, CheckCircle2, Download,
  Loader2, ChevronDown, ChevronUp, Star, Zap, Globe, Award,
  IndianRupee, BadgeCheck, Calendar, Layers,
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

// ─── Confidence Bar ────────────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-3">
    <span className="text-[11px] font-semibold text-black/45 w-28 truncate capitalize">
      {label.replace(/_/g, ' ')}
    </span>
    <div className="flex-1 h-1.5 bg-black/6 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${value >= 70 ? 'bg-black' : value >= 40 ? 'bg-black/50' : 'bg-black/25'}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
    <span className="text-[11px] font-bold text-black/60 w-10 text-right">{value}%</span>
  </div>
);

// ─── Score Bar ─────────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] font-bold uppercase tracking-wider text-black/35 w-24 truncate">{label}</span>
    <div className="flex-1 h-1 bg-black/6 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${score >= 70 ? 'bg-black' : score >= 40 ? 'bg-black/45' : 'bg-black/18'}`}
        style={{ width: `${score}%` }}
      />
    </div>
    <span className="text-[10px] font-bold text-black/50 w-8 text-right">{score}</span>
  </div>
);

// ─── Collapsible Section ───────────────────────────────────────────────────────
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  accent?: string;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, accent, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-5 text-left hover:bg-black/[0.015] transition-colors"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accent || 'bg-black/5'}`}>
          {icon}
        </div>
        <h3 className="flex-1 text-base font-bold text-foreground tracking-tight">{title}</h3>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-border">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Metric Card ───────────────────────────────────────────────────────────────
const MetricCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}> = ({ label, value, sub, icon, highlight }) => (
  <div className={`p-5 rounded-2xl border transition-colors ${
    highlight
      ? 'bg-black text-white border-black'
      : 'bg-black/[0.025] border-black/8 text-black'
  }`}>
    <div className="flex items-center gap-2 mb-2">
      {icon && (
        <div className={highlight ? 'text-white/50' : 'text-black/35'}>{icon}</div>
      )}
      <span className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-white/50' : 'text-black/40'}`}>
        {label}
      </span>
    </div>
    <div className={`text-2xl font-black tracking-tight leading-none ${highlight ? 'text-white' : 'text-black'}`}>
      {value}
    </div>
    {sub && (
      <div className={`text-[11px] mt-1.5 font-medium ${highlight ? 'text-white/50' : 'text-black/35'}`}>{sub}</div>
    )}
  </div>
);

// ─── Tier Badge ────────────────────────────────────────────────────────────────
const TierBadge: React.FC<{ tier: string }> = ({ tier }) => (
  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-black ${
    tier === 'A' ? 'bg-black text-white' :
    tier === 'B' ? 'bg-black/15 text-black' :
                   'bg-black/6 text-black/40'
  }`}>
    {tier}
  </span>
);

// ─── Risk Badge ────────────────────────────────────────────────────────────────
const RiskBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const map: Record<string, string> = {
    high:   'bg-red-50 text-red-700 border border-red-200',
    medium: 'bg-amber-50 text-amber-700 border border-amber-200',
    low:    'bg-green-50 text-green-700 border border-green-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[severity] || map.low}`}>
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
    { label: 'Analyzing brand intelligence data…',   icon: Globe     },
    { label: 'Scoring influencer matches…',           icon: Users     },
    { label: 'Generating campaign strategy…',         icon: Target    },
    { label: 'Building financial projections…',       icon: TrendingUp},
    { label: 'Assessing risks & compliance…',         icon: Shield    },
    { label: 'Compiling executive report…',           icon: FileText  },
  ];

  useEffect(() => {
    if (!campaignId) {
      setError('No campaign found. Please start a new campaign.');
      setLoading(false);
      return;
    }

    const stepTimers = loadingSteps.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 1600)
    );

    const generateReport = async () => {
      try {
        let user = auth.currentUser;
        if (!user) {
          user = await new Promise<any>((resolve) => {
            const unsub = auth.onAuthStateChanged(u => { unsub(); resolve(u); });
          });
        }
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

  const formatNum = (n: number) => {
    if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
    if (n >= 100_000)    return `${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
        {/* Background blobs */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Spinner */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-border" />
              <div className="absolute inset-0 rounded-full border-2 border-t-foreground border-r-foreground border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-b-muted-foreground border-l-muted-foreground border-t-transparent border-r-transparent animate-spin [animation-direction:reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-center text-foreground">Generating Report</h2>
            <p className="text-muted-foreground text-sm text-center mt-1.5">Building your campaign intelligence…</p>
          </div>

          {/* Step list */}
          <div className="flex flex-col gap-3">
            {loadingSteps.map((step, i) => {
              const Icon = step.icon;
              const done = i < loadingStep;
              const active = i === loadingStep;
              if (i > loadingStep) return null;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    done
                      ? 'bg-muted/30 border-border opacity-60'
                      : 'bg-card border-border shadow-sm'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-foreground text-background' : 'bg-muted'}`}>
                    {done
                      ? <CheckCircle2 className="w-4 h-4" />
                      : <Icon className={`w-3.5 h-3.5 ${active ? 'text-foreground animate-pulse' : 'text-muted-foreground'}`} />
                    }
                  </div>
                  <span className={`text-sm font-semibold ${done ? 'text-muted-foreground' : active ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="text-2xl font-black text-foreground text-center">Report Generation Failed</h2>
        <p className="text-muted-foreground text-center max-w-sm text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!report) return null;

  const { sections, meta } = report;
  const exec  = sections.executive_summary;
  const brand = sections.brand_insights;
  const board = sections.influencer_leaderboard;
  const strat = sections.campaign_strategy;
  const budg  = sections.budget_allocation;
  const fin   = sections.financial_projections;
  const risk  = sections.risk_assessment;

  // ── Report UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-foreground font-sans relative">

      {/* Background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45vw] h-[45vw] bg-purple-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[35vw] h-[35vw] bg-blue-400/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[40vw] bg-indigo-400/6 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-10 pb-16 space-y-5">

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-muted rounded-lg text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                {report.report_id}
              </span>
              <span className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold text-green-700">
                v{report.version}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-foreground">
              {exec.brand} Intelligence Report
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 font-medium">
              {new Date(report.generated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              &nbsp;·&nbsp;{meta.processing_time_ms}ms
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/85 active:scale-[0.98] transition-all shadow-sm print:hidden flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </motion.div>

        {/* ── Executive Summary Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative rounded-2xl overflow-hidden bg-black text-white p-8 shadow-xl"
        >
          {/* Inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-neutral-800 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-white/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Executive Summary</span>
            </div>
            <p className="text-lg font-semibold leading-relaxed text-white/90 mb-8 max-w-3xl">
              {exec.ai_strategy_summary}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Analyzed',      value: exec.total_influencers_analyzed },
                { label: 'Tier A Matches', value: exec.top_tier_matches           },
                { label: 'Avg Match',      value: `${exec.average_match_score}%` },
                { label: 'Est. Reach',     value: formatNum(exec.estimated_reach) },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 bg-white/8 rounded-xl border border-white/8">
                  <div className="text-2xl font-black leading-none">{value}</div>
                  <div className="text-[11px] text-white/45 mt-1.5 font-semibold">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Confidence Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center">
              <Shield className="w-4 h-4 text-black/50" />
            </div>
            <span className="text-sm font-bold text-foreground">Data Confidence</span>
            <div className={`ml-auto px-3 py-1 rounded-full text-[11px] font-bold border ${
              exec.confidence_overall >= 70
                ? 'bg-green-50 text-green-700 border-green-200'
                : exec.confidence_overall >= 40
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              Overall: {exec.confidence_overall}%
            </div>
          </div>
          <div className="space-y-3">
            {brand.confidence_scores &&
              Object.entries(brand.confidence_scores)
                .filter(([k]) => k !== 'overall')
                .map(([key, val]) => (
                  <ConfidenceBar key={key} label={key} value={val as number} />
                ))}
          </div>
        </motion.div>

        {/* ── Brand & Market Insights ── */}
        <Section
          title="Brand & Market Insights"
          icon={<Globe className="w-4 h-4 text-black/50" />}
        >
          <div className="pt-5 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard label="Industry"        value={exec.industry}                              icon={<Target className="w-4 h-4" />} />
            <MetricCard label="Campaign Goal"   value={exec.campaign_goal}                         icon={<Zap className="w-4 h-4" />} />
            <MetricCard label="Market Position" value={brand.positioning?.market_position || '—'}  icon={<Award className="w-4 h-4" />} />
            <MetricCard label="Price Segment"   value={brand.pricing?.segment || '—'}              icon={<IndianRupee className="w-4 h-4" />} />
          </div>
          {brand.competitors?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35 mb-3">
                Competitor Landscape
              </p>
              <div className="space-y-2">
                {brand.competitors.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-black/[0.025] rounded-xl border border-black/6">
                    <div className="w-7 h-7 rounded-full bg-black/8 flex items-center justify-center text-[11px] font-black text-black/50 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm text-black">{c.name}</span>
                      <span className="text-[12px] text-black/40 ml-2 font-medium">{c.key_differentiator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── Influencer Leaderboard ── */}
        <Section
          title={`Influencer Leaderboard (${board.total})`}
          icon={<Users className="w-4 h-4 text-black/50" />}
        >
          <div className="pt-5">
            {/* Tier pills */}
            <div className="flex items-center gap-2 mb-5">
              <span className="px-3 py-1 bg-black text-white rounded-full text-[11px] font-bold">
                Tier A: {board.tier_distribution.A}
              </span>
              <span className="px-3 py-1 bg-black/15 text-black rounded-full text-[11px] font-bold">
                Tier B: {board.tier_distribution.B}
              </span>
              <span className="px-3 py-1 bg-black/6 text-black/45 rounded-full text-[11px] font-bold">
                Tier C: {board.tier_distribution.C}
              </span>
            </div>

            {/* Influencer Cards */}
            <div className="space-y-3">
              {board.entries.map((inf: any) => (
                <motion.div
                  key={inf.rank}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: inf.rank * 0.04 }}
                  className="flex items-start gap-4 p-4 bg-black/[0.02] rounded-2xl border border-black/6 hover:border-black/12 hover:bg-black/[0.035] transition-all"
                >
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-xl bg-black/6 flex items-center justify-center text-[12px] font-black text-black/35 flex-shrink-0">
                    {inf.rank}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                    {inf.name?.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-black text-[15px]">{inf.name}</span>
                      {inf.is_shortlisted && (
                        <BadgeCheck className="w-4 h-4 text-green-600" />
                      )}
                      <TierBadge tier={inf.tier} />
                    </div>
                    <p className="text-[12px] text-black/40 font-medium mt-0.5">
                      {[inf.handle, inf.location, inf.niche].filter(Boolean).join(' · ')}
                    </p>
                    {/* Score bars */}
                    {inf.score_breakdown && (
                      <div className="mt-3 space-y-1.5">
                        {Object.entries(inf.score_breakdown).map(([k, v]: [string, any]) => (
                          <ScoreBar key={k} label={k} score={v.score ?? v} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right stats */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0 text-right">
                    <div className="text-xl font-black text-black">{inf.match_score}%</div>
                    <div className="text-[10px] font-semibold text-black/35">match score</div>
                    <div className="text-sm font-bold text-black/70 mt-1">{formatNum(inf.followers)}</div>
                    <div className="text-[10px] text-black/35">followers</div>
                    {inf.engagement_rate > 0 && (
                      <>
                        <div className="text-sm font-bold text-black/70">{inf.engagement_rate}%</div>
                        <div className="text-[10px] text-black/35">ER</div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Campaign Strategy ── */}
        <Section
          title="Campaign Strategy"
          icon={<Target className="w-4 h-4 text-black/50" />}
        >
          <div className="pt-5 space-y-6">
            {strat.channel_strategy?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35 mb-3">Channel Strategy</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {strat.channel_strategy.map((ch: any, i: number) => (
                    <div key={i} className="p-5 bg-black/[0.025] rounded-2xl border border-black/6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-black text-sm text-black">{ch.platform}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ch.priority === 'primary'
                            ? 'bg-black text-white'
                            : 'bg-black/8 text-black/50'
                        }`}>
                          {ch.priority}
                        </span>
                      </div>
                      <p className="text-[13px] text-black/55 font-medium mb-3">{ch.rationale}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ch.content_types?.map((t: string, j: number) => (
                          <span key={j} className="px-2.5 py-1 bg-black/6 rounded-lg text-[11px] font-semibold text-black/60">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {strat.scaling_roadmap && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35 mb-3">Scaling Roadmap</p>
                <div className="flex flex-col md:flex-row gap-3">
                  {Object.entries(strat.scaling_roadmap).map(([phase, data]: [string, any], i) => (
                    <div key={phase} className="flex-1 p-5 bg-black/[0.025] rounded-2xl border border-black/6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-black">
                          {i + 1}
                        </div>
                        <span className="text-[11px] font-bold text-black/35 uppercase">Week {data.weeks}</span>
                      </div>
                      <div className="font-bold text-[15px] text-black mb-1.5">{data.focus}</div>
                      <div className="text-xs text-black/45 font-semibold">KPI: {data.kpi}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── Budget & Financial Projections ── */}
        <Section
          title="Budget & Financial Projections"
          icon={<IndianRupee className="w-4 h-4 text-black/50" />}
        >
          <div className="pt-5 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard highlight label="Total Budget"     value={`₹${(budg.total_budget / 100000).toFixed(1)}L`} icon={<IndianRupee className="w-4 h-4" />} />
              <MetricCard label="Est. Reach"        value={formatNum(fin.reach.estimated)}                icon={<Users className="w-4 h-4" />} />
              <MetricCard label="Est. Impressions"  value={formatNum(fin.reach.impressions)}              icon={<BarChart3 className="w-4 h-4" />} />
              <MetricCard label="CPM"               value={fin.cost_metrics.cpm}                         icon={<TrendingUp className="w-4 h-4" />} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard label="Est. Engagements" value={formatNum(fin.engagement.estimated_engagements)} />
              <MetricCard label="Est. Clicks"       value={formatNum(fin.engagement.estimated_clicks)} />
              <MetricCard label="Expected ROI"      value={fin.roi_estimate.expected_roi} sub={fin.roi_estimate.confidence} />
            </div>

            {budg.allocation && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35 mb-4">Budget Allocation</p>
                <div className="space-y-3">
                  {Object.entries(budg.allocation).map(([tier, data]: [string, any]) => (
                    <div key={tier} className="flex items-center gap-3">
                      <span className="text-[11px] font-bold uppercase text-black/45 w-20">{tier}</span>
                      <div className="flex-1 h-2 bg-black/6 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-black rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${data.pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-[11px] font-black text-black/55 w-10 text-right">{data.pct}%</span>
                      <span className="text-[11px] text-black/35 w-20 text-right font-semibold">
                        ₹{(data.amount / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── Risk Assessment ── */}
        <Section
          title={`Risk Assessment (${risk.total_risks} identified)`}
          icon={<Shield className="w-4 h-4 text-black/50" />}
          defaultOpen={risk.high_severity > 0}
        >
          <div className="pt-5 space-y-4">
            {risk.high_severity > 0 && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-red-700">
                  {risk.high_severity} high-severity risk{risk.high_severity > 1 ? 's' : ''} detected
                </span>
              </div>
            )}
            {risk.risks.map((r: any, i: number) => (
              <div key={i} className="p-5 bg-black/[0.025] rounded-2xl border border-black/6">
                <div className="flex items-center gap-2.5 mb-3">
                  <RiskBadge severity={r.severity} />
                  <span className="font-bold text-sm text-black">{r.category}</span>
                </div>
                <p className="text-sm text-black/70 font-medium mb-3 leading-relaxed">{r.description}</p>
                <div className="flex items-start gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-[12px] text-green-700 font-medium leading-relaxed">{r.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Performance Benchmarks ── */}
        {sections.performance_benchmarks && Object.keys(sections.performance_benchmarks).length > 0 && (
          <Section
            title="Performance Benchmarks"
            icon={<BarChart3 className="w-4 h-4 text-black/50" />}
            defaultOpen={false}
          >
            <div className="pt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(sections.performance_benchmarks).map(([key, val]) => (
                <MetricCard key={key} label={key.replace(/_/g, ' ')} value={val as string} />
              ))}
            </div>
          </Section>
        )}

        {/* ── Footer ── */}
        <div className="text-center pt-4 text-[11px] text-muted-foreground/50 font-medium">
          <p>Campnai Intelligence Engine v{report.version} · {report.report_id}</p>
          <p className="mt-1">Confidence: {meta.confidence_level} · Sources: {meta.data_sources}</p>
        </div>

      </div>
    </div>
  );
};

export default StepReport;
