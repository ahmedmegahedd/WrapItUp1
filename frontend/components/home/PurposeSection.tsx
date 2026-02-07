'use client'

import { motion } from 'framer-motion'

export default function PurposeSection() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-screen-xl mx-auto px-5 md:px-8 lg:px-12">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2
            className="mb-6 md:mb-8 leading-tight text-[var(--neutral-900)]"
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Every gift tells a story of love
          </h2>

          <div className="space-y-6 md:space-y-8">
            <p
              style={{
                fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
                lineHeight: '1.7',
                color: 'var(--neutral-700)',
              }}
            >
              We believe the most meaningful moments happen in the quiet intimacy of morning rituals. A carefully
              prepared breakfast in bed isn&apos;t just food—it&apos;s a love letter.
            </p>

            <p
              style={{
                fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
                lineHeight: '1.7',
                color: 'var(--neutral-700)',
              }}
            >
              Each of our luxury gift boxes is designed to create that unforgettable experience—for anniversaries,
              birthdays, or simply because they deserve it.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
