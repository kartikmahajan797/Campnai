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
        <div className="border-b border-border/50 overflow-hidden">
            <button
                onClick={onClick}
                className="w-full py-8 flex items-center justify-between text-left hover:opacity-70 transition-opacity"
            >
                <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                    {question}
                </h3>
                <div className="flex-shrink-0 ml-4">
                    {isOpen ? (
                        <Minus className="w-6 h-6 text-primary" />
                    ) : (
                        <Plus className="w-6 h-6 text-muted-foreground" />
                    )}
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
                        <div className="pb-8 text-lg text-muted-foreground leading-relaxed">
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
            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-6xl font-extrabold tracking-tight"
                    >
                        FAQ
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground mt-4"
                    >
                        Everything you need to know about Campnai.
                    </motion.p>
                </div>

                {/* FAQ List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="border-t border-border/50"
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
