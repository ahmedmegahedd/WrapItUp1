import * as React from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(135deg, var(--pink-soft) 0%, #FFFFFF 50%, var(--pink-light) 100%)"
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-5 md:px-8 lg:px-12 py-20 md:py-32 text-center">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <h1 
            className="mb-6 md:mb-8 leading-tight px-4"
            style={{ 
              fontSize: "clamp(2rem, 8vw, 4.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em"
            }}
          >
            Luxury breakfast gifts<br />
            for unforgettable mornings
          </h1>
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mb-10 md:mb-12 mx-auto max-w-2xl px-4"
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
            lineHeight: "1.7",
            color: "var(--neutral-700)"
          }}
        >
          Thoughtfully curated breakfast trays and gift boxes that turn ordinary mornings 
          into extraordinary moments of love and connection.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        >
          <button
            className="px-10 md:px-12 py-4 md:py-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, var(--pink-main) 0%, var(--pink-dark) 100%)",
              color: "var(--neutral-900)",
              fontSize: "clamp(1rem, 2vw, 1.125rem)",
              fontWeight: 600,
              letterSpacing: "-0.01em"
            }}
          >
            Explore Collections
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 md:w-8 md:h-8" style={{ color: "var(--neutral-700)" }} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </section>
  );
}