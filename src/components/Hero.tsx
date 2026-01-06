import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, PlayCircle } from "lucide-react";

const Hero = () => {
  const [userType, setUserType] = useState<"brand" | "agency">("brand");

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#030014] pt-20">
      {/* Space Background Effects */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[0%] left-[20%] w-[60%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />

        {/* Stars/Dust effect (simple CSS representation) */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="container relative mx-auto px-6 z-10 flex flex-col items-center justify-center text-center">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4 text-white">
            Meet Neo.
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 pb-2">
            Your Autonomous<br />
            Influencer Marketing Agent
          </h2>

          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
            Neo finds creators, runs outreach, and manages campaigns end-to-end —<br className="hidden md:block" />
            so you don't have to.
          </p>

          <div className="flex flex-col items-center gap-6 mb-16">
            <Link to="/signup">
              <Button
                size="lg"
                className="h-14 px-10 rounded-full text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] border-none transition-all hover:scale-105"
              >
                Start My First Campaign <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
              See how Neo works (1 min)
            </button>
          </div>

          {/* User Type Selection */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-slate-400 text-sm">I am:</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${userType === 'brand' ? 'border-blue-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                  {userType === 'brand' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>
                <input
                  type="radio"
                  name="userType"
                  className="hidden"
                  checked={userType === 'brand'}
                  onChange={() => setUserType('brand')}
                />
                <span className={`text-base ${userType === 'brand' ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  A Brand / Marketer
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${userType === 'agency' ? 'border-blue-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                  {userType === 'agency' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>
                <input
                  type="radio"
                  name="userType"
                  className="hidden"
                  checked={userType === 'agency'}
                  onChange={() => setUserType('agency')}
                />
                <span className={`text-base ${userType === 'agency' ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  An Agency
                </span>
              </label>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
