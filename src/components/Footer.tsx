import { Link } from "react-router-dom";
import campnaiLogo from "@/assets/campnailogo.png";


const Footer = () => {
  const footerLinks = {
    Product: ["Features", "Pricing", "Integrations", "API", "Changelog"],
    Company: ["About", "Blog", "Careers", "Press", "Contact"],
    Resources: ["Documentation", "Help Center", "Community", "Case Studies"],
    Legal: ["Privacy", "Terms", "Security", "Cookies"],
  };

  return (
    <footer className="py-20 bg-[#030014] border-t border-white/10 relative overflow-hidden">
      {/* Background Effects */}

      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-4 max-w-sm">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              {/* <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-xl">C</span>
              </div> */}
              <div className="relative group/logo">
                <img src={campnaiLogo} alt="Campnai Logo" className="w-20 h-20 object-contain group-hover/logo:scale-110 transition-transform duration-500 ease-out" />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover/logo:scale-150 transition-transform duration-700 opacity-0 group-hover/logo:opacity-100" />
              </div>
              <span className="font-extrabold text-2xl tracking-tighter text-white">Campnai</span>
            </Link>
            <p className="text-slate-400 text-base leading-relaxed mb-8">
              The world's first agentic influencer marketing platform. We automate the entire cycle so you can focus on building your brand.
            </p>
          </div>

          {/* Links Grid */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs opacity-70">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8">
            <p className="text-slate-500 text-sm font-medium">
              © 2024 Campnai AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Status", "Privacy", "Terms"].map((l) => (
                <a key={l} href="#" className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">All Systems Operational</span>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
