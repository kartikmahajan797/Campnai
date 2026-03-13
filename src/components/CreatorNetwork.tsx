import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ClipboardList, User, Mail, BarChart2, CheckCircle2 } from "lucide-react";

const steps = [
  {
    title: "Understands\nyour brief",
    desc: "Brand tone, goals,\naudience — context first.",
    icon: <ClipboardList className="w-12 h-12 text-[#141b34] dark:text-gray-100" />,
    badge: (
      <div className="absolute -bottom-2 -right-2 bg-[#141b34] dark:bg-gray-100 rounded-full p-0.5 border-2 border-[#e6ebf8] dark:border-[#111118]">
        <CheckCircle2 className="w-4 h-4 text-white dark:text-black" />
      </div>
    ),
  },
  {
    title: "Finds the right\ncreators",
    desc: "Find creators that fit.\nNot just numbers.",
    icon: <User className="w-12 h-12 text-[#141b34] dark:text-gray-100" />,
    badge: (
      <div className="absolute top-2 right-2 text-[#141b34] dark:text-gray-100 text-sm font-bold font-serif">
        ★
      </div>
    ),
  },
  {
    title: "Runs outreach\n& follow-ups",
    desc: "Negotiation, reminders,\ncoordination — automated.",
    icon: <Mail className="w-12 h-12 text-[#141b34] dark:text-gray-100" />,
    badge: (
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#141b34] dark:bg-gray-100 rounded-full flex items-center justify-center text-white dark:text-black text-[11px] font-bold border-2 border-[#e6ebf8] dark:border-[#111118]">
        3
      </div>
    ),
  },
  {
    title: "Manages the\ncampaign",
    desc: "Live tracking, insights,\nand outcomes in one place.",
    icon: <BarChart2 className="w-12 h-12 text-[#141b34] dark:text-gray-100" />,
    badge: (
      <div className="absolute bottom-2 right-2 rounded-full border border-gray-300 dark:border-gray-600 p-0.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#141b34] dark:text-gray-500" />
      </div>
    ),
  },
];

const CreatorNetwork = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 30 });

  const opacity2 = useTransform(smoothProgress, [0.15, 0.35], [0, 1]);
  const y2 = useTransform(smoothProgress, [0.15, 0.35], [30, 0]);

  const opacity3 = useTransform(smoothProgress, [0.4, 0.6], [0, 1]);
  const y3 = useTransform(smoothProgress, [0.4, 0.6], [30, 0]);

  const opacity4 = useTransform(smoothProgress, [0.65, 0.85], [0, 1]);
  const y4 = useTransform(smoothProgress, [0.65, 0.85], [30, 0]);

  const opacities = [1, opacity2, opacity3, opacity4];
  const ys = [0, y2, y3, y4];

  // Map progress to drawing the connecting line
  const lineWidth = useTransform(smoothProgress, [0, 0.85], ["0%", "100%"]);

  return (
    <>
      {/* Desktop Animated Sticky Section */}
      <section 
        ref={targetRef} 
        className="hidden md:block relative bg-gradient-to-br from-[#f0f4ff] via-white to-[#ffeef6] dark:from-[#111118] dark:via-background dark:to-[#1a1118] h-[250vh]"
      >
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          
          <div className="text-center mb-20 -mt-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-5">How It Works</p>
            <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-[500] text-gray-900 dark:text-gray-100 mb-5 tracking-tight leading-tight">
              One agent. One system.<br />
              <span className="text-gray-500 dark:text-gray-400 font-medium">One campaign flow.</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Neo handles every step of influencer marketing — end to end, autonomously.
            </p>
          </div>

          <div className="relative w-full max-w-6xl mx-auto px-6">
            {/* Connecting Line Base */}
            <div className="absolute top-[50px] -left-12 -right-12 lg:-left-24 lg:-right-24 h-[1.5px] bg-[#141b34]/10 dark:bg-gray-800 -z-10" />
            
            {/* Animated Connecting Line */}
            <div className="absolute top-[50px] -left-12 -right-12 lg:-left-24 lg:-right-24 h-[1.5px] overflow-hidden -z-10 flex justify-start">
               <motion.div 
                 style={{ width: lineWidth }} 
                 className="h-full bg-[#141b34] dark:bg-gray-100" 
               />
            </div>

            <div className="grid grid-cols-4 gap-8 lg:gap-12 relative">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  style={{ opacity: opacities[i], y: ys[i] }}
                  className="flex flex-col items-center text-center relative group"
                >
                  <div className="relative mb-8">
                    <div className="w-[110px] h-[110px] rounded-2xl bg-[#e6ebf8] dark:bg-[#111118]/60 border border-white/40 dark:border-white/10 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:-translate-y-1 z-10">
                      {step.icon}
                      {step.badge}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                     <div className="w-8 h-8 rounded-full bg-[#e6ebf8] dark:bg-gray-900 border border-[#c4ceed] dark:border-gray-600 flex items-center justify-center mx-auto shadow-sm">
                      <span className="text-[#141b34] dark:text-gray-100 font-semibold text-[13px]">{i + 1}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[1.35rem] font-bold text-[#141b34] dark:text-gray-100 mb-3 leading-snug whitespace-pre-line tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-[#6b728e] dark:text-gray-400 text-[15px] leading-[1.7] max-w-[230px] mx-auto font-medium whitespace-pre-line break-words">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Normal Layout */}
      <section className="md:hidden py-28 bg-gradient-to-br from-[#f0f4ff] via-white to-[#ffeef6] dark:from-[#111118] dark:via-background dark:to-[#1a1118]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">How It Works</p>
            <h2 className="text-3xl font-[500] text-gray-900 dark:text-gray-100 mb-3 tracking-tight leading-tight">
              One agent. One system.<br />
              <span className="text-gray-500 dark:text-gray-400 font-medium">One campaign flow.</span>
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Neo handles every step — end to end, autonomously.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-12 relative border-l-[1.5px] border-[#141b34]/10 dark:border-gray-800 ml-6 pl-8">
             {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex flex-col items-start text-left relative"
                >
                  <div className="absolute top-6 -left-[45px] w-7 h-7 rounded-full bg-[#e6ebf8] dark:bg-gray-900 border border-[#c4ceed] dark:border-gray-900 flex items-center justify-center z-10 shadow-sm">
                    <span className="text-[#141b34] dark:text-gray-100 font-semibold text-[12px]">{i + 1}</span>
                  </div>

                  <div className="relative mb-4">
                    <div className="w-[90px] h-[90px] rounded-2xl bg-[#e6ebf8] dark:bg-[#111118]/60 border border-white/40 dark:border-white/10 flex items-center justify-center shadow-sm">
                      {step.icon}
                      {step.badge}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#141b34] dark:text-gray-100 mb-2 leading-snug whitespace-pre-line tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-[#6b728e] dark:text-gray-400 text-base leading-[1.6] max-w-[220px] font-medium whitespace-pre-line">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default CreatorNetwork;
