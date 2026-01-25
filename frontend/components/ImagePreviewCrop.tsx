'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface ImagePreviewCropProps {
  imageUrl: string
  onCrop: (croppedImageUrl: string) => void
  onCancel: () => void
  aspectRatio?: number // Optional aspect ratio (width/height)
}

export default function ImagePreviewCrop({ imageUrl, onCrop, onCancel, aspectRatio }: ImagePreviewCropProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
    }
  }, [])

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
        // Center the image initially
        const containerWidth = containerRef.current?.clientWidth || 0
        const containerHeight = containerRef.current?.clientHeight || 0
        const initialScale = Math.min(
          containerWidth / img.naturalWidth,
          containerHeight / img.naturalHeight
        ) * 0.8 // Start at 80% to allow some zoom
        setScale(initialScale)
        setPosition({
          x: (containerWidth - img.naturalWidth * initialScale) / 2,
          y: (containerHeight - img.naturalHeight * initialScale) / 2,
        })
      }
    }
  }, [imageUrl])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.5, Math.min(3, scale * delta))
    setScale(newScale)
  }

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const img = imageRef.current

    // Set canvas size to container size
    canvas.width = containerRect.width
    canvas.height = containerRect.height

    // Calculate the source rectangle
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height

    const sourceX = (-position.x / scale) * scaleX
    const sourceY = (-position.y / scale) * scaleY
    const sourceWidth = (containerRect.width / scale) * scaleX
    const sourceHeight = (containerRect.height / scale) * scaleY

    // Draw the cropped image
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob)
        onCrop(croppedUrl)
      }
    }, 'image/png')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Adjust Image</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto"
            style={{
              width: '100%',
              aspectRatio: aspectRatio ? aspectRatio.toString() : '1',
              maxWidth: '600px',
              maxHeight: '600px',
              touchAction: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Preview"
              className="absolute"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              draggable={false}
            />
          </div>

          {/* Controls */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoom: {Math.round(scale * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>• Drag the image to reposition</p>
              <p>• Use the slider or scroll wheel to zoom</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="px-6 py-2 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
