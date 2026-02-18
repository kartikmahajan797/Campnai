import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import {
  ArrowRight, Sparkles, Target, Zap,
  Users, DollarSign, Clock,
  CheckCircle2, ChevronRight, ChevronLeft
} from 'lucide-react';

const GOAL_OPTIONS = [
  { id: 'Awareness',           label: 'Brand Awareness',   desc: 'Maximize reach & visibility',  icon: Users      },
  { id: 'Sales / Conversions', label: 'Sales & Conversions', desc: 'Drive purchases & ROI',       icon: DollarSign },
  { id: 'Product Launch',      label: 'Product Launch',    desc: 'Hype for new products',          icon: Zap        },
  { id: 'App Installs',        label: 'App Installs',      desc: 'Drive downloads',                icon: Target     },
  { id: 'Creator Seeding',     label: 'Creator Seeding',   desc: 'Gift products to many',          icon: Sparkles   },
];

const BUDGET_OPTIONS = [
  { id: 'Under ₹1 Lakh', label: '< ₹1 Lakh',   desc: 'Micro — testing waters'   },
  { id: '₹1-5 Lakh',     label: '₹1 – 5 Lakh', desc: 'Growth — scaling up'      },
  { id: '₹5-10 Lakh',    label: '₹5 – 10 Lakh',desc: 'Scale — dominating niche' },
  { id: '₹10 Lakh+',     label: '₹10 Lakh+',   desc: 'Enterprise — full force'  },
];

const TIMELINE_OPTIONS = [
  { id: '1 Week',   label: '1 Week',   desc: 'Sprint — quick burst'           },
  { id: '15 Days',  label: '15 Days',  desc: 'Campaign — sustained push'      },
  { id: '30 Days',  label: '30 Days',  desc: 'Marathon — long-term building'  },
];

