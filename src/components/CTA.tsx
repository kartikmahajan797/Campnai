import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-foreground" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(220,90%,56%,0.15),hsl(260,80%,60%,0.15),hsl(320,70%,55%,0.1))]" />
          
          {/* Content */}
          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to automate your{" "}
              <span className="text-primary">influencer marketing?</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
              Join thousands of brands using Campnai to run smarter campaigns with less effort and better results.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="light" size="xl" className="group">
                Get started free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="heroOutline" 
                size="xl" 
                className="border-white/20 text-white hover:bg-white/10"
              >
                Schedule a demo
              </Button>
            </div>

            <p className="text-white/50 text-sm mt-6">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
