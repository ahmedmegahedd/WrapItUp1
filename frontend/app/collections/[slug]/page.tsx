'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCollection } from '@/lib/data'
import { trackProductClick } from '@/lib/analytics'

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const [collection, setCollection] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCollection() {
      const data = await getCollection(params.slug as string)
      setCollection(data)
      setLoading(false)
    }
    loadCollection()
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Collection not found</h1>
          <Link href="/collections" className="text-pink-600 hover:underline">
            Browse all collections
          </Link>
        </div>
      </div>
    )
  }

  // Filter only active products and sort by display_order
  const products = (collection.collection_products || [])
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((cp: any) => cp.products)
    .filter((product: any) => product && product.is_active) || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/30 pt-24 md:pt-32 pb-24 md:pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Collection Header - Minimal */}
          <div className="mb-8 md:mb-12 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-bold mb-3 text-gray-900 tracking-tight">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto md:mx-0">
                {collection.description}
              </p>
            )}
          </div>

          {/* Products Grid - Premium Gallery Layout */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product: any) => {
                const productImage = product.product_images?.[0]?.image_url
                const price = product.discount_price || product.base_price
                
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={() => trackProductClick(product.id)}
                    className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_20px_60px_rgba(236,72,153,0.15)] transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {productImage && (
                      <div className="aspect-square relative bg-gradient-to-br from-pink-50 to-white overflow-hidden">
                        <Image
                          src={productImage}
                          alt={`${product.title} - Breakfast tray gift`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </div>
                    )}
                    <div className="p-4 md:p-5">
                      <h3 className="font-semibold mb-2 text-gray-900 text-base md:text-lg line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xl md:text-2xl font-bold text-gray-900">
                          ${price.toFixed(2)}
                        </span>
                        {product.discount_price && (
                          <span className="text-sm text-gray-400 line-through">
                            ${product.base_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-600 mb-6 text-lg">No products in this collection yet.</p>
              <Link
                href="/collections"
                className="inline-block px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors shadow-sm"
              >
                Browse other collections
              </Link>
            </div>
          )}
        </div>
      </div>
  )
}
