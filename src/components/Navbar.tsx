import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";
import campnaiLogo from "@/assets/campnailogo.png";

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
          className={`mx-auto rounded-full flex items-center justify-between transition-all duration-500 ease-in-out ${scrolled
            ? "max-w-2xl bg-background/80 backdrop-blur-md border border-border/50 shadow-lg shadow-primary/5 py-2 px-6 mt-4" // Tighter width (2xl), slightly more margin top
            : "max-w-7xl bg-transparent border-transparent py-0 px-6 mt-0"
            }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative group/logo">
              <img 
                src={campnaiLogo} 
                alt="Campnai Logo" 
                className={`object-contain transition-all duration-500 ease-out ${scrolled ? "w-10 h-10" : "w-20 h-21 group-hover/logo:scale-110"}`} 
              />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover/logo:scale-150 transition-transform duration-700 opacity-0 group-hover/logo:opacity-100" />
            </div>
            <span className={`font-black tracking-tighter text-foreground transition-all duration-500 ${scrolled ? "w-0 opacity-0 overflow-hidden text-[0px]" : "w-auto opacity-100 text-2xl"}`}>
              Campnai
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-bold transition-all hover:text-primary ${scrolled ? "text-foreground" : "text-foreground/90"
                  }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <ModeToggle />
            <Link to="/login" className={`transition-all duration-500 ${scrolled ? "hidden w-0 opacity-0" : "block w-auto opacity-100"}`}>
              <Button
                variant="ghost"
                size="sm"
                className={`font-bold transition-colors ${scrolled ? "text-foreground hover:text-foreground/80" : "text-foreground/90 hover:text-foreground"}`}
              >
                Sign in
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="rounded-full px-6 font-bold bg-zinc-900 border-0 text-white hover:bg-black hover:text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:hover:text-zinc-900 shadow-lg shadow-black/10 transition-all transform hover:scale-105"
              size="sm"
            >
              Start Building
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <button
              className={`p-2 transition-colors ${scrolled ? "text-foreground" : "text-foreground"}`}
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
              className="md:hidden absolute top-24 left-6 right-6 p-6 rounded-[2rem] glass-card border-border shadow-2xl z-50"
            >
              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-foreground/90 hover:text-foreground transition-colors text-lg font-bold"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="flex flex-col gap-4 pt-6 border-t border-border">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full text-foreground/90 hover:text-foreground font-bold">Sign in</Button>
                  </Link>
                  <Button variant="ghost" className="w-full rounded-2xl font-bold bg-zinc-900 text-white hover:bg-black hover:text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:hover:text-zinc-900 border-0 shadow-lg shadow-black/10" onClick={() => setIsOpen(false)}>Start Building</Button>
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
