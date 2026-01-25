import Link from 'next/link'
import { createMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = createMetadata({
  title: 'Breakfast Trays as Gifts - Surprise Breakfast Delivery',
  description: 'Beautiful breakfast trays delivered as thoughtful gifts. Perfect for birthdays, anniversaries, and surprise breakfast delivery. Order now and make someone\'s morning special.',
  path: '/',
})

export default async function Home() {

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://wrap-itup.com/' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <div className="min-h-screen bg-white pb-24 md:pb-0 md:pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-pink-50 via-pink-100 to-white pt-20 pb-16 px-4 md:pt-32 md:pb-24">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              Surprise Your Loved Ones with
              <span className="text-pink-600"> Beautiful Breakfast Trays</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
              Thoughtful breakfast gifts delivered to their door. Perfect for birthdays, anniversaries, or just because you care. Make their morning special.
            </p>
            <Link
              href="/collections"
              className="inline-block bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[56px] min-w-[200px] flex items-center justify-center"
            >
              Shop Breakfast Gifts
            </Link>
          </div>
        </section>

        {/* Horizontal Scroll Section - Premium Highlights with Infinite Loop - Full Width */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-white to-pink-50">
          <div className="container mx-auto max-w-7xl px-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Why Choose Us
            </h2>
          </div>
          
          {/* Horizontal Scroll Container with Infinite Loop - Full Width */}
          <div className="overflow-hidden w-full">
            <div className="flex gap-6 md:gap-8 pb-4 infinite-scroll">
              {/* MOCK VALUE CARDS - Fewer, Bigger Cards - Replace with real content later */}
              {[
                {
                  id: '1',
                  icon: '🎁',
                  title: 'Thoughtfully Curated',
                  description: 'Each breakfast tray is carefully selected for quality and beauty',
                  color: 'from-pink-400 to-pink-500',
                },
                {
                  id: '2',
                  icon: '🚚',
                  title: 'Fast Delivery',
                  description: 'We deliver beautiful breakfast trays right to their door',
                  color: 'from-pink-300 to-pink-400',
                },
                {
                  id: '3',
                  icon: '💝',
                  title: 'Perfect for Any Occasion',
                  description: 'Birthdays, anniversaries, or just because you care',
                  color: 'from-pink-500 to-pink-600',
                },
              ].map((card) => (
                <div
                  key={card.id}
                  className="flex-shrink-0 w-[85vw] md:w-[500px] lg:w-[600px] ml-6 md:ml-8 first:ml-6 md:first:ml-8"
                >
                  <div className={`bg-gradient-to-br ${card.color} rounded-3xl p-8 md:p-12 text-white shadow-xl h-full flex flex-col`}>
                    <div className="text-6xl md:text-7xl mb-6">{card.icon}</div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-4">{card.title}</h3>
                    <p className="text-pink-50 text-lg md:text-xl leading-relaxed flex-grow">
                      {card.description}
                    </p>
                  </div>
                </div>
              ))}
              {/* Duplicate cards for infinite loop effect */}
              {[
                {
                  id: '1',
                  icon: '🎁',
                  title: 'Thoughtfully Curated',
                  description: 'Each breakfast tray is carefully selected for quality and beauty',
                  color: 'from-pink-400 to-pink-500',
                },
                {
                  id: '2',
                  icon: '🚚',
                  title: 'Fast Delivery',
                  description: 'We deliver beautiful breakfast trays right to their door',
                  color: 'from-pink-300 to-pink-400',
                },
                {
                  id: '3',
                  icon: '💝',
                  title: 'Perfect for Any Occasion',
                  description: 'Birthdays, anniversaries, or just because you care',
                  color: 'from-pink-500 to-pink-600',
                },
              ].map((card, index) => (
                <div
                  key={`duplicate-${card.id}-${index}`}
                  className="flex-shrink-0 w-[85vw] md:w-[500px] lg:w-[600px]"
                >
                  <div className={`bg-gradient-to-br ${card.color} rounded-3xl p-8 md:p-12 text-white shadow-xl h-full flex flex-col`}>
                    <div className="text-6xl md:text-7xl mb-6">{card.icon}</div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-4">{card.title}</h3>
                    <p className="text-pink-50 text-lg md:text-xl leading-relaxed flex-grow">
                      {card.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
