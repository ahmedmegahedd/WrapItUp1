'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import api from '@/lib/api'
import ImageWithFallback from './ImageWithFallback'

const DEFAULT_COLLECTION_IMAGES: Record<string, string> = {
  'letterlicious-trays':
    'https://images.unsplash.com/photo-1640947109541-ad13a917ba45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'royal-breakfast-trays':
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'birthday-celebration':
    'https://images.unsplash.com/photo-1533987459130-0d7c303ea459?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'corporate-gifts':
    'https://images.unsplash.com/photo-1607006555628-81923b6e6f4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1640947109541-ad13a917ba45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'

export default function CollectionsSection() {
  const [collections, setCollections] = useState<{ id: string; name: string; slug: string; description?: string; image_url?: string }[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/collections')
        const active = (res.data || []).filter((c: { is_active?: boolean }) => c.is_active)
        setCollections(active)
      } catch {
        setCollections([])
      }
    }
    load()
  }, [])

  if (collections.length === 0) return null

  return (
    <section className="py-12 md:py-20 bg-[var(--neutral-50)]">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8 lg:px-12">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-8 md:mb-12"
        >
          <h2
            className="mb-3 text-[var(--neutral-900)]"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Our Collections
          </h2>
          <p
            style={{
              fontSize: 'clamp(0.9375rem, 1.75vw, 1.0625rem)',
              color: 'var(--neutral-700)',
              lineHeight: '1.6',
            }}
          >
            Discover curated experiences for every special moment
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          {collections.map((collection, index) => {
            const imageUrl =
              collection.image_url || DEFAULT_COLLECTION_IMAGES[collection.slug] || FALLBACK_IMAGE
            return (
              <motion.div
                key={collection.id}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: index * 0.1, ease: 'easeOut' }}
              >
                <Link href={`/collections/${collection.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                    <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden">
                      <ImageWithFallback
                        src={imageUrl}
                        alt={collection.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background:
                            'linear-gradient(0deg, rgba(255,182,217,0.3) 0%, rgba(255,255,255,0) 60%)',
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 bg-gradient-to-t from-black/60 to-transparent">
                      <h3
                        className="mb-1 text-white"
                        style={{
                          fontSize: 'clamp(1.0625rem, 2.5vw, 1.375rem)',
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {collection.name}
                      </h3>
                      <p
                        className="text-white/90"
                        style={{
                          fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                          lineHeight: '1.45',
                        }}
                      >
                        {collection.description || 'Explore this collection'}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
