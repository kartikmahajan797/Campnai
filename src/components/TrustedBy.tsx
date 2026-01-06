import { motion } from "framer-motion";
import { Search, Mail, BarChart3, TrendingUp } from "lucide-react";

const TrustedBy = () => {
  return (
    <section className="py-24 bg-[#030014] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Influencer marketing isn't hard.<br />
            <span className="text-slate-400">Managing it is.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1: Discovery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col items-center text-center backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative mb-6 p-4 rounded-full bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Search className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="relative text-xl font-bold text-white mb-3">Discovery<br />is noisy</h3>
            <p className="relative text-slate-400">
              Lists, filters, vanity metrics — no context.
            </p>
          </motion.div>

          {/* Card 2: Outreach */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col items-center text-center backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative mb-6 p-4 rounded-full bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Mail className="w-8 h-8 text-purple-400" />
              <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#1a1a2e]">5</div>
            </div>
            <h3 className="relative text-xl font-bold text-white mb-3">Outreach<br />is chaotic</h3>
            <p className="relative text-slate-400">
              Emails, DMs, follow-ups, spreadsheets.
            </p>
          </motion.div>

          {/* Card 3: Execution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] flex flex-col items-center text-center backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative mb-6 p-4 rounded-full bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <TrendingUp className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="relative text-xl font-bold text-white mb-3">Execution<br />leaks intelligence</h3>
            <p className="relative text-slate-400">
              Insights die between tools and people.
            </p>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-500 mt-16 text-lg"
        >
          Most teams don't fail at ideas. They fail at execution.
        </motion.p>

      </div>
    </section>
  );
};

export default TrustedBy;
