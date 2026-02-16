import { motion } from "framer-motion";
import scoutImg from "../assets/scout.jpeg";
import closerImg from "../assets/closer.jpeg";
import producerImg from "../assets/producer.jpeg";
import accountantImg from "../assets/accountant.jpeg";

const employees = [
  {
    // name: "Scout",
    // role: "Influencer Discovery",
    image: scoutImg,
    color: "text-white",
  },
  {
    // name: "Closer",
    // role: "Outreach & Deals",
    image: closerImg,
    color: "text-white",
  },
  {
    // name: "Producer",
    // role: "Campaign Control",
    image: producerImg,
    color: "text-white",
  },
  {
    // name: "Accountant",
    // role: "Payments & ROI",
    image: accountantImg,
    color: "text-white",
  }
];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background pt-24 pb-20">

      {/* Background Gradient Effects */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Left Blue Glow */}
        <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[140px]" />
        {/* Right Red/Orange Glow */}
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[140px]" />

        {/* Deep Overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background z-0" />
      </div>

      <div className="container relative mx-auto px-4 z-10 flex flex-col items-center text-center mt-20">

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto mb-12"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
            Meet Your AI Employees<br />
            for Influencer Marketing
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light mt-10">
            From discovery to payouts, CampnAI runs your entire influencer workflow autonomously.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 w-full max-w-6xl mx-auto">
          {employees.map((employee, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center group cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-6 border border-border shadow-2xl transition-transform duration-300 group-hover:-translate-y-2">
                <img
                  src={employee.image}
                  // alt={employee.name}
                  className="w-full h-full object-cover"
                />

                {/* Subtle Inner Border/Glow */}
                <div className="absolute inset-0 ring-1 ring-border/10 rounded-2xl" />
              </div>

              {/* Text Below Image */}
              {/* <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {employee.name}
                </h3>
                <p className="text-sm text-gray-400 font-medium">
                  {employee.role}
                </p>
              </div> */}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Hero;
