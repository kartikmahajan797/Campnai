import { Button } from "@/components/ui/button";
import { ArrowRight } from "@phosphor-icons/react";

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#f0f4ff] via-white to-[#ffeef6] dark:from-[#111118] dark:via-background dark:to-[#1a1118]">
      <div className="container mx-auto px-6 relative z-10">
        <div className="relative max-w-5xl mx-auto rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-[#fdfdff] dark:bg-[#111118]/80 backdrop-blur-xl border border-gray-200/60 dark:border-white/5 shadow-2xl py-16 md:py-24 px-8 md:px-16 text-center">
          
          {/* Content */}
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-semibold text-gray-900 dark:text-gray-100 mb-6 tracking-tight leading-[1.15]">
              Ready to automate your{" "}
              <span className="inline-block border-b-[3px] border-gray-300 dark:border-gray-600 pb-1">
                influencer marketing?
              </span>
            </h2>
            <p className="text-lg md:text-[1.15rem] text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed font-medium">
              Join thousands of brands using Campnai to run smarter campaigns with less effort and better results.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="h-14 px-8 rounded-full bg-[#111] hover:bg-[#333] dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold text-base shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                Get started free 
                <ArrowRight weight="bold" className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                className="h-14 px-8 rounded-full border border-gray-300/80 dark:border-gray-700 bg-[#f8f9fa] dark:bg-transparent text-gray-900 dark:text-white hover:bg-[#e9ecef] dark:hover:bg-gray-800 font-semibold text-base shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              >
                Schedule a demo
              </Button>
            </div>

            <p className="text-gray-400 dark:text-gray-500 text-sm mt-10 font-medium">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
