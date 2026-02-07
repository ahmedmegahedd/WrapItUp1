import * as React from "react";
import { ShoppingBag, Menu } from "lucide-react";
import { motion } from "motion/react";

export function Navigation() {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md"
    >
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl tracking-tight" style={{ fontWeight: 600 }}>
              Wrap It Up
            </h1>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              className="p-2 hover:bg-[var(--pink-light)] rounded-full transition-colors duration-300"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
            </button>
            <button 
              className="p-2 hover:bg-[var(--pink-light)] rounded-full transition-colors duration-300"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}