const STEPS = [
  { key: 'primaryGoal', label: 'Primary Goal',       options: GOAL_OPTIONS    },
  { key: 'budgetRange', label: 'Budget Range',        options: BUDGET_OPTIONS  },
  { key: 'timeline',    label: 'Campaign Duration',   options: TIMELINE_OPTIONS},
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

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
  const currentValue = preferences[currentStepConfig.key as keyof typeof preferences] as string;

  const handleSelect = (value: string) => {
    setPreferences({ ...preferences, [currentStepConfig.key]: value });
  };

  const goNext = () => {
    setDirection(1);
    setWizardStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setWizardStep(s => s - 1);
  };

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
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
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

  const canProceed = !!currentValue;

  return (
    <div className="min-h-screen bg-white text-black font-sans relative overflow-hidden">

      
      {/* Subtle Neon Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-500/15 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-pink-500/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-blue-500/15 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10">
          {/* ── Top rule ── */}
      <div className="h-px w-full bg-black/10" />

      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* ═══════════════════════════════════════
            LEFT — Intelligence Panel
        ═══════════════════════════════════════ */}
        <motion.aside
          className="lg:sticky lg:top-12 space-y-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Eyebrow */}
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-black/40 mb-1">
              Campaign Intelligence
            </p>
            <h2 className="text-3xl font-black tracking-tight leading-none">
              {analysisResult?.brand_name || 'Your Brand'}
            </h2>
            <p className="mt-1.5 text-[15px] text-black/50">
              {analysisResult?.industry || 'Industry'} · {analysisResult?.brand_tone || 'Brand tone'}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/8" />

          {/* Target Audience */}
          <div>
            <p className="text-xs font-bold tracking-[0.14em] uppercase text-black/40 mb-3">
              Target Audience
            </p>
            <div className="border border-black/10 rounded-2xl p-5 bg-black/[0.02]">
              <p className="text-[15px] font-semibold">
                {analysisResult?.target_audience?.age_range || 'General Audience'}
              </p>
              <p className="text-[14px] text-black/50 mt-1.5 leading-relaxed">
                {analysisResult?.target_audience?.lifestyle || 'No lifestyle data'}
              </p>
              {analysisResult?.target_audience?.interests?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {analysisResult.target_audience.interests.slice(0, 4).map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full border border-black/12 text-xs font-medium text-black/55 bg-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Strategic Hooks */}
          {analysisResult?.campaign_hooks?.length > 0 && (
            <div>
              <p className="text-xs font-bold tracking-[0.14em] uppercase text-black/40 mb-4">
                Strategic Hooks
              </p>
              <ol className="space-y-3">
                {analysisResult.campaign_hooks.slice(0, 3).map((hook: string, i: number) => (
                  <li
                    key={i}
                    className="flex gap-3 items-start"
                  >
                    <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border border-black/15 flex items-center justify-center text-xs font-bold text-black/40">
                      {i + 1}
                    </span>
                    <span className="text-[15px] text-black/75 leading-snug font-medium">
                      {hook}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Progress / Selection summary */}
          <div>
            <p className="text-xs font-bold tracking-[0.14em] uppercase text-black/40 mb-4">
              Your Selection
            </p>
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const val = preferences[step.key as keyof typeof preferences] as string;
                const done   = i < wizardStep;
                const active = i === wizardStep;
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    {/* dot */}
                    <div className={`mt-[5px] w-2 h-2 rounded-full flex-shrink-0 ${
                      done   ? 'bg-black' :
                      active ? 'bg-black/35 ring-2 ring-offset-1 ring-black/20' :
                               'bg-black/10'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-[15px] font-semibold leading-tight ${
                        done || active ? 'text-black' : 'text-black/30'
                      }`}>
                        {step.label}
                      </span>
                      {val && (
                        <p className="text-[13px] text-black/45 font-medium mt-0.5 leading-snug">
                          {val}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.aside>

        {/* ═══════════════════════════════════════
            RIGHT — Wizard Panel
        ═══════════════════════════════════════ */}
        <div>

          {/* Step header */}
          <motion.div
            className="mb-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-black/35">
                Step {wizardStep + 1} / {STEPS.length}
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">
              {currentStepConfig.label}
            </h3>
          </motion.div>

          {/* Options list */}
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
                {currentStepConfig.options.map((opt, idx) => {
                  const isSelected = currentValue === opt.id;
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
                        px-5 py-4 rounded-2xl border text-left
                        transition-all duration-200
                        ${isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black/10 hover:border-black/25 hover:bg-black/[0.02]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        {Icon && (
                          <div
                            className={`
                              w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                              ${isSelected ? 'bg-white/15' : 'bg-black/5 group-hover:bg-black/8'}
                            `}
                          >
                            <Icon
                              size={17}
                              className={isSelected ? 'text-white' : 'text-black/50'}
                            />
                          </div>
                        )}
                        <div>
                          <div className={`font-semibold text-[15px] ${isSelected ? 'text-white' : 'text-black'}`}>
                            {opt.label}
                          </div>
                          <div className={`text-[12px] mt-0.5 ${isSelected ? 'text-white/60' : 'text-black/40'}`}>
                            {opt.desc}
                          </div>
                        </div>
                      </div>

                      {/* Selection indicator */}
                      <div
                        className={`
                          w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center
                          transition-all duration-200
                          ${isSelected
                            ? 'border-white bg-white'
                            : 'border-black/15'
                          }
                        `}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="sel-dot"
                            className="w-2 h-2 rounded-full bg-black"
                          />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Action Bar ── */}
          <div className="mt-8 pt-5 border-t border-black/8 flex items-center justify-between">

            {wizardStep > 0 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-black/40 hover:text-black hover:bg-black/5 transition-all"
              >
                <ChevronLeft size={15} />
                Back
              </button>
            ) : (
              <div />
            )}

            

            {wizardStep < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                disabled={!canProceed}
                className="
                  flex items-center gap-2 px-6 py-2.5 rounded-xl
                  bg-black text-white text-sm font-bold
                  hover:bg-black/85 active:scale-[0.98]
                  disabled:opacity-25 disabled:cursor-not-allowed
                  transition-all duration-150
                "
              >
                Continue
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleFindCreators}
                disabled={!canProceed || isGenerating}
                className="
                  flex items-center gap-2 px-7 py-2.5 rounded-xl
                  bg-black text-white text-sm font-bold
                  hover:bg-black/85 active:scale-[0.98]
                  disabled:opacity-25 disabled:cursor-not-allowed
                  transition-all duration-150
                  shadow-[0_2px_12px_rgba(0,0,0,0.18)]
                "
              >
                {isGenerating ? (
                  <>
                    <Sparkles size={15} className="animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    Find Creators
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default StepPersonalize;