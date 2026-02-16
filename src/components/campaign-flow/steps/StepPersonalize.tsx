import React from 'react';
import { motion } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { ArrowRight, Sparkles } from 'lucide-react';

const GOALS = ['Awareness', 'Sales / Conversions', 'Product Launch', 'App Installs', 'Creator Seeding'];
const BUDGETS = ['Under ₹1 Lakh', '₹1-5 Lakh', '₹5-10 Lakh'];
const TIMELINES = ['1 Week', '15 Days', '30 Days'];

const ChipGroup: React.FC<{
  label: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
}> = ({ label, options, selected, onSelect }) => (
  <div className="mb-6 last:mb-0">
    <label className="block text-[10px] font-extrabold text-black/40 dark:text-white/40 uppercase tracking-widest mb-2 transition-colors">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <motion.button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`px-4 py-2 rounded-full border text-xs font-medium transition-all duration-300 ${
            selected === opt 
              ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]' 
              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20'
          }`}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          {opt}
        </motion.button>
      ))}
    </div>
  </div>
);

const StepPersonalize: React.FC = () => {
  const { preferences, setPreferences, nextStep } = useCampaign();

  const isComplete = preferences.primaryGoal && preferences.budgetRange && preferences.timeline;

  const handleGenerate = () => {
    if (!isComplete) return;
    nextStep();
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full px-4 relative z-10 bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 dark:bg-white/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/5 dark:bg-white/5 rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        className="w-full max-w-lg bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-[1.5rem] p-6 md:p-8 relative overflow-hidden shadow-2xl z-10 backdrop-blur-sm transition-colors"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white mb-2 tracking-tight transition-colors">Let's refine your campaign.</h2>
          <p className="text-black/50 dark:text-white/50 text-sm mb-8 transition-colors font-medium">
            We've analyzed your document. Help us tailor the strategy.
          </p>

          <ChipGroup
            label="PRIMARY GOAL"
            options={GOALS}
            selected={preferences.primaryGoal}
            onSelect={(val) => setPreferences({ ...preferences, primaryGoal: val })}
          />

          <ChipGroup
            label="BUDGET RANGE"
            options={BUDGETS}
            selected={preferences.budgetRange}
            onSelect={(val) => setPreferences({ ...preferences, budgetRange: val })}
          />

          <ChipGroup
            label="TIMELINE"
            options={TIMELINES}
            selected={preferences.timeline}
            onSelect={(val) => setPreferences({ ...preferences, timeline: val })}
          />

          <div className="mt-10">
            <motion.button
              onClick={handleGenerate}
              disabled={!isComplete}
              className="w-full h-12 bg-black dark:bg-white text-white dark:text-black rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              whileHover={isComplete ? { scale: 1.01 } : {}}
              whileTap={isComplete ? { scale: 0.99 } : {}}
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Campaign Strategy</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <p className="text-center mt-4 text-black/30 dark:text-white/30 text-[10px] font-medium transition-colors">
              You can adjust this later in the campaign settings.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StepPersonalize;
