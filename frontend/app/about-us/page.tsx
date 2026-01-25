import Link from 'next/link'
import { createMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = createMetadata({
  title: 'About Us - WrapItUp | Family-Owned Breakfast Gift Delivery',
  description: 'Learn about WrapItUp, a family-owned business dedicated to bringing joy through beautiful breakfast trays. Discover our story of love, gifting, and creating special moments for your loved ones.',
  path: '/about-us',
  type: 'article',
})

export default function AboutUsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://wrap-itup.com/' },
    { name: 'About Us', url: 'https://wrap-itup.com/about-us' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <div className="min-h-screen bg-white pb-24 md:pb-0 md:pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-pink-50 via-pink-100 to-white pt-24 pb-16 px-4 md:pt-32 md:pb-24">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              About WrapItUp
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              A family-owned business dedicated to bringing joy and warmth to your loved ones' mornings through beautiful breakfast gifts
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <article className="prose prose-lg max-w-none">
              {/* Our Story */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">
                  Our Story
                </h2>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  WrapItUp was born from a simple belief: that the best gifts come from the heart and create lasting memories. As a family-owned business, we understand the importance of showing your loved ones how much you care, especially through thoughtful gestures that brighten their day.
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  It all started when we wanted to surprise a family member with something special for their birthday. We searched for the perfect breakfast gift—something that would make their morning extraordinary and show them how much they mean to us. After struggling to find exactly what we were looking for, we realized there was an opportunity to help others create these same magical moments.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Today, WrapItUp specializes in curating beautiful breakfast trays and delivering them as thoughtful gifts. Whether it's a birthday breakfast surprise, an anniversary celebration, or just a spontaneous gesture of love, we're here to help you make someone's morning special.
                </p>
              </div>

              {/* Our Mission */}
              <div className="mb-12 bg-pink-50 p-8 rounded-2xl border border-pink-100">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">
                  Our Mission
                </h2>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Our mission is simple: to make gifting breakfast trays effortless and meaningful. We believe that every breakfast can be a celebration when shared with someone you love, and we're committed to helping you create those moments.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We carefully select each breakfast tray in our collection, ensuring that every product meets our high standards for quality and beauty. From elegant designs perfect for romantic mornings to cheerful options ideal for birthday surprises, we offer a wide range of breakfast gifts to suit every occasion and personality.
                </p>
              </div>

              {/* Why Breakfast Gifts */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">
                  Why Breakfast Gifts?
                </h2>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Breakfast is often called the most important meal of the day, but it's also one of the most intimate. Sharing breakfast with someone you love creates a special connection and sets a positive tone for the entire day. That's why breakfast gifts have become such a meaningful way to show someone you care.
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  A beautiful breakfast tray delivered as a surprise gift transforms an ordinary morning into an extraordinary experience. It's not just about the food or the tray itself—it's about the thought, the care, and the love that goes into choosing and sending such a personal gift.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Whether you're celebrating a birthday, marking an anniversary, or simply wanting to brighten someone's day, a breakfast gift from WrapItUp is a perfect way to show your love and appreciation.
                </p>
              </div>

              {/* What Makes Us Different */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">
                  What Makes Us Different
                </h2>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-3 text-xl">✓</span>
                    <span className="leading-relaxed">
                      <strong className="text-gray-900">Family-Owned & Personal:</strong> As a family business, we treat every order with the same care and attention we'd give to our own loved ones.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-3 text-xl">✓</span>
                    <span className="leading-relaxed">
                      <strong className="text-gray-900">Curated Selection:</strong> Every breakfast tray in our collection is handpicked for quality, beauty, and the ability to create special moments.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-3 text-xl">✓</span>
                    <span className="leading-relaxed">
                      <strong className="text-gray-900">Easy Gifting:</strong> We make surprise breakfast delivery simple, so you can focus on what matters most—showing your love.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-3 text-xl">✓</span>
                    <span className="leading-relaxed">
                      <strong className="text-gray-900">Fast Delivery:</strong> We understand that timing matters when it comes to gifts, which is why we ensure prompt and reliable delivery.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Our Commitment */}
              <div className="mb-12 bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl border border-pink-200">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">
                  Our Commitment to You
                </h2>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  At WrapItUp, we're committed to making your gifting experience as smooth and joyful as possible. We understand that when you're choosing a gift for someone special, you want everything to be perfect—from the selection process to the delivery.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  That's why we offer a carefully curated collection of breakfast trays, easy ordering, flexible delivery options, and personalized touches like card messages. We're here to help you create moments that matter, one breakfast gift at a time.
                </p>
              </div>

              {/* Call to Action */}
              <div className="text-center bg-white p-8 rounded-2xl border-2 border-pink-200">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  Ready to Send a Thoughtful Breakfast Gift?
                </h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Browse our beautiful collection of breakfast trays and find the perfect gift for your loved one.
                </p>
                <Link
                  href="/collections"
                  className="inline-block bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[56px] min-w-[200px] flex items-center justify-center mx-auto"
                >
                  View Collections
                </Link>
              </div>
            </article>
          </div>
        </section>
      </div>
    </>
  )
}
