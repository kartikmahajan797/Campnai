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
        <div className={`border-b border-border overflow-hidden transition-all duration-300 ${isOpen ? "bg-muted/50" : "bg-transparent"}`}>
            <button
                onClick={onClick}
                className="w-full py-6 md:py-8 px-6 flex items-center justify-center md:justify-between text-left hover:bg-muted/30 transition-colors"
                // Note: justify-center on mobile might need to remain justify-between if that was intended, 
                // but original code had justify-between. Keeping justify-between.
            >
                <div className="flex-1 pr-4">
                    <h3 className={`text-lg md:text-xl font-medium tracking-tight transition-colors ${isOpen ? "text-foreground" : "text-muted-foreground"}`}>
                        {question}
                    </h3>
                </div>
                <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isOpen ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
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
                        <div className="px-6 pb-8 pt-2 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
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
        <section id="faq" className="py-32 relative overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />

            </div>

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium"
                    >
                        Questions & Answers
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-foreground mb-6"
                    >
                        Frequently Asked Questions
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground max-w-xl mx-auto"
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
                    className="border-t border-border rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border shadow-xl"
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
