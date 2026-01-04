import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "99",
      period: "/mo",
      description: "For small teams starting with influencer marketing.",
      features: [
        "50 creator matches/month",
        "Basic AI outreach",
        "Email support",
        "Campaign analytics",
        "1 team member",
      ],
      cta: "Start free trial",
      popular: false,
    },
    {
      name: "Growth",
      price: "299",
      period: "/mo",
      description: "For growing teams scaling their campaigns.",
      features: [
        "500 creator matches/month",
        "Advanced AI negotiations",
        "Priority support",
        "Real-time analytics",
        "5 team members",
        "Custom workflows",
      ],
      cta: "Start free trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with complex needs.",
      features: [
        "Unlimited matches",
        "Dedicated manager",
        "24/7 phone support",
        "Custom integrations",
        "Unlimited team members",
        "White-label options",
      ],
      cta: "Contact sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-32 relative overflow-hidden bg-background">
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-premium mb-6"
          >
            Pricing Plans
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 tracking-tight"
          >
            Simple, <span className="gradient-text">transparent</span> pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground"
          >
            Choose the plan that fits your stage of growth. No hidden fees.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              key={plan.name}
              className={`relative glass-card flex flex-col p-10 h-full ${plan.popular
                ? "border-primary/50 ring-2 ring-primary/20 scale-105 z-10"
                : "border-white/40"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    Best Value
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  {plan.price === "Custom" ? (
                    <span className="text-5xl font-extrabold tracking-tight">Custom</span>
                  ) : (
                    <>
                      <span className="text-3xl font-medium text-muted-foreground">$</span>
                      <span className="text-6xl font-extrabold tracking-tight">{plan.price}</span>
                      <span className="text-xl font-medium text-muted-foreground">{plan.period}</span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-lg font-medium text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                className={`w-full h-14 rounded-xl font-bold text-lg ${plan.popular ? "shadow-xl shadow-primary/30" : "bg-white/50"
                  }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
