import { motion } from "framer-motion";
import managerImg from "../assets/manger pic.jpeg";
import { Button } from "@/components/ui/button";

const ManagerShowcase = () => {
    return (
        <section className="relative py-24 bg-[#0a0514] overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -ml-20 -mb-20" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Image Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 relative"
                    >
                        <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/20 group">
                            <img
                                src={managerImg}
                                alt="AI Campaign Manager"
                                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0514]/80 via-transparent to-transparent opacity-60" />
                        </div>

                        {/* Decorative frames */}
                        <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-blue-500/30 rounded-tl-3xl -z-10" />
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-purple-500/30 rounded-br-3xl -z-10" />
                    </motion.div>

                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="flex-1 text-left"
                    >
                        <h3 className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4">
                            The Orchestrator
                        </h3>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-8">
                            Meet Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI Campaign Manager</span>
                        </h2>
                        <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
                            CampnAI doesn't just hire employees; it provides an intelligent manager to coordinate everything. Analyze results, optimize budgets, and scale your influence without lifting a finger.
                        </p>

                        <div className="space-y-6 mb-10">
                            {[
                                "Autonomous Strategy Optimization",
                                "Real-time ROI Tracking & Reporting",
                                "Automated Communications & Scheduling"
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    className="flex items-center gap-4 text-white/80"
                                >
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                    </div>
                                    <span className="font-medium">{feature}</span>
                                </motion.div>
                            ))}
                        </div>

                        <Button
                            className="rounded-full px-8 py-6 h-auto text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all transform hover:scale-105"
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
