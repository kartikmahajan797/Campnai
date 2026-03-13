import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  PencilSimple,
  CurrencyDollar,
  CloudArrowUp,
  Buildings,
  Headset,
  ChartBar,
  Heart,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const allFeatures: FeatureItem[] = [
  {
    icon: <MagnifyingGlass size={24} weight="light" />,
    title: "AI-Powered Discovery",
    description:
      "Find the perfect creators for your brand with intelligent matching — no endless scrolling.",
  },
  {
    icon: <PencilSimple size={24} weight="light" />,
    title: "Effortless Outreach",
    description:
      "It's as easy as telling Neo what you need. Personalised briefs and messages, sent automatically.",
  },
  {
    icon: <CurrencyDollar size={24} weight="light" />,
    title: "Transparent Pricing",
    description:
      "Our pricing is clear and honest. No hidden fees, no lock-in, no credit card required to start.",
  },
  {
    icon: <CloudArrowUp size={24} weight="light" />,
    title: "Always-On Platform",
    description:
      "Your campaigns never sleep. 99.9% uptime so you can manage creators around the clock.",
  },
  {
    icon: <Buildings size={24} weight="light" />,
    title: "Multi-Brand Support",
    description:
      "Manage multiple brands from a single account. Share access with your team without extra seats.",
  },
  {
    icon: <Headset size={24} weight="light" />,
    title: "24/7 Support",
    description:
      "We're available whenever you need us. Real humans, not just chatbots, ready to help you succeed.",
  },
  {
    icon: <ChartBar size={24} weight="light" />,
    title: "Real-Time Analytics",
    description:
      "Track every campaign in real-time. ROI, reach, engagement — all in one intelligent dashboard.",
  },
  {
    icon: <Heart size={24} weight="light" />,
    title: "And So Much More",
    description:
      "From automated follow-ups to smart scheduling — everything you need to scale influencer marketing.",
  },
];

const ITEMS_PER_PAGE = 8;

const Features = () => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(allFeatures.length / ITEMS_PER_PAGE);
  const currentFeatures = allFeatures.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const handlePrev = useCallback(() => {
    setPage((p) => (p > 0 ? p - 1 : totalPages - 1));
  }, [totalPages]);

  const handleNext = useCallback(() => {
    setPage((p) => (p < totalPages - 1 ? p + 1 : 0));
  }, [totalPages]);

  return (
    <section className="py-20 md:py-28 bg-background relative">
      <div className="container mx-auto px-6 max-w-7xl relative">
        {/* Navigation arrows (shown even with 1 page for visual consistency with reference) */}
        <button
          onClick={handlePrev}
          aria-label="Previous features"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-200 shadow-sm -ml-1 md:-ml-5"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
        <button
          onClick={handleNext}
          aria-label="Next features"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-200 shadow-sm -mr-1 md:-mr-5"
        >
          <CaretRight size={18} weight="bold" />
        </button>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-xl overflow-hidden"
          >
            {currentFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className={`group relative p-7 md:p-8 flex flex-col gap-4 bg-background hover:bg-muted/40 transition-colors duration-300
                  ${
                    /* Right border for all except last in row */
                    (index + 1) % 4 !== 0
                      ? "lg:border-r lg:border-border"
                      : ""
                  }
                  ${
                    /* Bottom border for first row */
                    index < 4
                      ? "border-b border-border"
                      : ""
                  }
                  ${
                    /* Right border for 2-col layout */
                    (index + 1) % 2 !== 0
                      ? "sm:border-r sm:border-border"
                      : ""
                  }
                `}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg border border-border/60 flex items-center justify-center text-foreground/70 group-hover:text-foreground group-hover:border-foreground/30 transition-all duration-300">
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-foreground leading-snug">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Features;
