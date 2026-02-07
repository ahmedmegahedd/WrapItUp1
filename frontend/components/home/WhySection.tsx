'use client'

import { motion } from 'framer-motion'

const reasons = [
  {
    title: 'Premium Selection',
    description: 'Curated by experts who understand luxury gifting',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    ),
  },
  {
    title: 'Fast Delivery',
    description: 'Same-day delivery available in select areas',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1h9m1-8V6a1 1 0 00-1-1h-2M7 6a1 1 0 011-1h2a1 1 0 011 1m0 0v11a1 1 0 01-1 1h-2a1 1 0 01-1-1V6z"
      />
    ),
  },
  {
    title: 'Quality Guaranteed',
    description: '100% satisfaction or your money back',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
  },
  {
    title: 'Concierge Support',
    description: 'Personal assistance for custom requests',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    ),
  },
  {
    title: 'Eco-Friendly',
    description: "Sustainable packaging that's kind to the planet",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    ),
  },
]

export default function WhySection() {
  return (
    <section className="py-20 md:py-32 bg-[var(--neutral-50)]">
      <div className="max-w-screen-xl mx-auto px-5 md:px-8 lg:px-12">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-12 md:mb-20"
        >
          <h2
            className="mb-4 text-[var(--neutral-900)]"
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Why Choose Wrap It Up
          </h2>
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              color: 'var(--neutral-700)',
              lineHeight: '1.6',
            }}
          >
            We go beyond expectations to make every gift exceptional
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
              className="text-center"
            >
              <div
                className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110"
                style={{ background: 'var(--pink-light-luxury)' }}
              >
                <svg
                  className="w-8 h-8 md:w-10 md:h-10"
                  fill="none"
                  stroke="var(--neutral-900)"
                  viewBox="0 0 24 24"
                >
                  {reason.icon}
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
                {reason.title}
              </h3>
              <p
                style={{
                  fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
                  lineHeight: '1.6',
                  color: 'var(--neutral-700)',
                }}
              >
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
