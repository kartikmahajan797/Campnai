import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";
import campnaiLogo from "@/assets/campnaiLogo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Creators", href: "#creators" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-4" : "py-6"
        }`}
    >
      <div className="container mx-auto px-6">
        <div
          className={`mx-auto max-w-7xl px-6 h-16 rounded-2xl flex items-center justify-between transition-all duration-300 ${scrolled
            ? "glass-card border-white/10 shadow-2xl shadow-primary/10"
            : "bg-transparent border-transparent"
            }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative group/logo">
              <img src={campnaiLogo} alt="Campnai Logo" className="w-20 h-21 object-contain group-hover/logo:scale-110 transition-transform duration-500 ease-out" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover/logo:scale-150 transition-transform duration-700 opacity-0 group-hover/logo:opacity-100" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white">
              Campnai
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-bold transition-all hover:text-white ${scrolled ? "text-white" : "text-white/90"
                  }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <ModeToggle />
            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className={`font-bold transition-colors ${scrolled ? "text-white hover:text-white/80" : "text-white/90 hover:text-white"}`}
              >
                Sign in
              </Button>
            </Link>
            <Button
              className="rounded-full px-6 font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all transform hover:scale-105"
              size="sm"
            >
              Start Building
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <button
              className={`p-2 transition-colors ${scrolled ? "text-white" : "text-white"}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-24 left-6 right-6 p-6 rounded-[2rem] glass-card border-white/10 shadow-2xl z-50"
            >
              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-white/90 hover:text-white transition-colors text-lg font-bold"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="flex flex-col gap-4 pt-6 border-t border-border">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full text-white/90 hover:text-white font-bold">Sign in</Button>
                  </Link>
                  <Button className="w-full rounded-2xl font-bold" onClick={() => setIsOpen(false)}>Start Building</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
