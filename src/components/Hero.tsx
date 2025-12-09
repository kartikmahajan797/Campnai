import { Button } from "@/components/ui/button";
import dashboardPreview from "@/assets/dashboard-preview.png";

const Hero = () => {
  return (
    <section className="pt-24 pb-16 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            24/7 execution for you
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 animate-fade-up animation-delay-100">
            Your AI Employee for{" "}
            <span className="gradient-text">Influencer Marketing</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-up animation-delay-200">
            Built for AI companies that want faster collaboration, less manual work, and clear control from start to end with AI-powered workflows.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animation-delay-300">
            <Button variant="hero" size="xl">
              Sign up
            </Button>
            <Button variant="heroOutline" size="xl">
              Get a free 30 min demo
            </Button>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto animate-slide-up animation-delay-400">
          {/* Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-60" />
          
          {/* Image Container */}
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
            <img
              src={dashboardPreview}
              alt="Campnai Dashboard - Influencer Marketing Platform"
              className="w-full h-auto"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
