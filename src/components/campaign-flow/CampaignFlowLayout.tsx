import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from './CampaignContext';

import { Cloud, Check, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

interface CampaignFlowLayoutProps {
  children: React.ReactNode;
}

const SyncStatus = () => {
    const { saveStatus } = useCampaign();
    
    if (saveStatus === 'idle') return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full shadow-sm"
        >
            {saveStatus === 'saving' && (
                <>
                    <Loader2 size={14} className="text-blue-500 animate-spin" />
                    <span className="text-[10px] font-medium text-black/60 dark:text-white/60">Saving...</span>
                </>
            )}
            {saveStatus === 'saved' && (
                <>
                    <Cloud size={14} className="text-green-500" />
                    <Check size={10} className="text-green-500 -ml-1 mt-1" />
                    <span className="text-[10px] font-medium text-black/60 dark:text-white/60">Saved to Cloud</span>
                </>
            )}
            {saveStatus === 'error' && (
                <>
                    <AlertCircle size={14} className="text-red-500" />
                    <span className="text-[10px] font-medium text-red-500">Sync Error</span>
                </>
            )}
        </motion.div>
    );
};

import { PremiumBackground } from '../ui/premium-background';

const BackButton = () => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate('/dashboard/history')}
            className="fixed top-5 left-5 z-50 flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-full shadow-sm text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-900 transition-all"
        >
            <ArrowLeft size={14} /> Back
        </button>
    );
};

const CampaignFlowLayout: React.FC<CampaignFlowLayoutProps> = ({ children }) => {
  const { currentStep } = useCampaign();

  return (
    <div className="min-h-screen w-full font-sans selection:bg-black/10 dark:selection:bg-white/20 selection:text-black dark:selection:text-white relative">
      <PremiumBackground />
      
      {/* Back Button — top-left */}
      <BackButton />

      {/* Cloud Sync Status */}
      <div className="fixed top-6 right-6 z-50 pointer-events-none">
         <SyncStatus />
      </div>

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
