import { motion } from "framer-motion";
import { TestimonialSlider } from "@/components/ui/testimonial-slider-1";
import scoutImg from "../assets/scout.jpeg";
import closerImg from "../assets/closer.jpeg";
import producerImg from "../assets/producer.jpeg";
import accountantImg from "../assets/accountant.jpeg";

const aiEmployees = [
  {
    id: 1,
    name: "Scout",
    affiliation: "Influencer Discovery",
    quote:
      "Scout finds the perfect influencers for your brand using AI-powered search across niches, engagement rates, and audience demographics.",
    imageSrc: scoutImg,
    thumbnailSrc: scoutImg,
  },
  {
    id: 2,
    name: "Closer",
    affiliation: "Outreach & Deals",
    quote:
      "Closer handles all influencer negotiations autonomously — from initial outreach to finalizing contracts and rates.",
    imageSrc: closerImg,
    thumbnailSrc: closerImg,
  },
  {
    id: 3,
    name: "Producer",
    affiliation: "Campaign Control",
    quote:
      "Producer manages your entire campaign lifecycle — content approvals, timelines, deliverables, and real-time tracking.",
    imageSrc: producerImg,
    thumbnailSrc: producerImg,
  },
  {
    id: 4,
    name: "Accountant",
    affiliation: "Payments & ROI",
    quote:
      "Accountant automates influencer payouts, tracks campaign ROI, and generates financial reports — all in one place.",
    imageSrc: accountantImg,
    thumbnailSrc: accountantImg,
  },
];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background pt-28 pb-24">

      {/* Background Gradient Effects */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-600/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/25 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[50%] h-[50%] bg-fuchsia-600/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background z-0" />
      </div>

      <div className="container relative mx-auto px-4 z-10 flex flex-col items-center text-center mt-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            India's First Agentic Influencer Platform
          </span>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-5xl mx-auto mb-10"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Meet Your AI Employees<br />
            for{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Influencer Marketing
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light mt-10 leading-relaxed">
            From discovery to payouts, CampnAI runs your entire influencer workflow autonomously. 
            No spreadsheets. No chaos. Just results.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-14"
        >
          {[
            { value: "10x", label: "Less Manual Effort" },
            { value: "90%", label: "Time Saved" },
            { value: "70%", label: "Faster Setup" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* AI Employee Slider */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-6xl mx-auto mt-4"
        >
          <TestimonialSlider
            reviews={aiEmployees}
            className="rounded-2xl border border-border/50 shadow-xl bg-background/80 backdrop-blur-sm"
          />
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
