import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import {
  ArrowRight, Sparkles, Users, DollarSign, Clock,
  ChevronRight, ChevronLeft, IndianRupee, Zap, Target, Check
} from 'lucide-react';

const GOAL_OPTIONS = [
  { id: 'Awareness',           label: 'Brand Awareness',    desc: 'Maximize reach & visibility',  icon: Users      },
  { id: 'Sales / Conversions', label: 'Sales & Conversions', desc: 'Drive purchases & ROI',        icon: DollarSign },
  { id: 'Product Launch',      label: 'Product Launch',     desc: 'Hype for new products',         icon: Zap        },
  { id: 'App Installs',        label: 'App Installs',       desc: 'Drive downloads',               icon: Target     },
  { id: 'Creator Seeding',     label: 'Creator Seeding',    desc: 'Gift products to many',         icon: Sparkles   },
];

const BUDGET_OPTIONS = [
  { id: 'Under ₹1 Lakh', label: '< ₹1 Lakh',    desc: 'Micro — testing waters',      min: 10000,   max: 100000  },
  { id: '₹1-5 Lakh',     label: '₹1 – 5 Lakh',  desc: 'Growth — scaling up',          min: 100000,  max: 500000  },
  { id: '₹5-10 Lakh',    label: '₹5 – 10 Lakh', desc: 'Scale — dominating niche',     min: 500000,  max: 1000000 },
  { id: '₹10 Lakh+',     label: '₹10 Lakh+',    desc: 'Enterprise — full force',      min: 1000000, max: 5000000 },
];

const TIMELINE_OPTIONS = [
  { id: '1 Week',  label: '1 Week',  desc: 'Sprint — quick burst'          },
  { id: '15 Days', label: '15 Days', desc: 'Campaign — sustained push'     },
  { id: '30 Days', label: '30 Days', desc: 'Marathon — long-term building' },
];

