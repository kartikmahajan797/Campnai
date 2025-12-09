import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "99",
      period: "/month",
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
      period: "/month",
      description: "For growing teams scaling their campaigns.",
      features: [
        "500 creator matches/month",
        "Advanced AI negotiations",
        "Priority support",
        "Real-time analytics",
        "5 team members",
        "Custom workflows",
        "API access",
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
        "SLA guarantee",
      ],
      cta: "Contact sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="badge-primary mb-6">
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free for 14 days. No credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl border p-8 ${
                plan.popular 
                  ? "border-primary shadow-xl scale-105" 
                  : "border-border shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  {plan.price === "Custom" ? (
                    <span className="text-4xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-muted-foreground">$</span>
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                className="w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
