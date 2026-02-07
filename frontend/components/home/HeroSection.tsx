'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import api from '@/lib/api'

function ChevronDownIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

const DEFAULT_HERO_TEXT = {
  headline: 'Luxury breakfast gifts for unforgettable mornings',
  subtext:
    'Thoughtfully curated breakfast trays and gift boxes that turn ordinary mornings into extraordinary moments of love and connection.',
  button_label: 'Explore Collections',
}

export default function HeroSection() {
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [heroText, setHeroText] = useState(DEFAULT_HERO_TEXT)

  useEffect(() => {
    api
      .get<{ image_url: string } | null>('/homepage/active-hero')
      .then((res) => {
        const data = res.data
        if (data?.image_url) setHeroImageUrl(data.image_url)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    api
      .get<{ headline: string; subtext: string; button_label: string }>('/homepage/hero-text')
      .then((res) => {
        const data = res.data
        if (data?.headline != null || data?.subtext != null || data?.button_label != null) {
          setHeroText({
            headline: data.headline ?? DEFAULT_HERO_TEXT.headline,
            subtext: data.subtext ?? DEFAULT_HERO_TEXT.subtext,
            button_label: data.button_label ?? DEFAULT_HERO_TEXT.button_label,
          })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={
          heroImageUrl
            ? {
                backgroundImage: `url(${heroImageUrl})`,
              }
            : {
                background: 'linear-gradient(135deg, var(--pink-soft) 0%, #FFFFFF 50%, var(--pink-light-luxury) 100%)',
              }
        }
      />
      {heroImageUrl && (
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,240,245,0.85) 0%, rgba(255,255,255,0.7) 50%, rgba(255,228,236,0.85) 100%)',
          }}
        />
      )}

      <div className="relative z-10 max-w-screen-2xl mx-auto px-5 md:px-8 lg:px-12 py-20 md:py-32 text-center">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <h1
            className="mb-6 md:mb-8 leading-tight px-4 text-[var(--neutral-900)]"
            style={{
              fontSize: 'clamp(2rem, 8vw, 4.5rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {heroText.headline.split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="mb-10 md:mb-12 mx-auto max-w-2xl px-4"
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            lineHeight: '1.7',
            color: 'var(--neutral-700)',
          }}
        >
          {heroText.subtext}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
        >
          <Link
            href="/collections"
            className="inline-block px-10 md:px-12 py-4 md:py-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg, var(--pink-main) 0%, var(--pink-dark-luxury) 100%)',
              color: 'var(--neutral-900)',
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {heroText.button_label}
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: 'var(--neutral-700)' }}
        >
          <ChevronDownIcon />
        </motion.div>
      </motion.div>
    </section>
  )
}
