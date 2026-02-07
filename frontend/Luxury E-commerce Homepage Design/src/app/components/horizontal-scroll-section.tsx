import * as React from "react";
import { motion } from "motion/react";
import { Heart, Sparkles, Gift, Clock } from "lucide-react";

const highlights = [
  {
    icon: Heart,
    title: "Made with Love",
    description: "Every detail carefully selected to show how much you care"
  },
  {
    icon: Sparkles,
    title: "Premium Quality",
    description: "Only the finest ingredients and materials in every box"
  },
  {
    icon: Gift,
    title: "Beautiful Presentation",
    description: "Unboxing experiences that create lasting memories"
  },
  {
    icon: Clock,
    title: "Perfect Timing",
    description: "Delivered fresh and ready to create magic moments"
  }
];

export function HorizontalScrollSection() {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-screen-2xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-10 md:mb-14 px-5 md:px-8"
        >
          <h2
            style={{
              fontSize: "clamp(1.75rem, 5vw, 3rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em"
            }}
          >
            What Makes Us Special
          </h2>
        </motion.div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 px-5 md:px-8 snap-x snap-mandatory scrollbar-hide">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ x: 50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                  className="flex-shrink-0 w-[280px] md:w-[320px] snap-center"
                >
                  <div 
                    className="h-full p-8 rounded-3xl transition-all duration-300 hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, var(--pink-soft) 0%, var(--pink-light) 100%)"
                    }}
                  >
                    <div 
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-5"
                      style={{ background: "var(--pink-main)" }}
                    >
                      <Icon className="w-7 h-7 md:w-8 md:h-8" style={{ color: "var(--neutral-900)" }} strokeWidth={1.5} />
                    </div>
                    
                    <h3
                      className="mb-3"
                      style={{
                        fontSize: "clamp(1.125rem, 2.5vw, 1.375rem)",
                        fontWeight: 600,
                        letterSpacing: "-0.01em"
                      }}
                    >
                      {highlight.title}
                    </h3>
                    
                    <p
                      style={{
                        fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)",
                        lineHeight: "1.6",
                        color: "var(--neutral-700)"
                      }}
                    >
                      {highlight.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Scroll hint for mobile */}
        <div className="text-center mt-6 md:hidden">
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--neutral-700)",
              opacity: 0.7
            }}
          >
            Swipe to see more →
          </p>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}