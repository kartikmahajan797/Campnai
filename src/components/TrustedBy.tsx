import { motion } from "framer-motion";
import { Search, Mail, BarChart3, TrendingUp } from "lucide-react";

const TrustedBy = () => {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-5">The Problem</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
            Influencer marketing isn't hard.<br />
            <span className="text-muted-foreground">Managing it is.</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Teams waste weeks juggling tools, spreadsheets, and DMs. Here's what breaks first.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1: Discovery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative p-10 rounded-3xl bg-card border border-border/50 hover:border-primary transition-all duration-300 hover:shadow-xl flex flex-col items-center text-center backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative mb-8 p-5 rounded-2xl bg-primary/10">
              <Search className="w-10 h-10 text-primary" />
            </div>
            <h3 className="relative text-2xl font-bold text-foreground mb-4">Discovery<br />is noisy</h3>
            <p className="relative text-muted-foreground text-lg leading-relaxed">
              Vanity metrics, endless filters — no real context. Hours wasted on creators who don't fit your brand.
            </p>
          </motion.div>

          {/* Card 2: Outreach */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative p-10 rounded-3xl bg-card border border-border/50 hover:border-primary transition-all duration-300 hover:shadow-xl flex flex-col items-center text-center backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative mb-8 p-5 rounded-2xl bg-primary/10">
              <Mail className="w-10 h-10 text-primary" />
              <div className="absolute top-0 right-0 w-6 h-6 bg-destructive rounded-full flex items-center justify-center text-[11px] font-bold text-destructive-foreground border-2 border-background">5</div>
            </div>
            <h3 className="relative text-2xl font-bold text-foreground mb-4">Outreach<br />is chaotic</h3>
            <p className="relative text-muted-foreground text-lg leading-relaxed">
              Emails, DMs, follow-ups scattered across tools. Nothing is tracked, nothing is synced.
            </p>
          </motion.div>

          {/* Card 3: Execution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative p-10 rounded-3xl bg-card border border-border/50 hover:border-primary transition-all duration-300 hover:shadow-xl flex flex-col items-center text-center backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative mb-8 p-5 rounded-2xl bg-primary/10">
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
            <h3 className="relative text-2xl font-bold text-foreground mb-4">Execution<br />leaks intelligence</h3>
            <p className="relative text-muted-foreground text-lg leading-relaxed">
              Insights die between tools and people. By the time you get data, it's too late to act.
            </p>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground mt-20 text-xl md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed"
        >
          Most teams don't fail at ideas. They fail at execution.<br />
          <span className="text-foreground font-semibold">That's where Neo comes in.</span>
        </motion.p>

      </div>
    </section>
  );
};

export default TrustedBy;
