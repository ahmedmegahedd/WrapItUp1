import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  path?: string
  image?: string
  type?: 'website' | 'product' | 'article'
  product?: {
    name: string
    price: number
    image?: string
    description?: string
  }
}

export function createMetadata(config: SEOConfig): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wrap-itup.com'
  const fullUrl = config.path ? `${siteUrl}${config.path}` : siteUrl
  const imageUrl = config.image || config.product?.image || `${siteUrl}/og-image.jpg`

  return {
    title: `${config.title} | WrapItUp - Breakfast Trays as Gifts`,
    description: config.description,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: fullUrl,
      siteName: 'WrapItUp',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      locale: 'en_US',
      type: config.type === 'product' ? 'website' : (config.type || 'website'),
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: [imageUrl],
    },
  }
}

export function generateProductSchema(product: {
  name: string
  description: string
  price: number
  image?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image ? [product.image] : [],
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: 'USD',
      price: product.price.toString(),
      availability: 'https://schema.org/InStock',
    },
  }
}

export function generateOrganizationSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wrap-itup.com'
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WrapItUp',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'Beautiful breakfast trays delivered as thoughtful gifts for your loved ones',
    sameAs: [
      // Add social media links here
    ],
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
