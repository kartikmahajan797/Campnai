import { Link } from "react-router-dom";

const Footer = () => {
  const footerLinks = {
    Product: ["Features", "Pricing", "Integrations", "API", "Changelog"],
    Company: ["About", "Blog", "Careers", "Press", "Contact"],
    Resources: ["Documentation", "Help Center", "Community", "Case Studies"],
    Legal: ["Privacy", "Terms", "Security", "Cookies"],
  };

  return (
    <footer className="footer-premium py-24 bg-background border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          {/* Brand */}
          <div className="md:col-span-4 max-w-sm">
            <Link to="/" className="flex items-center gap-2 mb-8 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-xl">C</span>
              </div>
              <span className="font-extrabold text-2xl tracking-tighter">Campnai</span>
            </Link>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              The world's first agentic influencer marketing platform. We automate the entire cycle so you can focus on building your brand.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders could go here */}
            </div>
          </div>

          {/* Links Grid */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-bold text-foreground mb-6 uppercase tracking-widest text-xs">{category}</h4>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-primary transition-all text-base font-medium"
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
        <div className="pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8">
            <p className="text-muted-foreground text-sm font-medium">
              © 2024 Campnai AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Status", "Privacy", "Terms"].map((l) => (
                <a key={l} href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 glass-card px-4 py-2 border-white/40">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
