import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, ArrowLeft } from 'lucide-react';
import campnaiLogo from '../assets/campnailogo.png';

const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <img src={campnaiLogo} alt="CampnAI" className="h-8 w-auto brightness-0 dark:invert" />
          <span className="text-foreground font-bold text-xl tracking-tight">CampnAI</span>
        </div>

        {/* Animated Icon */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30" />
          <div className="absolute inset-0 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            >
              <Wrench className="w-10 h-10 text-primary" />
            </motion.div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Under Maintenance</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight mb-4">
          We're improving<br />things for you.
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-sm">
          CampnAI is currently undergoing scheduled maintenance. The platform will be back shortly — better than ever.
        </p>

        {/* ETA */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium bg-muted/40 border border-border rounded-xl px-5 py-3 mb-10">
          <Clock className="w-4 h-4 text-primary" />
          <span>Expected back very soon</span>
        </div>

        {/* Back to landing */}
        <a
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to homepage
        </a>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-muted-foreground/50 z-10">
        © {new Date().getFullYear()} CampnAI · All systems being restored
      </p>
    </div>
  );
};

export default MaintenancePage;
