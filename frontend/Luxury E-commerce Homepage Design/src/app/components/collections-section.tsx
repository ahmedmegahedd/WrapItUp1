import * as React from "react";
import { motion } from "motion/react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";

const collections = [
  {
    id: 1,
    name: "Classic Breakfast Trays",
    description: "Timeless elegance for perfect mornings",
    image: "https://images.unsplash.com/photo-1640947109541-ad13a917ba45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBicmVha2Zhc3QlMjB0cmF5JTIwYmVkJTIwY2hhbXBhZ25lfGVufDF8fHx8MTc2OTgwMTQyM3ww&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 2,
    name: "Romantic Gift Boxes",
    description: "Celebrate love with thoughtful details",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZ2lmdCUyMGJveCUyMHBpbmslMjByaWJib258ZW58MXx8fHwxNzY5ODAxNDI0fDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 3,
    name: "Artisan Pastries Collection",
    description: "Handcrafted treats for special occasions",
    image: "https://images.unsplash.com/photo-1533987459130-0d7c303ea459?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBicmVha2Zhc3QlMjBwYXN0cmllcyUyMGNvZmZlZSUyMGFlc3RoZXRpY3xlbnwxfHx8fDE3Njk4MDE0MjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 4,
    name: "Floral Gift Sets",
    description: "Beauty and indulgence combined",
    image: "https://images.unsplash.com/photo-1607006555628-81923b6e6f4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwcGluayUyMGZsb3dlcnMlMjBnaWZ0JTIwd3JhcHBpbmd8ZW58MXx8fHwxNzY5ODAxNDI1fDA&ixlib=rb-4.1.0&q=80&w=1080"
  }
];

export function CollectionsSection() {
  return (
    <section className="py-16 md:py-24 bg-[var(--neutral-50)]">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-12 md:mb-16"
        >
          <h2
            className="mb-4"
            style={{
              fontSize: "clamp(1.75rem, 5vw, 3rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em"
            }}
          >
            Our Collections
          </h2>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.125rem)",
              color: "var(--neutral-700)",
              lineHeight: "1.6"
            }}
          >
            Discover curated experiences for every special moment
          </p>
        </motion.div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500">
                {/* Image */}
                <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden">
                  <ImageWithFallback
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "linear-gradient(0deg, rgba(255,182,217,0.3) 0%, rgba(255,255,255,0) 60%)"
                    }}
                  />
                </div>

                {/* Text Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/60 to-transparent">
                  <h3
                    className="mb-2 text-white"
                    style={{
                      fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                      fontWeight: 600,
                      letterSpacing: "-0.01em"
                    }}
                  >
                    {collection.name}
                  </h3>
                  <p
                    className="text-white/90"
                    style={{
                      fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      lineHeight: "1.5"
                    }}
                  >
                    {collection.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}