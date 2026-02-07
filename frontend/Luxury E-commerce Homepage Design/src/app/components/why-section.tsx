import * as React from "react";
import { motion } from "motion/react";
import { Star, Truck, ShieldCheck, Headphones, Package } from "lucide-react";

const reasons = [
  {
    icon: Star,
    title: "Premium Selection",
    description: "Curated by experts who understand luxury gifting"
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Same-day delivery available in select areas"
  },
  {
    icon: ShieldCheck,
    title: "Quality Guaranteed",
    description: "100% satisfaction or your money back"
  },
  {
    icon: Headphones,
    title: "Concierge Support",
    description: "Personal assistance for custom requests"
  },
  {
    icon: Package,
    title: "Eco-Friendly",
    description: "Sustainable packaging that's kind to the planet"
  }
];

export function WhySection() {
  return (
    <section className="py-20 md:py-32 bg-[var(--neutral-50)]">
      <div className="max-w-screen-xl mx-auto px-5 md:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-12 md:mb-20"
        >
          <h2
            className="mb-4"
            style={{
              fontSize: "clamp(1.75rem, 5vw, 3rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em"
            }}
          >
            Why Choose Wrap It Up
          </h2>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.125rem)",
              color: "var(--neutral-700)",
              lineHeight: "1.6"
            }}
          >
            We go beyond expectations to make every gift exceptional
          </p>
        </motion.div>

        {/* Reasons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                className="text-center"
              >
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110"
                  style={{ background: "var(--pink-light)" }}
                >
                  <Icon 
                    className="w-8 h-8 md:w-10 md:h-10" 
                    style={{ color: "var(--neutral-900)" }} 
                    strokeWidth={1.5} 
                  />
                </div>
                
                <h3
                  className="mb-3"
                  style={{
                    fontSize: "clamp(1.125rem, 2.5vw, 1.375rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.01em"
                  }}
                >
                  {reason.title}
                </h3>
                
                <p
                  style={{
                    fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)",
                    lineHeight: "1.6",
                    color: "var(--neutral-700)"
                  }}
                >
                  {reason.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}