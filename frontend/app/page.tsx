import { createMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import type { Metadata } from 'next'
import HomePageContent from '@/components/home/HomePageContent'

export const metadata: Metadata = createMetadata({
  title: 'Luxury Breakfast Gifts - Unforgettable Mornings | Wrap It Up',
  description:
    'Thoughtfully curated breakfast trays and gift boxes that turn ordinary mornings into extraordinary moments of love and connection. Shop luxury breakfast gifts.',
  path: '/',
})

export default function Home() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://wrap-itup.com/' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="pb-24 md:pb-0">
        <HomePageContent />
      </div>
    </>
  )
}
