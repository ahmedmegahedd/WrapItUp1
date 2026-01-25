'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import api from '@/lib/api'

interface Addon {
  id: string
  name: string
  description?: string
  price: number
  addon_images?: Array<{ image_url: string; display_order: number }>
}

interface AddOnsModalProps {
  productId: string
  onContinue: (selectedAddons: string[]) => void
  onSkip: () => void
}

export default function AddOnsModal({ productId, onContinue, onSkip }: AddOnsModalProps) {
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadAddons() {
      try {
        const response = await api.get(`/addons/product/${productId}`)
        setAddons(response.data || [])
        // Initialize image indices
        const indices: Record<string, number> = {}
        response.data?.forEach((addon: Addon) => {
          indices[addon.id] = 0
        })
        setImageIndices(indices)
      } catch (error) {
        console.error('Error loading add-ons:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAddons()
  }, [productId])

  function toggleAddon(addonId: string) {
    setSelectedAddons((prev) => {
      const next = new Set(prev)
      if (next.has(addonId)) {
        next.delete(addonId)
      } else {
        next.add(addonId)
      }
      return next
    })
  }

  function nextImage(addonId: string, totalImages: number) {
    setImageIndices((prev) => ({
      ...prev,
      [addonId]: ((prev[addonId] || 0) + 1) % totalImages,
    }))
  }

  function prevImage(addonId: string, totalImages: number) {
    setImageIndices((prev) => ({
      ...prev,
      [addonId]: ((prev[addonId] || 0) - 1 + totalImages) % totalImages,
    }))
  }

  const totalAddonsPrice = Array.from(selectedAddons).reduce((sum, addonId) => {
    const addon = addons.find((a) => a.id === addonId)
    return sum + (addon ? parseFloat(addon.price.toString()) : 0)
  }, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl md:rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-2 md:scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Complete the surprise
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                This pairs perfectly with your selection
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading add-ons...</div>
          ) : addons.length > 0 ? (
            <div className="space-y-4">
              {addons.map((addon) => {
                const images = addon.addon_images?.sort((a, b) => a.display_order - b.display_order) || []
                const currentImageIndex = imageIndices[addon.id] || 0
                const currentImage = images[currentImageIndex]?.image_url
                const isSelected = selectedAddons.has(addon.id)

                return (
                  <div
                    key={addon.id}
                    className={`relative bg-white rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-pink-500 shadow-lg scale-[1.02]'
                        : 'border-gray-100 hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image Carousel */}
                      {images.length > 0 && (
                        <div className="relative w-full md:w-48 h-48 md:h-48 bg-gradient-to-br from-pink-50 to-white">
                          {currentImage && (
                            <Image
                              src={currentImage}
                              alt={addon.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 192px"
                            />
                          )}
                          {images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  prevImage(addon.id, images.length)
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-white shadow-sm"
                              >
                                ‹
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  nextImage(addon.id, images.length)
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-white shadow-sm"
                              >
                                ›
                              </button>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                {images.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                            {addon.name}
                          </h3>
                          {addon.description && (
                            <p className="text-sm text-gray-600 mb-3">{addon.description}</p>
                          )}
                          <div className="text-xl font-bold text-gray-900">
                            ${parseFloat(addon.price.toString()).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <div className="p-5 flex items-center">
                        <button
                          onClick={() => toggleAddon(addon.id)}
                          className={`w-14 h-8 rounded-full transition-all duration-200 ${
                            isSelected
                              ? 'bg-pink-500'
                              : 'bg-gray-200'
                          } relative`}
                        >
                          <div
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                              isSelected ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No add-ons available for this product.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {selectedAddons.size > 0 && (
                <span>
                  {selectedAddons.size} add-on{selectedAddons.size > 1 ? 's' : ''} selected
                  {totalAddonsPrice > 0 && (
                    <span className="ml-2 font-semibold text-gray-900">
                      +${totalAddonsPrice.toFixed(2)}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Skip add-ons
            </button>
            <button
              onClick={() => onContinue(Array.from(selectedAddons))}
              className="flex-1 px-6 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors shadow-lg"
            >
              Continue to checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
