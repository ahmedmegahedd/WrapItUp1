import type { Metadata } from 'next'
import './globals.css'
import FloatingNavbar from '@/components/FloatingNavbar'
import AnalyticsProvider from '@/components/AnalyticsProvider'
import { CartProvider } from '@/contexts/CartContext'
import { generateOrganizationSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'WrapItUp - Breakfast Trays as Gifts | Surprise Breakfast Delivery',
  description: 'Beautiful breakfast trays delivered as thoughtful gifts. Perfect for birthdays, anniversaries, and surprise breakfast delivery for your loved ones.',
  keywords: 'breakfast gifts, breakfast trays, surprise breakfast delivery, gift for loved ones, birthday breakfast, anniversary breakfast',
  authors: [{ name: 'WrapItUp' }],
  creator: 'WrapItUp',
  publisher: 'WrapItUp',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wrap-itup.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'WrapItUp',
    title: 'WrapItUp - Breakfast Trays as Gifts',
    description: 'Beautiful breakfast trays delivered as thoughtful gifts for your loved ones',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WrapItUp - Breakfast Trays as Gifts',
    description: 'Beautiful breakfast trays delivered as thoughtful gifts',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const organizationSchema = generateOrganizationSchema()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <AnalyticsProvider>
          <CartProvider>
            {children}
            <FloatingNavbar />
          </CartProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
