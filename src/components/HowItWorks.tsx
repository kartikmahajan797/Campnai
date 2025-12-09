import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    "Delivering the ready-to-collaborate list",
    "Managing contract signing",
    "Monitoring influencer progress",
    "Protecting campaign safety",
    "Tracking performance continuously",
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Work used to take months,{" "}
            <span className="gradient-text">Campnai makes it happen fast</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Campnai runs the entire influencer marketing process from start to end, you just need to review and approve like a boss.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* You Do */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">3</span>
              You only need to do
            </div>
            
            <ul className="space-y-4">
              {youDoTasks.map((task, index) => (
                <li key={task} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground font-medium">{task}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Handles */}
          <div className="bg-foreground text-background rounded-2xl p-8 shadow-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              AI Employee Handles
            </div>
            
            <ul className="space-y-3">
              {aiHandlesTasks.map((task) => (
                <li key={task} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-white/90 text-sm">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* AI Matching */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">AI-powered matching</h3>
            <p className="text-muted-foreground mb-6">
              Campnai has built the industry's first influencer matching system powered by LLMs. It allows AI to act like a marketing expert, evaluating content and understanding influencer audiences.
            </p>
            
            <div className="flex gap-8 mb-6">
              <div>
                <div className="text-3xl font-bold text-primary">5M+</div>
                <div className="text-sm text-muted-foreground">influencers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">140+</div>
                <div className="text-sm text-muted-foreground">countries</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Low-quality accounts Filtering", "Real-time risk detection", "Dynamic penalty system"].map((feature) => (
                <span key={feature} className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground">
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Scale Reach */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Scale reach globally</h3>
            <p className="text-muted-foreground mb-6">
              Launch campaigns across every continent. Our AI handles language barriers, cultural nuances, and platform differences automatically.
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {["YouTube", "Instagram", "TikTok", "Twitter", "Twitch", "LinkedIn"].map((platform) => (
                <div key={platform} className="flex items-center justify-center h-12 rounded-lg bg-muted text-sm font-medium">
                  {platform}
                </div>
              ))}
            </div>

            <Button variant="default" className="w-full">
              Book a demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
