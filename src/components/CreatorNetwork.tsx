import { motion } from "framer-motion";
import { ClipboardList, User, Mail, BarChart2, CheckCircle2 } from "lucide-react";

const CreatorNetwork = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            One agent. One system.<br />
            <span className="text-muted-foreground">One campaign flow.</span>
          </h2>
        </motion.div>

        <div className="relative max-w-6xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[60px] left-0 w-full h-[2px] bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-30"></div>
          <div className="hidden md:block absolute top-[60px] left-0 w-full h-[2px] bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-sm"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="relative mb-8">
                <div className="w-32 h-24 rounded-xl bg-card border border-border/50 flex items-center justify-center p-4 backdrop-blur-sm shadow-lg group-hover:shadow-xl transition-all">
                  <ClipboardList className="w-10 h-10 text-primary" />
                  <div className="absolute -bottom-3 -right-3 bg-primary rounded-full p-1 border-4 border-background">
                    <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                  <span className="text-primary font-bold text-sm">1</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-foreground mb-3">Understands<br />your brief</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Brand tone, goals,<br />audience — context first.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="relative mb-8">
                <div className="w-32 h-24 rounded-xl bg-card border border-border/50 flex items-center justify-center p-4 backdrop-blur-sm shadow-lg group-hover:shadow-xl transition-all">
                  <User className="w-10 h-10 text-primary" />
                  <div className="absolute top-2 right-2 text-primary">
                    ★
                  </div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                  <span className="text-primary font-bold text-sm">2</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-foreground mb-3">Finds the right<br />creators</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Based on vibe, content<br />style, and fit — not just<br />numbers.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="relative mb-8">
                <div className="w-32 h-24 rounded-xl bg-card border border-border/50 flex items-center justify-center p-4 backdrop-blur-sm shadow-lg group-hover:shadow-xl transition-all">
                  <Mail className="w-10 h-10 text-primary" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold border-4 border-background">
                    3
                  </div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                  <span className="text-primary font-bold text-sm">3</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-foreground mb-3">Runs outreach<br />& follow-ups</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Negotiation, reminders,<br />coordination — automated.
                </p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center text-center relative group"
            >
              <div className="relative mb-8">
                <div className="w-32 h-24 rounded-xl bg-card border border-border/50 flex items-center justify-center p-4 backdrop-blur-sm shadow-lg group-hover:shadow-xl transition-all">
                  <BarChart2 className="w-10 h-10 text-primary" />
                  <div className="absolute bottom-2 right-2 rounded-full border border-primary/50 p-0.5">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                  <span className="text-primary font-bold text-sm">4</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-foreground mb-3">Manages the<br />campaign</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Live tracking, insights,<br />and outcomes in one place.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CreatorNetwork;
