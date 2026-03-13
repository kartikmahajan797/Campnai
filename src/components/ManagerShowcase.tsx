import { motion } from "framer-motion";
import managerImg from "../assets/manger pic.jpeg";
import { Button } from "@/components/ui/button";

const ManagerShowcase = () => {
    return (
        <section className="relative py-32 overflow-hidden bg-gradient-to-br from-[#f0f4ff] via-white to-[#ffeef6] dark:from-[#111118] dark:via-background dark:to-[#1a1118]">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-100/30 dark:bg-primary/5 rounded-full blur-[120px] -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-pink-100/40 dark:bg-secondary/10 rounded-full blur-[120px] -ml-20 -mb-20" />

            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-28">

                    {/* Image Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 relative w-full"
                    >
                        <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/5">
                            <img
                                src={managerImg}
                                alt="AI Campaign Manager"
                                className="w-full h-auto object-cover transform transition-transform duration-700 hover:scale-105"
                            />
                        </div>

                        {/* Decorative frames */}
                        <div className="absolute -top-6 -left-6 lg:-top-8 lg:-left-8 w-[80%] h-[80%] border-t border-l border-gray-400/50 dark:border-gray-500/30 rounded-tl-[3rem] -z-10" />
                        <div className="absolute -bottom-6 -right-6 lg:-bottom-8 lg:-right-8 w-[50%] h-[50%] border-b border-r border-gray-400/50 dark:border-gray-500/30 rounded-br-[3rem] -z-10" />
                    </motion.div>

                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="flex-1 text-left"
                    >
                        <h3 className="text-gray-800 dark:text-gray-300 font-bold tracking-[0.2em] uppercase text-xs mb-5">
                            The Orchestrator
                        </h3>
                        <h2 className="text-[2.8rem] md:text-5xl lg:text-[4rem] font-[500] text-gray-900 dark:text-gray-100 leading-[1.1] tracking-tight mb-8">
                            Meet Your <span className="inline-block border-b-[3px] border-gray-400/60 dark:border-gray-600 pb-1">AI</span> <span className="inline-block border-b-[3px] border-gray-400/60 dark:border-gray-600 pb-1">Campaign</span> <span className="inline-block border-b-[3px] border-gray-400/60 dark:border-gray-600 pb-1">Manager</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-[540px]">
                            CampnAI doesn't just hire employees; it provides an intelligent manager to coordinate everything. Analyze results, optimize budgets, and scale your influence — all without lifting a finger.
                        </p>

                        <div className="space-y-6 mb-14">
                            {[
                                { title: "Autonomous Strategy Optimization", desc: "AI continuously refines targeting and budget allocation" },
                                { title: "Real-time ROI Tracking & Reporting", desc: "Every rupee tracked across all campaigns" },
                                { title: "Automated Communications & Scheduling", desc: "Follow-ups, reminders, and briefs on autopilot" }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    className="flex items-start gap-4 text-gray-700 dark:text-gray-300"
                                >
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-gray-900 dark:bg-gray-100" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-base text-gray-900 dark:text-gray-100">{feature.title}</span>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <Button
                            className="rounded-full px-10 py-7 h-auto text-lg font-semibold bg-[#111] hover:bg-[#333] dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white shadow-lg transition-all hover:scale-105"
                        >
                            Get Started with the AI Manager
                        </Button>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default ManagerShowcase;
