import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ManagerShowcase from "@/components/ManagerShowcase";
import TrustedBy from "@/components/TrustedBy";
import CreatorNetwork from "@/components/CreatorNetwork";
// import HowItWorks from "@/components/HowItWorks";
import ScrollCard from "@/components/ui/scroll-card";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <ManagerShowcase />
        <TrustedBy />
        <CreatorNetwork />
        {/* <HowItWorks /> */}
        <ScrollCard />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
