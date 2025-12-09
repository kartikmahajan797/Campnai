import { 
  Search, 
  MessageSquare, 
  DollarSign, 
  FileCheck, 
  Eye,
  BarChart3
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Search,
      title: "Smart Discovery",
      description: "LLM-powered search finds creators who truly match your brand, not just keywords.",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: MessageSquare,
      title: "Automated Outreach",
      description: "AI crafts personalized invites that get responses. Scale without losing the human touch.",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: DollarSign,
      title: "Smart Negotiation",
      description: "Get fair pricing automatically. Our AI benchmarks rates across your industry.",
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      icon: FileCheck,
      title: "Contract Management",
      description: "Auto-generated contracts with all terms. E-signatures make it official in minutes.",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: Eye,
      title: "Content Review",
      description: "AI monitors posts for brand safety. Get alerts before anything goes live.",
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      icon: BarChart3,
      title: "Performance Tracking",
      description: "Real-time analytics across all campaigns. Know your ROI as it happens.",
      color: "bg-cyan-500/10 text-cyan-500",
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="badge-primary mb-6">
            Features
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Everything automated,{" "}
            <span className="gradient-text">end-to-end</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From finding creators to tracking ROI, Campnai handles every step of your influencer marketing workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl border border-border p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
