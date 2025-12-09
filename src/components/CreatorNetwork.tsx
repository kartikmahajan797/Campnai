import { Button } from "@/components/ui/button";
import creator1 from "@/assets/creator-1.jpg";
import creator2 from "@/assets/creator-2.jpg";
import creator3 from "@/assets/creator-3.jpg";
import creator4 from "@/assets/creator-4.jpg";
import creator5 from "@/assets/creator-5.jpg";
import creator6 from "@/assets/creator-6.jpg";

const CreatorNetwork = () => {
  const creators = [
    { name: "@emma_lifestyle", followers: "1.2M+", image: creator1, platform: "Instagram" },
    { name: "@alex_tech", followers: "856K+", image: creator2, platform: "YouTube" },
    { name: "@fitness_sarah", followers: "2.1M+", image: creator3, platform: "TikTok" },
    { name: "@travel_mike", followers: "1.8M+", image: creator4, platform: "YouTube" },
    { name: "@beauty_sophia", followers: "3.2M+", image: creator5, platform: "Instagram" },
    { name: "@gamer_ryan", followers: "945K+", image: creator6, platform: "Twitch" },
  ];

  const stats = [
    { value: "5M+", label: "Verified Creators" },
    { value: "140+", label: "Countries" },
    { value: "6+", label: "Major Platforms" },
  ];

  return (
    <section id="creators" className="py-24 section-dark">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
            Creator Network
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Trusted Vetted Creators
          </h2>
          <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white/60 mb-6">
            Reach Across The Globe
          </p>
          <p className="text-lg text-white/60">
            Campnai connects your brand with verified influencers across every major platform and market, so you can launch campaigns instantly and scale them anywhere.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-12 md:gap-20 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Creator Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {creators.map((creator, index) => (
            <div
              key={creator.name}
              className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-square">
                <img
                  src={creator.image}
                  alt={creator.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="text-white font-semibold text-sm truncate">{creator.name}</div>
                <div className="text-white/60 text-xs">{creator.followers} Followers</div>
                <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-xs">
                  {creator.platform}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="light" size="lg">
            Sign up
          </Button>
          <Button variant="heroOutline" size="lg" className="border-white/20 text-white hover:bg-white/10">
            Book a demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CreatorNetwork;
