import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const TrustedBy = () => {
  const brands = [
    { name: "TechFlow", logo: "TF" },
    { name: "DataSync", logo: "DS" },
    { name: "CloudAI", logo: "CA" },
    { name: "NeuralHub", logo: "NH" },
    { name: "Quantum", logo: "QT" },
    { name: "MetaGPT", logo: "MG" },
  ];

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#ff6154]/5 border border-[#ff6154]/10 shadow-sm">
            <Trophy className="w-5 h-5 text-[#ff6154]" />
            <span className="text-sm font-bold text-[#ff6154] tracking-tight">
              #1 PRODUCT OF THE DAY
            </span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground/60 mb-12"
        >
          Trusted by the world's leading agentic organizations
        </motion.p>

        {/* Brand Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-16"
        >
          {brands.map((brand) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
              className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl glass-card border-white/40 flex items-center justify-center font-black text-primary text-sm shadow-sm group-hover:border-primary/20">
                {brand.logo}
              </div>
              <span className="font-bold text-xl text-foreground/70 hidden sm:block">{brand.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBy;