const STEPS = [
  { key: 'primaryGoal', label: 'Primary Goal',      options: GOAL_OPTIONS    },
  { key: 'budgetRange', label: 'Budget Range',       options: BUDGET_OPTIONS  },
  { key: 'timeline',    label: 'Campaign Duration',  options: TIMELINE_OPTIONS},
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// Format with Indian commas  e.g. 1000000 → "10,00,000"
function fmtIN(val: number): string {
  if (!val || isNaN(val)) return '0';
  return val.toLocaleString('en-IN');
}

// Format as ₹ short form for hints
function formatRupees(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)     return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

// Strip commas/₹/spaces → number
function parseInput(raw: string): number {
  const n = parseFloat(raw.replace(/[₹,\s]/g, ''));
  return isNaN(n) ? 0 : Math.max(0, n);
}

// Format a raw number string with Indian commas while typing
function applyIndianCommas(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-IN');
}

// ── Budget Step ──────────────────────────────────────────────────────────────
const BudgetStep: React.FC<{ preferences: any; setPreferences: (p: any) => void }> = ({
  preferences, setPreferences,
}) => {
  const [minStr, setMinStr] = useState(
    preferences.budgetMin ? fmtIN(preferences.budgetMin) : ''
  );
  const [maxStr, setMaxStr] = useState(
    preferences.budgetMax ? fmtIN(preferences.budgetMax) : ''
  );

  const handlePreset = (opt: typeof BUDGET_OPTIONS[0]) => {
    setPreferences({ ...preferences, budgetRange: opt.id, budgetMin: opt.min, budgetMax: opt.max });
    setMinStr(fmtIN(opt.min));
    setMaxStr(fmtIN(opt.max));
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = applyIndianCommas(e.target.value);
    setMinStr(formatted);
  };
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = applyIndianCommas(e.target.value);
    setMaxStr(formatted);
  };

  const commitMin = () => {
    const v = parseInput(minStr);
    setMinStr(v ? fmtIN(v) : '');
    setPreferences({ ...preferences, budgetMin: v });
  };
  const commitMax = () => {
    const v = parseInput(maxStr);
    setMaxStr(v ? fmtIN(v) : '');
    setPreferences({ ...preferences, budgetMax: v });
  };

  useEffect(() => {
    if (preferences.budgetMin) setMinStr(fmtIN(preferences.budgetMin));
    if (preferences.budgetMax) setMaxStr(fmtIN(preferences.budgetMax));
  }, [preferences.budgetMin, preferences.budgetMax]);

  return (
    <div className="space-y-2">
      {BUDGET_OPTIONS.map((opt, idx) => {
        const isSelected = preferences.budgetRange === opt.id;
        return (
          <motion.button
            key={opt.id}
            onClick={() => handlePreset(opt)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className={`
              group w-full flex items-center justify-between gap-4
              px-5 py-4 rounded-2xl border text-left transition-all duration-200
              ${isSelected
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                : 'bg-white text-black border-black/10 hover:border-black/25 hover:bg-black/[0.02] dark:bg-[#111] dark:text-white dark:border-white/10 dark:hover:border-white/25 dark:hover:bg-white/[0.02]'}
            `}
          >
            <div>
              <div className={`font-semibold text-[15px] ${isSelected ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                {opt.label}
              </div>
              <div className={`text-[12px] mt-0.5 ${isSelected ? 'text-white/60 dark:text-black/60' : 'text-black/40 dark:text-white/40'}`}>
                {opt.desc}
              </div>
            </div>
            <div className={`
              w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center
              transition-all duration-200
              ${isSelected ? 'border-white bg-white dark:border-black dark:bg-black' : 'border-black/15 dark:border-white/15'}
            `}>
              {isSelected && (
                <motion.div layoutId="budget-sel-dot" className="w-2 h-2 rounded-full bg-black dark:bg-white" />
              )}
            </div>
          </motion.button>
        );
      })}

      <AnimatePresence>
        {preferences.budgetRange && (
          <motion.div
            key="minmax"
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-black/8 dark:border-white/10">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-black/40 dark:text-white/40 mb-3">
                Fine-tune your budget
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-black/40 dark:text-white/40 mb-1.5 uppercase tracking-wider">
                    Minimum
                  </label>
                  <div className="relative flex items-center">
                    <IndianRupee size={13} className="absolute left-3 text-black/40 dark:text-white/40 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minStr}
                      onChange={handleMinChange}
                      onBlur={commitMin}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-black/12 dark:border-white/10
                        bg-black/[0.02] dark:bg-white/[0.02] text-sm font-semibold text-black dark:text-white
                        focus:outline-none focus:border-black/40 dark:focus:border-white/40 focus:bg-white dark:focus:bg-[#1A1A1A] transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-black/30 dark:text-white/30 mt-1 font-medium">
                    {formatRupees(parseInput(minStr) || 0)}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-black/40 dark:text-white/40 mb-1.5 uppercase tracking-wider">
                    Maximum
                  </label>
                  <div className="relative flex items-center">
                    <IndianRupee size={13} className="absolute left-3 text-black/40 dark:text-white/40 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxStr}
                      onChange={handleMaxChange}
                      onBlur={commitMax}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-black/12 dark:border-white/10
                        bg-black/[0.02] dark:bg-white/[0.02] text-sm font-semibold text-black dark:text-white
                        focus:outline-none focus:border-black/40 dark:focus:border-white/40 focus:bg-white dark:focus:bg-[#1A1A1A] transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-black/30 dark:text-white/30 mt-1 font-medium">
                    {formatRupees(parseInput(maxStr) || 0)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const StepPersonalize: React.FC = () => {
  const [wizardStep, setWizardStep] = useState(0);
  const [direction, setDirection]   = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    preferences, setPreferences,
    nextStep, analysisResult,
    campaignId, setSuggestions,
  } = useCampaign();

  const currentStepConfig = STEPS[wizardStep];

  // Multi-select for Goal (step 0), single-select for others
  const isGoalStep = wizardStep === 0;
  const selectedGoals: string[] = isGoalStep
    ? (Array.isArray(preferences.primaryGoal)
        ? preferences.primaryGoal
        : preferences.primaryGoal
          ? [preferences.primaryGoal]
          : [])
    : [];

  const handleSelect = (value: string) => {
    if (isGoalStep) {
      const already = selectedGoals.includes(value);
      const next = already
        ? selectedGoals.filter(g => g !== value)
        : [...selectedGoals, value];
      setPreferences({ ...preferences, primaryGoal: next.length === 1 ? next[0] : next });
    } else {
      setPreferences({ ...preferences, [currentStepConfig.key]: value });
    }
  };

  const currentSingleValue = !isGoalStep
    ? preferences[currentStepConfig.key as keyof typeof preferences] as string
    : '';

  const canProceed = isGoalStep
    ? selectedGoals.length > 0
    : !!currentSingleValue;

  const goNext = () => { setDirection(1);  setWizardStep(s => s + 1); };
  const goBack = () => { setDirection(-1); setWizardStep(s => s - 1); };

  const handleFindCreators = async () => {
    if (!campaignId) return;
    setIsGenerating(true);
    try {
      const { API_BASE_URL } = await import('../../../config/api');
      const { auth }         = await import('../../../firebaseConfig');
      let user = auth.currentUser;
      if (!user) {
        user = await new Promise<any>((resolve) => {
          const unsub = auth.onAuthStateChanged(u => { unsub(); resolve(u); });
        });
      }
      if (!user) throw new Error('Please log in to continue.');
      const token = await user.getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/campaigns/${campaignId}/generate-suggestions`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) throw new Error('Failed to generate suggestions');
      const data = await response.json();
      setSuggestions(data.suggestions);
      nextStep();
    } catch (err) {
      console.error('Error generating suggestions:', err);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-sans relative overflow-x-hidden flex items-start justify-center pt-8">

      {/* Subtle background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-pink-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-blue-500/15 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl px-6 py-14">

        {/* Step indicator */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-black/35 dark:text-white/35">
            Step {wizardStep + 1} / {STEPS.length}
          </span>
        </div>

        {/* Step title */}
        <AnimatePresence mode="wait">
          <motion.h3
            key={wizardStep + '-title'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-black tracking-tight mb-7"
          >
            {currentStepConfig.label}
            {isGoalStep && (
              <span className="ml-2 text-[13px] font-medium text-black/35 dark:text-white/35 tracking-normal">
                (multiple select)
              </span>
            )}
          </motion.h3>
        </AnimatePresence>

        {/* Options */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={wizardStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="space-y-2"
            >
              {wizardStep === 1 ? (
                <BudgetStep preferences={preferences} setPreferences={setPreferences} />
              ) : (
                currentStepConfig.options.map((opt, idx) => {
                  const isSelected = isGoalStep
                    ? selectedGoals.includes(opt.id)
                    : currentSingleValue === opt.id;
                  const Icon = 'icon' in opt ? (opt as any).icon : null;

                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`
                        group w-full flex items-center justify-between gap-4
                        px-5 py-4 rounded-2xl border text-left transition-all duration-200
                        ${isSelected
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                          : 'bg-white text-black border-black/10 hover:border-black/25 hover:bg-black/[0.02] dark:bg-[#111] dark:text-white dark:border-white/10 dark:hover:border-white/25 dark:hover:bg-white/[0.02]'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        {Icon && (
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                            ${isSelected ? 'bg-white/15 dark:bg-black/15' : 'bg-black/5 group-hover:bg-black/8 dark:bg-white/5 dark:group-hover:bg-white/8'}`}>
                            <Icon size={17} className={isSelected ? 'text-white dark:text-black' : 'text-black/50 dark:text-white/50'} />
                          </div>
                        )}
                        <div>
                          <div className={`font-semibold text-[15px] ${isSelected ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                            {opt.label}
                          </div>
                          <div className={`text-[12px] mt-0.5 ${isSelected ? 'text-white/60 dark:text-black/60' : 'text-black/40 dark:text-white/40'}`}>
                            {opt.desc}
                          </div>
                        </div>
                      </div>

                      {/* Indicator — checkbox style for multi, radio for single */}
                      <div className={`
                        flex-shrink-0 flex items-center justify-center transition-all duration-200
                        ${isGoalStep
                          ? `w-5 h-5 rounded-md border-2 ${isSelected ? 'bg-white border-white dark:bg-black dark:border-black' : 'border-black/20 dark:border-white/20'}`
                          : `w-5 h-5 rounded-full border ${isSelected ? 'border-white bg-white dark:border-black dark:bg-black' : 'border-black/15 dark:border-white/15'}`
                        }
                      `}>
                        {isSelected && (
                          isGoalStep
                            ? <Check size={12} className={isSelected ? 'text-black dark:text-white' : 'text-black/50 dark:text-white/50'} strokeWidth={3} />
                            : <motion.div layoutId="sel-dot" className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Bar */}
        <div className="mt-8 pt-5 border-t border-black/8 dark:border-white/10 flex items-center justify-between">
          {wizardStep > 0 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <ChevronLeft size={15} />
              Back
            </button>
          ) : <div />}

          {wizardStep < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!canProceed}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-bold
                hover:bg-black/85 dark:hover:bg-white/85 active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
            >
              Continue
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleFindCreators}
              disabled={!canProceed || isGenerating}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-bold
                hover:bg-black/85 dark:hover:bg-white/85 active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150
                shadow-[0_2px_12px_rgba(0,0,0,0.18)]"
            >
              {isGenerating ? (
                <><Sparkles size={15} className="animate-spin" /> Analyzing…</>
              ) : (
                <><ArrowRight size={15} /> Find Creators</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepPersonalize;
