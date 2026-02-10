'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

/** Max width/height of the image preview in the modal. Larger = easier to see and align. */
const MAX_VIEW_SIZE = 720
/** Output image width in pixels (height = width / aspectRatio). */
const OUTPUT_SIZE = 1200

interface ImagePreviewCropProps {
  imageUrl: string
  onCrop: (croppedImageUrl: string) => void
  onCancel: () => void
  /** Display aspect ratio (width/height). Same as how the image will be shown. Default 1 = square. */
  aspectRatio?: number
}

export default function ImagePreviewCrop({ imageUrl, onCrop, onCancel, aspectRatio = 1 }: ImagePreviewCropProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 })
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 })
  const [boxPosition, setBoxPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Crop box = same size as the displayed image so "what you see is what you get"
  const boxWidth = imageDisplaySize.width > 0 ? imageDisplaySize.width : 400
  const boxHeight = imageDisplaySize.height > 0 ? imageDisplaySize.height : Math.round(400 / aspectRatio)

  const clampPosition = useCallback(
    (x: number, y: number, imgW: number, imgH: number, bw: number, bh: number) => {
      const w = Math.min(bw, imgW)
      const h = Math.min(bh, imgH)
      return {
        x: Math.max(0, Math.min(imgW - w, x)),
        y: Math.max(0, Math.min(imgH - h, y)),
      }
    },
    []
  )

  useEffect(() => {
    const img = imageRef.current
    if (!img || !imageUrl) return

    const onLoad = () => {
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      setImageNaturalSize({ width: nw, height: nh })

      const scale = Math.min(MAX_VIEW_SIZE / nw, MAX_VIEW_SIZE / nh, 1)
      const dw = Math.round(nw * scale)
      const dh = Math.round(nh * scale)
      setImageDisplaySize({ width: dw, height: dh })
      setBoxPosition({ x: 0, y: 0 })
    }

    if (img.complete) onLoad()
    else img.addEventListener('load', onLoad)
    return () => img.removeEventListener('load', onLoad)
  }, [imageUrl])

  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseInContainerX = e.clientX - rect.left
    const mouseInContainerY = e.clientY - rect.top
    setIsDragging(true)
    setDragOffset({
      x: mouseInContainerX - boxPosition.x,
      y: mouseInContainerY - boxPosition.y,
    })
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const mouseInContainerX = e.clientX - rect.left
      const mouseInContainerY = e.clientY - rect.top
      const next = clampPosition(
        mouseInContainerX - dragOffset.x,
        mouseInContainerY - dragOffset.y,
        imageDisplaySize.width,
        imageDisplaySize.height,
        boxWidth,
        boxHeight
      )
      setBoxPosition(next)
    }

    const handleUp = () => setIsDragging(false)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, dragOffset, imageDisplaySize, clampPosition, boxWidth, boxHeight])

  const handleCrop = () => {
    const img = imageRef.current
    if (!img || imageNaturalSize.width === 0) return

    const nw = imageNaturalSize.width
    const nh = imageNaturalSize.height
    const dw = imageDisplaySize.width
    const dh = imageDisplaySize.height

    const scaleX = nw / dw
    const scaleY = nh / dh

    const sourceX = boxPosition.x * scaleX
    const sourceY = boxPosition.y * scaleY
    const sourceW = boxWidth * scaleX
    const sourceH = boxHeight * scaleY

    const outW = Math.max(1, Math.round(OUTPUT_SIZE))
    const outH = Math.max(1, Math.round(OUTPUT_SIZE / aspectRatio))

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, outW, outH)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(URL.createObjectURL(blob))
        }
      },
      'image/png',
      0.92
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Choose visible area</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col items-center max-h-[85vh] overflow-auto">
          <p className="text-sm text-gray-600 mb-3">
            The area below is what will be used. It matches the display size (product/collection images are shown as squares).
          </p>

          <div
            ref={containerRef}
            className="relative bg-gray-200 rounded-lg overflow-hidden"
            style={{
              width: imageDisplaySize.width,
              height: imageDisplaySize.height,
              touchAction: 'none',
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="block w-full h-full object-contain"
              style={{
                width: imageDisplaySize.width,
                height: imageDisplaySize.height,
                pointerEvents: 'none',
              }}
              draggable={false}
            />

            <div
              role="button"
              tabIndex={0}
              onMouseDown={handleBoxMouseDown}
              className="absolute border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)] cursor-move flex items-center justify-center"
              style={{
                left: boxPosition.x,
                top: boxPosition.y,
                width: boxWidth,
                height: boxHeight,
                userSelect: 'none',
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') e.preventDefault()
              }}
            >
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Preview: {boxWidth}×{boxHeight}px · Output: {OUTPUT_SIZE}×{Math.round(OUTPUT_SIZE / aspectRatio)}px
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="px-5 py-2 rounded-full bg-pink-500 text-white hover:bg-pink-600"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
