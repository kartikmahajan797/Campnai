import React from 'react';
import { motion } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { ArrowRight, Sparkles, Rocket, PlayCircle } from 'lucide-react';

const StepWelcome: React.FC = () => {
  const { nextStep } = useCampaign();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden bg-background text-foreground px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:60px_60px] pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[128px] pointer-events-none animate-pulse delay-1000" />

      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-500/15 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-pink-500/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-blue-500/15 rounded-full blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center justify-center z-10 max-w-4xl text-center px-4"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8 p-3 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-sm shadow-xl"
        >
          <Rocket className="w-8 h-8 text-primary" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Launch high-impact <br />
          <span className="text-foreground">
             campaigns in seconds.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
          AI-driven influencer marketing that eliminates the chaos. 
          Upload a brief, get a strategy, and find creators instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <motion.button
            onClick={nextStep}
            className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-primary/20 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Sparkles className="w-5 h-5 group-hover:animate-spin-slow" />
            <span>Create New Campaign</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          <motion.button
            className="flex items-center justify-center gap-2 px-8 py-4 bg-background border border-border text-foreground rounded-xl font-bold text-lg hover:bg-muted/50 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <PlayCircle className="w-5 h-5" />
            <span>Watch Demo</span>
          </motion.button>
        </div>

        <motion.div 
          className="mt-16 grid grid-cols-3 gap-8 md:gap-16 opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8 }}
        >
           <div className="flex flex-col items-center gap-2">
              <span className="font-extrabold text-2xl md:text-3xl">2k+</span>
              <span className="text-xs font-bold uppercase tracking-wider">Creators</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <span className="font-extrabold text-2xl md:text-3xl">500+</span>
              <span className="text-xs font-bold uppercase tracking-wider">Brands</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <span className="font-extrabold text-2xl md:text-3xl">10x</span>
              <span className="text-xs font-bold uppercase tracking-wider">ROI</span>
           </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StepWelcome;
