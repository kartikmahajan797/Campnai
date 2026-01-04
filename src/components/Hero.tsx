import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import dashboardPreview from "@/assets/dashboard-preview.png";

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-6 z-10">
        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-white/40 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-muted-foreground">The future of influencer marketing is here</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-8"
          >
            Meet Neo, your <br />
            <span className="gradient-text">Agentic Marketing Partner</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Empowering Indian SMB's and Agencies with autonomous AI agents that handle discovery, outreach, and campaign management 24/7.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link to="/signup">
              <Button variant="default" size="lg" className="h-14 px-8 rounded-full text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all">
                Get Started Free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-base font-semibold glass-card border-border hover:bg-secondary/50 transition-all">
              Watch 1 min demo
            </Button>
          </motion.div>
        </div>

        {/* Dashboard Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Main Glow */}
          <div className="absolute -inset-10 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[3rem] blur-[80px] opacity-50" />

          <div className="relative glass-card-dark p-2 sm:p-4 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
            <div className="relative rounded-[1rem] sm:rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={dashboardPreview}
                alt="Campnai Dashboard Preview"
                className="w-full h-auto brightness-[0.9] hover:brightness-100 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Floating Element Mockup (CSS only for speed) */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 top-1/4 glass-card p-4 hidden lg:block border-white/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-accent animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Neo is Active</p>
                <p className="text-[10px] text-muted-foreground">Analyzing 4.2k influencers...</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
