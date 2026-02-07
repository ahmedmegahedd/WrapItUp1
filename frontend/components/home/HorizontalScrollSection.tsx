'use client'

import { motion } from 'framer-motion'

const highlights = [
  {
    title: 'Made with Love',
    description: 'Every detail carefully selected to show how much you care',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    ),
  },
  {
    title: 'Premium Quality',
    description: 'Only the finest ingredients and materials in every box',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    ),
  },
  {
    title: 'Beautiful Presentation',
    description: 'Unboxing experiences that create lasting memories',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
      />
    ),
  },
  {
    title: 'Perfect Timing',
    description: 'Delivered fresh and ready to create magic moments',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
]

export default function HorizontalScrollSection() {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-screen-2xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-10 md:mb-14 px-5 md:px-8"
        >
          <h2
            className="text-[var(--neutral-900)]"
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            What Makes Us Special
          </h2>
        </motion.div>

        <div className="relative">
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 px-5 md:px-8 snap-x snap-mandatory scrollbar-hide">
            {highlights.map((highlight, index) => (
              <motion.div
                key={index}
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                className="flex-shrink-0 w-[280px] md:w-[320px] snap-center"
              >
                <div
                  className="h-full p-8 rounded-3xl transition-all duration-300 hover:scale-105"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--pink-soft) 0%, var(--pink-light-luxury) 100%)',
                  }}
                >
                  <div
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-5"
                    style={{ background: 'var(--pink-main)' }}
                  >
                    <svg
                      className="w-7 h-7 md:w-8 md:h-8"
                      fill="none"
                      stroke="var(--neutral-900)"
                      viewBox="0 0 24 24"
                    >
                      {highlight.icon}
                    </svg>
                  </div>
                  <h3
                    className="mb-3 text-[var(--neutral-900)]"
                    style={{
                      fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {highlight.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
                      lineHeight: '1.6',
                      color: 'var(--neutral-700)',
                    }}
                  >
                    {highlight.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center mt-6 md:hidden">
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--neutral-700)',
              opacity: 0.7,
            }}
          >
            Swipe to see more →
          </p>
        </div>
      </div>
    </section>
  )
}
