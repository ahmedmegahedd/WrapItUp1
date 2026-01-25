'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProduct, getTimeSlots, getDisabledDates } from '@/lib/data'
import api from '@/lib/api'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import CheckoutForm from '@/components/CheckoutForm'
import AddOnsModal from '@/components/AddOnsModal'
import { generateProductSchema } from '@/lib/seo'
import { trackProductClick } from '@/lib/analytics'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [showAddOns, setShowAddOns] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [disabledDates, setDisabledDates] = useState<string[]>([])

  useEffect(() => {
    async function loadData() {
      const productData = await getProduct(params.slug as string)
      setProduct(productData)
      setLoading(false)

      // Track product view/click
      if (productData?.id) {
        trackProductClick(productData.id)
      }

      const slots = await getTimeSlots()
      setTimeSlots(slots)

      const dates = await getDisabledDates()
      setDisabledDates(dates)
    }
    loadData()
  }, [params.slug])

  const handleVariationChange = (variationName: string, optionId: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [variationName]: optionId,
    }))
  }

  const calculatePrice = () => {
    if (!product) return 0
    let price = product.discount_price || product.base_price

    if (product.product_variations) {
      for (const variation of product.product_variations) {
        const selectedOptionId = selectedVariations[variation.name]
        if (selectedOptionId) {
          const option = variation.product_variation_options?.find(
            (opt: any) => opt.id === selectedOptionId
          )
          if (option) {
            price += parseFloat(option.price_modifier || 0)
          }
        }
      }
    }

    return price * quantity
  }

  const handleAddToCart = () => {
    setShowAddOns(true)
  }

  const handleAddOnsContinue = (addons: string[]) => {
    setSelectedAddons(addons)
    setShowAddOns(false)
    setShowCheckout(true)
  }

  const handleAddOnsSkip = () => {
    setSelectedAddons([])
    setShowAddOns(false)
    setShowCheckout(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Product not found</div>
      </div>
    )
  }

  return (
    <>
      {showAddOns && (
        <AddOnsModal
          productId={product.id}
          onContinue={handleAddOnsContinue}
          onSkip={handleAddOnsSkip}
        />
      )}

      {showCheckout && (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            product={product}
            selectedVariations={selectedVariations}
            selectedAddons={selectedAddons}
            quantity={quantity}
            timeSlots={timeSlots}
            disabledDates={disabledDates}
            onCancel={() => setShowCheckout(false)}
          />
        </Elements>
      )}

      {!showCheckout && !showAddOns && (
        <>
          {(() => {
            const mainImage = product.product_images?.[0]?.image_url
            const price = product.discount_price || product.base_price
            const productUrl = typeof window !== 'undefined' ? window.location.href : `https://wrap-itup.com/products/${product.slug}`
            
            const productSchema = generateProductSchema({
              name: product.title,
              description: product.description || `${product.title} - Beautiful breakfast tray gift`,
              price: price,
              image: mainImage,
              sku: product.sku,
              url: productUrl,
            })

            return (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
              />
            )
          })()}
          <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/20 pb-24 md:pb-12">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          {/* Premium Product Layout */}
          <div className="relative pt-6 md:pt-12">
            {/* Product Headline - Top Left */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-none mb-3">
                {product.title}
              </h1>
              {/* Price */}
              <div className="flex items-baseline gap-3">
                {product.discount_price ? (
                  <>
                    <span className="text-3xl md:text-4xl font-bold text-gray-900">
                      ${product.discount_price.toFixed(2)}
                    </span>
                    <span className="text-xl md:text-2xl text-gray-400 line-through">
                      ${product.base_price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">
                    ${product.base_price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Hero Image - Centered, Floating, with Perspective */}
            {mainImage && (
              <div className="relative mb-8 md:mb-12 flex justify-center items-center min-h-[400px] md:min-h-[600px]">
                <div 
                  className="relative w-full max-w-2xl aspect-square"
                  style={{
                    transform: 'perspective(1000px) rotateY(-1deg) rotateX(1deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 to-white/50 rounded-3xl blur-3xl" />
                  <div className="relative w-full h-full">
                    <Image
                      src={mainImage}
                      alt={product.title}
                      fill
                      className="object-contain drop-shadow-2xl"
                      sizes="(max-width: 768px) 100vw, 800px"
                      priority
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Options Section - Premium Pill Selectors */}
            {product.product_variations && product.product_variations.length > 0 && (
              <div className="mb-8 space-y-6">
                {product.product_variations.map((variation: any) => (
                  <div key={variation.id}>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      {variation.name}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {variation.product_variation_options?.map((option: any) => {
                        const isSelected = selectedVariations[variation.name] === option.id
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleVariationChange(variation.name, option.id)}
                            className={`px-6 py-3 rounded-full text-base font-medium transition-all duration-200 ${
                              isSelected
                                ? 'bg-gray-900 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-200'
                            }`}
                          >
                            {option.label}
                            {option.price_modifier > 0 && (
                              <span className={`ml-2 text-sm ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                                (+${option.price_modifier.toFixed(2)})
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Selector - Minimal */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md flex items-center justify-center font-semibold text-lg"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md flex items-center justify-center font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity >= product.stock_quantity}
                >
                  +
                </button>
                <span className="text-sm text-gray-500 ml-2">
                  {product.stock_quantity} available
                </span>
              </div>
            </div>

            {/* Total Price Display */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">Total</span>
                <span className="text-3xl font-bold text-gray-900">
                  ${calculatePrice().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Description - Collapsible or Below */}
            {product.description && (
              <div className="mb-8 text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Add to Cart Button - Mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="container mx-auto px-4 py-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full bg-gray-900 text-white py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[56px] shadow-lg active:scale-95"
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Desktop Add to Cart Button */}
        <div className="hidden md:block container mx-auto px-4 md:px-6 max-w-7xl pb-12">
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            className="w-full max-w-md bg-gray-900 text-white py-5 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-100"
          >
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
        </>
      )}
    </>
  )
}
