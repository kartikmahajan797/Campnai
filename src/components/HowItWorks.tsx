import { motion } from "framer-motion";
import { Rocket, Brain, Clock, BarChart3, Star } from "lucide-react";

const HowItWorks = () => {
  const benefits = [
    { icon: Rocket, text: "Launch campaigns faster", color: "text-blue-400", shadow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]" },
    { icon: Brain, text: "No context loss between steps", color: "text-purple-400", shadow: "shadow-[0_0_15px_rgba(168,85,247,0.5)]" },
    { icon: Clock, text: "10x less manual effort", color: "text-pink-400", shadow: "shadow-[0_0_15px_rgba(236,72,153,0.5)]" },
    { icon: BarChart3, text: "Clear ROI, not guesswork", color: "text-indigo-400", shadow: "shadow-[0_0_15px_rgba(99,102,241,0.5)]" },
  ];

  return (
    <section className="py-32 bg-[#030014] relative overflow-hidden flex items-center justify-center">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] right-[30%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-3xl md:text-5xl lg:text-5xl font-bold text-white mb-2 leading-tight">
            What you get when<br />
            Neo runs your campaigns
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center max-w-6xl mx-auto">

          {/* Left Column: Benefits */}
          <div className="space-y-12">
            {benefits.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-6 group cursor-default"
              >
                <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors ${item.shadow}`}>
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                </div>
                <span className="text-xl md:text-2xl text-slate-200 font-medium group-hover:text-white transition-colors">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Glowing Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl blur opacity-30 animate-pulse"></div>

            <div className="relative p-10 rounded-2xl bg-gradient-to-br from-[#1a103c]/90 to-[#030014]/90 border border-purple-500/50 shadow-[0_0_50px_rgba(236,72,153,0.15)] flex flex-col justify-center h-full backdrop-blur-xl">
              <div className="mb-6">
                <p className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  "What took weeks<br />
                  now takes days."
                </p>
              </div>
              <div>
                <p className="text-lg text-slate-400 leading-relaxed">
                  Neo doesn't assist your workflow.<br />
                  It replaces it.
                </p>
              </div>

              {/* Decorative reflection */}
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none"></div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
