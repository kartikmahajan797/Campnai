import { motion } from "framer-motion";
import { ClipboardList, User, Mail, BarChart2, CheckCircle2 } from "lucide-react";

const CreatorNetwork = () => {
  return (
    <section className="py-24 bg-[#030014] relative overflow-hidden">
      {/* Background Decorative Elements */}
      {/* Repeating the space theme but with different positioning/colors to flow from previous section */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[300px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            One agent. One system.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">One campaign flow.</span>
          </h2>
        </motion.div>

        <div className="relative max-w-6xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[60px] left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30"></div>
          <div className="hidden md:block absolute top-[60px] left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-sm"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="relative mb-8">
                <div className="w-32 h-24 rounded-xl bg-gradient-to-b from-blue-900/40 to-slate-900/40 border border-blue-500/30 flex items-center justify-center p-4 backdrop-blur-sm shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all">
                  <ClipboardList className="w-10 h-10 text-blue-400" />
                  <div className="absolute -bottom-3 -right-3 bg-blue-500 rounded-full p-1 border-4 border-[#030014]">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#030014] border-2 border-blue-500 flex items-center justify-center z-10">
                  <span className="text-blue-400 font-bold text-sm">1</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-3">Understands<br />your brief</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Brand tone, goals,<br />audience — context first.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="relative mb-8">
                <div className="w-32 h-24 rounded-xl bg-gradient-to-b from-purple-900/40 to-slate-900/40 border border-purple-500/30 flex items-center justify-center p-4 backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all">
                  <User className="w-10 h-10 text-purple-400" />
                  <div className="absolute top-2 right-2 text-yellow-400">
                    ★
                  </div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#030014] border-2 border-purple-500 flex items-center justify-center z-10">
                  <span className="text-purple-400 font-bold text-sm">2</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-3">Finds the right<br />creators</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Based on vibe, content<br />style, and fit — not just<br />numbers.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="relative mb-8">
                <div className="w-32 h-24 rounded-xl bg-gradient-to-b from-pink-900/40 to-slate-900/40 border border-pink-500/30 flex items-center justify-center p-4 backdrop-blur-sm shadow-[0_0_20px_rgba(236,72,153,0.2)] group-hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all">
                  <Mail className="w-10 h-10 text-pink-400" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-4 border-[#030014]">
                    3
                  </div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#030014] border-2 border-pink-500 flex items-center justify-center z-10">
                  <span className="text-pink-400 font-bold text-sm">3</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-3">Runs outreach<br />& follow-ups</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Negotiation, reminders,<br />coordination — automated.
                </p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="relative mb-8">
                <div className="w-32 h-24 rounded-xl bg-gradient-to-b from-red-900/40 to-slate-900/40 border border-red-500/30 flex items-center justify-center p-4 backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.2)] group-hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all">
                  <BarChart2 className="w-10 h-10 text-red-400" />
                  <div className="absolute bottom-2 right-2 rounded-full border border-red-400/50 p-0.5">
                    <CheckCircle2 className="w-3 h-3 text-red-400" />
                  </div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#030014] border-2 border-red-500 flex items-center justify-center z-10">
                  <span className="text-red-400 font-bold text-sm">4</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-3">Manages the<br />campaign</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Live tracking, insights,<br />and outcomes in one place.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CreatorNetwork;
