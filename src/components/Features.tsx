import { motion } from "framer-motion";
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
      color: "blue",
    },
    {
      icon: MessageSquare,
      title: "Automated Outreach",
      description: "AI crafts personalized invites that get responses. Scale without losing the human touch.",
      color: "green",
    },
    {
      icon: DollarSign,
      title: "Smart Negotiation",
      description: "Get fair pricing automatically. Our AI benchmarks rates across your industry.",
      color: "amber",
    },
    {
      icon: FileCheck,
      title: "Contract Management",
      description: "Auto-generated contracts with all terms. E-signatures make it official in minutes.",
      color: "purple",
    },
    {
      icon: Eye,
      title: "Content Review",
      description: "AI monitors posts for brand safety. Get alerts before anything goes live.",
      color: "pink",
    },
    {
      icon: BarChart3,
      title: "Performance Tracking",
      description: "Real-time analytics across all campaigns. Know your ROI as it happens.",
      color: "cyan",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="features" className="py-32 relative overflow-hidden bg-background">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-premium mb-6"
          >
            Core Capabilities
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 tracking-tight"
          >
            Everything automated,{" "}
            <span className="gradient-text whitespace-nowrap">end-to-end</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            From finding creators to tracking ROI, Campnai handles every step of your influencer marketing workflow with agentic precision.
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group glass-card border-white/40 p-10 hover:border-primary/30 transition-all duration-300"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-border group-hover:scale-110 transition-transform bg-white/50 shadow-sm`}>
                <feature.icon className={`w-8 h-8 text-foreground`} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
