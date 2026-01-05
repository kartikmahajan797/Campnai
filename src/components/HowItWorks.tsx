import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const HowItWorks = () => {
  const youDoTasks = [
    "Create a campaign",
    "Confirm the ready-to-collaborate list",
    "Review influencer content",
  ];

  const aiHandlesTasks = [
    "Finding the best-fit influencer",
    "Sending collaboration invitations",
    "Securing reasonable pricing",
    "Delivering ready-to-collaborate list",
    "Managing contract signing",
    "Monitoring progress & safety",
    "Tracking performance 24/7",
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-background">
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 tracking-tight"
          >
            Work used to take months, <br />
            <span className="gradient-text">Neo makes it happen in hours</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            Campnai runs the entire influencer marketing process. You simply review and approve like a visionary leader.
          </motion.p>
        </div>

        {/* Comparison Cards */}
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto mb-20">
          {/* You Do */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card border-white/40 p-10 flex flex-col"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 w-fit">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs">3</span>
              Steps for you
            </div>

            <ul className="space-y-6 flex-grow">
              {youDoTasks.map((task, index) => (
                <motion.li
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  key={task}
                  className="flex items-start gap-4"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-xl font-semibold text-foreground">{task}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* AI Handles */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[hsl(220,25%,6%)] text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-bold mb-8 w-fit">
                <Zap className="w-4 h-4 text-accent" />
                AI Agent Handles Everything Else
              </div>

              <ul className="grid sm:grid-cols-1 gap-4">
                {aiHandlesTasks.map((task, index) => (
                  <motion.li
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    key={task}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-accent">
                      <Check className="w-3 h-3 transition-transform group-hover:scale-125" />
                    </div>
                    <span className="text-white/80 text-lg">{task}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Global Reach Feature */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card border-white/40 p-12 max-w-6xl mx-auto text-center"
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-6">Scale reach globally with AI</h3>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Our LLM-powered matching system evaluates content across 140+ countries, overcoming language barriers and cultural nuances automatically.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {["Instagram", "YouTube", "TikTok", "LinkedIn", "Twitter"].map((platform) => (
                <div key={platform} className="px-6 py-3 rounded-2xl bg-white/50 border border-border font-bold text-foreground shadow-sm hover:scale-105 transition-transform">
                  {platform}
                </div>
              ))}
            </div>

            <Button variant="default" size="lg" className="h-14 px-10 rounded-full text-base font-bold">
              Explore Global Network
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
