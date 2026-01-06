import { motion } from "framer-motion";
import { Star } from "lucide-react";

const Features = () => {
  const testimonials = [
    {
      quote: "Reduced campaign setup time by 70%.",
      rating: 4,
      color: "blue",
      borderColor: "border-blue-500",
      glowColor: "shadow-[0_0_30px_rgba(59,130,246,0.3)]"
    },
    {
      quote: "Finally stopped juggling 6 tools for one campaign.",
      rating: 4,
      color: "purple",
      borderColor: "border-purple-500",
      glowColor: "shadow-[0_0_30px_rgba(168,85,247,0.3)]"
    },
    {
      quote: "Neo feels like a silent operator running things in the background.",
      rating: 4,
      color: "pink",
      borderColor: "border-pink-500",
      glowColor: "shadow-[0_0_30px_rgba(236,72,153,0.3)]"
    }
  ];

  return (
    <section className="py-32 bg-[#030014] relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-3xl md:text-5xl lg:text-5xl font-bold text-white mb-2 leading-tight">
            Built with real campaigns in mind
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-xl bg-white/5 border ${item.borderColor} ${item.glowColor} backdrop-blur-sm flex flex-col justify-between min-h-[250px] overflow-hidden group`}
            >
              <div className="relative z-10 flex-grow flex items-center justify-center text-center">
                <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                  "{item.quote}"
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-center mt-8 gap-2">
                {/* Blurred Avatar/Logo Placeholder */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-sm mb-2 opacity-70 group-hover:opacity-100 transition-opacity`}></div>

                <div className="flex gap-1">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-purple-400 fill-purple-400" />
                  ))}
                </div>
              </div>

              {/* Inner subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none" />
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-400 text-sm">
            Early access users • Agencies & SMB brands
          </p>
        </div>

      </div>
    </section>
  );
};

export default Features;
