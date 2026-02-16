import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Space Background Effects */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 rounded-full blur-[120px]" />

      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-border shadow-2xl shadow-primary/5">
          {/* Card Background */}
          <div className="absolute inset-0 bg-card/80 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />

          {/* Content */}
          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Ready to automate your{" "}
              <span className="text-primary underline decoration-primary/30 underline-offset-8">influencer marketing?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of brands using Campnai to run smarter campaigns with less effort and better results.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" className="h-14 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all hover:scale-105">
                Get started free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="h-14 px-8 rounded-full border-border text-foreground hover:bg-muted/50 backdrop-blur-sm"
              >
                Schedule a demo
              </Button>
            </div>

            <p className="text-muted-foreground text-sm mt-8 font-medium">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
