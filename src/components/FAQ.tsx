import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
    return (
        <div className={`border-b border-white/10 overflow-hidden transition-all duration-300 ${isOpen ? "bg-white/5" : "bg-transparent"}`}>
            <button
                onClick={onClick}
                className="w-full py-6 md:py-8 px-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
                <h3 className={`text-lg md:text-xl font-medium tracking-tight pr-8 transition-colors ${isOpen ? "text-white" : "text-slate-200"}`}>
                    {question}
                </h3>
                <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isOpen ? "border-purple-500 bg-purple-500/20 text-purple-400" : "border-white/20 text-slate-400"}`}>
                        {isOpen ? (
                            <Minus className="w-4 h-4" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                    </div>
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-6 pb-8 pt-2 text-base md:text-lg text-slate-400 leading-relaxed max-w-3xl">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: "What is Campnai?",
            answer: "Campnai is an AI-powered influencer marketing platform designed for Indian SMBs and agencies. It uses advanced agentic AI (like Neo) to automate the entire workflow—from creator discovery and outreach to negotiation and campaign tracking.",
        },
        {
            question: "How does Neo find the right influencers?",
            answer: "Our agent, Neo, uses Large Language Models (LLMs) to analyze content, engagement quality, and audience demographics in real-time. It doesn't just look at keywords; it understands the 'vibe' and brand safety of every creator it evaluates.",
        },
        {
            question: "Is Campnai localized for the Indian market?",
            answer: "Yes, we focus heavily on the Indian creator ecosystem, supporting regional language detection, city-level filtering, and local payment/commercial benchmarks.",
        },
        {
            question: "How much time can I save using Campnai?",
            answer: "Most of our customers report a 90% reduction in campaign management time. What used to take months (discovery and outreach) now happens in a few hours of agentic execution.",
        },
        {
            question: "Is my campaign data secure?",
            answer: "Absolutely. We use enterprise-grade security for all campaign data and influencer communications. Your strategic insights and internal notes are always private.",
        },
        {
            question: "Can I cancel my subscription any time?",
            answer: "Yes, you can cancel your subscription at any time without any penalties. We want to ensure you only pay when you see real value.",
        },
    ];

    return (
        <section id="faq" className="py-32 relative overflow-hidden bg-[#030014]">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />

            </div>

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block mb-4 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium"
                    >
                        Questions & Answers
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-white mb-6"
                    >
                        Frequently Asked Questions
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-400 max-w-xl mx-auto"
                    >
                        Everything you need to know about starting your first campaign with Neo.
                    </motion.p>
                </div>

                {/* FAQ List */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="border-t border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                >
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FAQ;
