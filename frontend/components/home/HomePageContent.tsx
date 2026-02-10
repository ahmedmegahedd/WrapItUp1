'use client'

import PurposeSection from './PurposeSection'
import CollectionsSection from './CollectionsSection'
import HorizontalScrollSection from './HorizontalScrollSection'
import WhySection from './WhySection'
import FinalCtaSection from './FinalCtaSection'
import Footer from './Footer'

export default function HomePageContent() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pb-24 md:pb-0 md:pt-0">
        <PurposeSection />
        <CollectionsSection />
        <HorizontalScrollSection />
        <WhySection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  )
}
