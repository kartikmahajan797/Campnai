import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Pricing = () => {
  return (
    <section id="pricing" className="py-40 relative overflow-hidden bg-background flex items-center justify-center min-h-[700px]">
      {/* Background Nebula Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-[80%] h-full bg-gradient-to-l from-primary/10 via-secondary/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[70%] bg-gradient-to-t from-primary/5 via-secondary/5 to-transparent blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">Simple Pricing</p>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight tracking-tight">
            Ready to run your<br />
            first campaign{" "}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              without the chaos?
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-14">
            Start free. Scale when you're ready. No surprise bills, no seat licenses, no enterprise sales calls.
          </p>

          <div className="flex flex-col items-center gap-8">
            <Button
              size="lg"
              className="h-18 px-12 py-5 rounded-full text-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl border-none transition-all hover:scale-105"
            >
              Start My First Campaign <ArrowRight className="ml-3 w-6 h-6" />
            </Button>

            <p className="text-muted-foreground text-base md:text-lg font-medium tracking-wide">
              No credit card • Guided onboarding • Takes 2 minutes
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Pricing;
