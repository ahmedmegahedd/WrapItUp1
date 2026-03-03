import { createMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = createMetadata({
  title: 'Wrap It Up App – Order Breakfast & Gifts',
  description:
    'Order breakfast trays and gift boxes from your phone. Choose delivery date and time, earn loyalty points, and use the app in Arabic or English. Download the Wrap It Up app.',
  path: '/',
})

export default function Home() {
  return <LandingPage />
}
