import type { Metadata } from 'next'
import './globals.css'
import FloatingNavbar from '@/components/FloatingNavbar'
import AnalyticsProvider from '@/components/AnalyticsProvider'
import { CartProvider } from '@/contexts/CartContext'
import { generateOrganizationSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Wrap It Up App – Order Breakfast & Gifts',
  description:
    'Order breakfast trays and gift boxes from your phone. Choose delivery date and time, earn loyalty points, and use the app in Arabic or English. Download the Wrap It Up app.',
  keywords: 'Wrap It Up app, breakfast delivery, gift boxes, breakfast trays, order breakfast, loyalty points, Arabic English app',
  authors: [{ name: 'Wrap It Up' }],
  creator: 'Wrap It Up',
  publisher: 'Wrap It Up',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wrap-itup.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Wrap It Up',
    title: 'Wrap It Up App – Order Breakfast & Gifts',
    description: 'Order breakfast trays and gift boxes from your phone. Download the app for iOS or Android.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wrap It Up App – Order Breakfast & Gifts',
    description: 'Order breakfast trays and gift boxes from your phone. Download the app.',
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
