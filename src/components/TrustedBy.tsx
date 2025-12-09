import { Trophy } from "lucide-react";

const TrustedBy = () => {
  const brands = [
    { name: "TechFlow", logo: "TF" },
    { name: "DataSync", logo: "DS" },
    { name: "CloudAI", logo: "CA" },
    { name: "NeuralHub", logo: "NH" },
    { name: "Quantum", logo: "QT" },
    { name: "MetaGPT", logo: "MG" },
  ];

  return (
    <section className="py-16 border-y border-border bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Product Hunt Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-[#ff6154]/10 border border-[#ff6154]/20">
            <Trophy className="w-5 h-5 text-[#ff6154]" />
            <span className="text-sm font-semibold text-[#ff6154]">
              #1 Product of the Day
            </span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-[#ff6154]">★</span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by the world's leading AI-native organizations
        </p>

        {/* Brand Logos */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-sm">
                {brand.logo}
              </div>
              <span className="font-semibold text-lg hidden sm:block">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
