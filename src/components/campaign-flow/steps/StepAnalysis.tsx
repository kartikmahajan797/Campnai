import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from '../CampaignContext';

const StepAnalysis: React.FC = () => {
  const { nextStep, setAnalysisResult, setIsAnalyzing, preferences } = useCampaign();
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);

  const analysisSteps = React.useMemo(() => {
    const steps = ['Scanning uploaded document...'];

    if (preferences.primaryGoal) {
      const goal = preferences.primaryGoal.length > 40 ? `${preferences.primaryGoal.substring(0, 40)}...` : preferences.primaryGoal;
      steps.push(`Mapping strategy for "${goal}"...`);
    } else {
      steps.push('Extracting brand voice...');
    }

    if (preferences.budgetRange) {
      const budget = preferences.budgetRange.length > 30 ? `${preferences.budgetRange.substring(0, 30)}...` : preferences.budgetRange;
      steps.push(`Optimizing for ${budget} budget...`);
    } else {
      steps.push('Mapping target audience...');
    }

    if (preferences.timeline) {
      steps.push(`Planning ${preferences.timeline} campaign timeline...`);
    } else {
      steps.push('Identifying market positioning...');
    }

    steps.push('Matching creators from database...');
    return steps;
  }, [preferences]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    analysisSteps.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setActiveIndex(i);
        }, i * 1200)
      );

      timers.push(
        setTimeout(() => {
          setCompletedIndices(prev => [...prev, i]);
        }, i * 1200 + 800)
      );
    });

    const finalTimer = setTimeout(() => {
      setIsAnalyzing(false);
      nextStep();
    }, analysisSteps.length * 1200 + 600);

    timers.push(finalTimer);

    return () => timers.forEach(clearTimeout);
  }, [nextStep, setAnalysisResult, setIsAnalyzing, analysisSteps, preferences]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-4 relative z-10 transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-black/5 dark:bg-white/5 rounded-full blur-[128px] pointer-events-none animate-pulse" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center max-w-2xl w-full relative z-10"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-black dark:text-white mb-2 text-center tracking-tight transition-colors">Activating Your AI Team</h2>
        <p className="text-black/60 dark:text-white/60 text-sm text-center mb-8 max-w-md transition-colors font-medium">
          Analyzing your brand to build the perfect campaign structure.
        </p>

        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-black/5 dark:border-white/5 transition-colors" />
          <div className="absolute inset-0 rounded-full border-4 border-t-black/80 dark:border-t-white/80 border-r-black/80 dark:border-r-white/80 border-b-transparent border-l-transparent animate-spin transition-colors" />
          <div className="absolute inset-2 rounded-full border-4 border-black/5 dark:border-white/5 transition-colors" />
          <div className="absolute inset-2 rounded-full border-4 border-b-black/40 dark:border-b-white/40 border-l-black/40 dark:border-l-white/40 border-t-transparent border-r-transparent animate-spin [animation-direction:reverse] transition-colors" />
          
          <div className="absolute inset-0 rounded-full bg-black/5 dark:bg-white/5 blur-[30px] animate-pulse transition-colors" />
        </div>

        <div className="w-full max-w-md flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {analysisSteps.map((step, i) => (
              i <= activeIndex && (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                    completedIndices.includes(i) 
                      ? 'bg-gray-100 dark:bg-white/5 border-transparent text-black dark:text-white opacity-100' 
                      : 'bg-white dark:bg-white/10 border-black/10 dark:border-white/20 text-black dark:text-white shadow-lg dark:shadow-none scale-[1.02]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                    completedIndices.includes(i) ? 'bg-green-500' : 'bg-black/60 dark:bg-white/60 animate-pulse'
                  }`} />
                  <span className="text-sm font-extrabold tracking-wide">{step}</span>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default StepAnalysis;
