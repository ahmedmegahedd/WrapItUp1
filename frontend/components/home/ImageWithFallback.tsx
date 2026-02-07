'use client'

import { useState } from 'react'

const ERROR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjZTRlN2VmIiBmaWxsPSIjZjVmNWY1IiBzdHJva2Utd2lkdGg9IjEuNSIgdmlld0JveD0iMCAwIDg4IDg4Ij48cmVjdCB4PSIxNiIgeT0iMTYiIHdpZHRoPSI1NiIgaGVpZ2h0PSI1NiIgcng9IjgiLz48cGF0aCBkPSJNMzYgMzZoMTZ2MTZIMzZWMzZ6bTAtMjBoMTZ2MTZIMzZWMTZ6Ii8+PC9zdmc+'

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  className?: string
}

export default function ImageWithFallback({ src, alt, className, style, ...rest }: ImageWithFallbackProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`inline-block bg-gray-100 ${className ?? ''}`} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ERROR_PLACEHOLDER} alt={alt} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
      {...rest}
    />
  )
}
