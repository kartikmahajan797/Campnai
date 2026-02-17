import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { ArrowRight, Sparkles, X } from 'lucide-react';

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
  const { preferences, setPreferences, nextStep, analysisResult } = useCampaign();
  const [showAnalysisModal, setShowAnalysisModal] = React.useState(false);

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
        <div className="relative z-10 max-h-[85vh] overflow-y-auto custom-scrollbar pr-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white mb-2 tracking-tight transition-colors">Let's refine your campaign.</h2>
          
          <p className="text-black/50 dark:text-white/50 text-sm mb-6 transition-colors font-medium">
            We've analyzed your document. Help us tailor the strategy.
          </p>

          {analysisResult && (
            <motion.button
              onClick={() => setShowAnalysisModal(true)}
              className="w-full mb-8 p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl flex items-center justify-between group hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black dark:bg-white rounded-lg">
                  <Sparkles className="w-4 h-4 text-white dark:text-black" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">AI Brand Analysis</p>
                  <p className="text-[10px] text-black/50 dark:text-white/50 font-medium">Click to view full insights</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-black/30 dark:text-white/30 group-hover:text-black dark:group-hover:text-white transition-colors" />
            </motion.button>
          )}

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


      <AnimatePresence>
        {showAnalysisModal && analysisResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
             <motion.div 
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowAnalysisModal(false)}
             />
             <motion.div
               className="w-full max-w-2xl bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-3xl p-6 md:p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
             >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-extrabold text-black dark:text-white tracking-tight">AI Brand Analysis</h3>
                    <p className="text-sm text-black/50 dark:text-white/50 font-medium">Based on your uploaded brief</p>
                  </div>
                  <button 
                    onClick={() => setShowAnalysisModal(false)}
                    className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-black dark:text-white" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                   <div className="p-5 bg-black/5 dark:bg-white/5 rounded-2xl">
                      <p className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-2">About the Brand</p>
                      <div className="space-y-3">
                         <div>
                            <span className="text-xs text-black/50 dark:text-white/50 font-semibold block mb-0.5">Industry</span>
                            <span className="text-sm font-bold text-black dark:text-white">{analysisResult.industry}</span>
                         </div>
                         <div>
                            <span className="text-xs text-black/50 dark:text-white/50 font-semibold block mb-0.5">Brand Tone</span>
                            <span className="text-sm font-bold text-black dark:text-white">{analysisResult.brand_tone}</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-5 bg-black/5 dark:bg-white/5 rounded-2xl">
                      <p className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-2">Target Audience</p>
                      <div className="space-y-3">
                         <div>
                            <span className="text-xs text-black/50 dark:text-white/50 font-semibold block mb-0.5">Demographics</span>
                            <span className="text-sm font-bold text-black dark:text-white">{analysisResult.target_audience?.age_range || 'General'}</span>
                         </div>
                         <div>
                            <span className="text-xs text-black/50 dark:text-white/50 font-semibold block mb-0.5">Lifestyle</span>
                            <span className="text-sm font-bold text-black dark:text-white">{analysisResult.target_audience?.lifestyle || 'General'}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mb-8">
                  <p className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-4">Strategic Insights</p>
                  <div className="space-y-3">
                     {analysisResult.campaign_hooks?.slice(0, 3).map((hook, i) => (
                        <div key={i} className="flex gap-3 text-sm text-black/70 dark:text-white/70 font-medium">
                           <span className="w-5 h-5 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-bold shrink-0">{i+1}</span>
                           <span>{hook}</span>
                        </div>
                     ))}
                  </div>
                </div>

                <div className="flex justify-end">
                   <button
                     onClick={() => setShowAnalysisModal(false)}
                     className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                   >
                     Done
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepPersonalize;
