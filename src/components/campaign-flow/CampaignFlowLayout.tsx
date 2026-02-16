import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from './CampaignContext';

interface CampaignFlowLayoutProps {
  children: React.ReactNode;
}

const CampaignFlowLayout: React.FC<CampaignFlowLayoutProps> = ({ children }) => {
  const { currentStep } = useCampaign();

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-black/10 dark:selection:bg-white/20 selection:text-black dark:selection:text-white relative overflow-x-hidden transition-colors duration-300">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0" />
      
      <AnimatePresence mode="wait">
        <motion.main
          key={currentStep}
          className="min-h-screen flex flex-col items-center relative z-10 p-4 md:p-8"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default CampaignFlowLayout;
