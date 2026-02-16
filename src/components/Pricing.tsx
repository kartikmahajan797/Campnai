import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Pricing = () => {
  return (
    <section id="pricing" className="py-32 relative overflow-hidden bg-background flex items-center justify-center min-h-[600px]">
      {/* Background Nebula Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Large nebula sweep from right */}
        <div className="absolute top-0 right-0 w-[80%] h-full bg-gradient-to-l from-primary/10 via-secondary/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[70%] bg-gradient-to-t from-primary/5 via-secondary/5 to-transparent blur-[100px]" />

        {/* Star dust effect */}

      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-10 leading-tight tracking-tight">
            Ready to run your<br />
            first campaign without the chaos?
          </h2>

          <div className="flex flex-col items-center gap-6">
            <Button
              size="lg"
              className="h-16 px-10 rounded-full text-lg lg:text-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg border-none transition-all hover:scale-105"
            >
              Start My First Campaign <ArrowRight className="ml-2 w-6 h-6" />
            </Button>

            <p className="text-muted-foreground text-sm md:text-base font-medium tracking-wide">
              No credit card • Guided onboarding • Takes 2 minutes.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Pricing;
