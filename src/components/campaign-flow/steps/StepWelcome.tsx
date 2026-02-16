import React from 'react';
import { motion } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { ArrowRight } from 'lucide-react';

const StepWelcome: React.FC = () => {
  const { nextStep } = useCampaign();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden bg-white dark:bg-black text-black dark:text-white px-4 transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-black/5 dark:bg-white/5 rounded-full blur-[128px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-black/5 dark:bg-white/5 rounded-full blur-[128px] pointer-events-none animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex flex-col items-center justify-center z-10 max-w-2xl text-center px-4"
      >
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1] text-black dark:text-white transition-colors max-w-4xl mx-auto">
          Ready to run your <br className="hidden md:block" />
          first campaign <br className="hidden md:block" />
          without the chaos?
        </h1>

        <motion.button
          onClick={nextStep}
          className="group relative flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-extrabold text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl overflow-hidden mb-4"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <span className="relative z-10">Start My First Campaign</span>
          <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <motion.p 
          className="text-[10px] md:text-xs text-black/40 dark:text-white/40 font-medium tracking-wide transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          No credit card • Guided onboarding • Takes 2 minutes.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default StepWelcome;
