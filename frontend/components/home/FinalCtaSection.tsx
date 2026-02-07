'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import ImageWithFallback from './ImageWithFallback'

const CTA_BG_IMAGE =
  'https://images.unsplash.com/photo-1587828841350-c93c13ae3e1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'

export default function FinalCtaSection() {
  return (
    <section className="relative py-24 md:py-40 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src={CTA_BG_IMAGE}
          alt="Elegant background"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,240,245,0.95) 0%, rgba(255,228,236,0.9) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-5 md:px-8 lg:px-12 text-center">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h2
            className="mb-6 md:mb-8 text-[var(--neutral-900)]"
            style={{
              fontSize: 'clamp(2rem, 6vw, 4rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: '1.2',
            }}
          >
            Create a morning
            <br />
            they&apos;ll never forget
          </h2>

          <p
            className="mb-10 md:mb-12 mx-auto max-w-2xl"
            style={{
              fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
              lineHeight: '1.7',
              color: 'var(--neutral-700)',
            }}
          >
            Start your journey to creating unforgettable moments. Explore our curated collections and find the
            perfect gift that speaks from the heart.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/collections"
              className="w-full sm:w-auto px-10 md:px-12 py-4 md:py-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-center"
              style={{
                background: 'linear-gradient(135deg, var(--pink-main) 0%, var(--pink-dark-luxury) 100%)',
                color: 'var(--neutral-900)',
                fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              Shop All Collections
            </Link>

            <Link
              href="/about-us"
              className="w-full sm:w-auto px-10 md:px-12 py-4 md:py-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 border-2 text-center"
              style={{
                borderColor: 'var(--neutral-900)',
                color: 'var(--neutral-900)',
                fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                background: 'transparent',
              }}
            >
              About Us
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
