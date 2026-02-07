import * as React from "react";
import { Navigation } from "@/app/components/navigation";
import { HeroSection } from "@/app/components/hero-section";
import { PurposeSection } from "@/app/components/purpose-section";
import { CollectionsSection } from "@/app/components/collections-section";
import { HorizontalScrollSection } from "@/app/components/horizontal-scroll-section";
import { WhySection } from "@/app/components/why-section";
import { FinalCtaSection } from "@/app/components/final-cta-section";
import { Footer } from "@/app/components/footer";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main>
        <HeroSection />
        <PurposeSection />
        <CollectionsSection />
        <HorizontalScrollSection />
        <WhySection />
        <FinalCtaSection />
      </main>
      
      <Footer />
    </div>
  );
}