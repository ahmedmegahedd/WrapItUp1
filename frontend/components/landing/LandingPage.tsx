'use client'

import Link from 'next/link'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/app-download'

function DownloadButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white px-6 py-4 font-medium hover:bg-gray-800 transition-colors min-h-[52px] min-w-[200px]"
        aria-label="Download on the App Store"
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        Download on the App Store
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white px-6 py-4 font-medium hover:bg-gray-800 transition-colors min-h-[52px] min-w-[200px]"
        aria-label="Get it on Google Play"
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.635z"
          />
        </svg>
        Get it on Google Play
      </a>
    </div>
  )
}

const benefits = [
  {
    title: 'Order breakfast & gifts easily',
    description: 'Browse collections and add items to your cart in a few taps.',
  },
  {
    title: 'Choose delivery date & time',
    description: 'Pick when you want your order delivered.',
  },
  {
    title: 'Earn loyalty points',
    description: 'Get rewarded with points on every order and redeem for rewards.',
  },
  {
    title: 'Arabic & English support',
    description: 'Use the app in your preferred language with full RTL support.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <header className="relative px-4 pt-20 pb-16 md:pt-24 md:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6">
            <span className="text-2xl md:text-3xl font-bold text-[var(--pink-primary)]">Wrap It Up</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Breakfast & Gift Boxes Delivered
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto">
            Order thoughtful breakfast trays and gift boxes from your phone. Choose your delivery date and time, earn points, and enjoy the app in Arabic or English.
          </p>
          <DownloadButtons />
        </div>
      </header>

      {/* Value section */}
      <section className="px-4 py-14 md:py-20 bg-[var(--pink-light)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            Why use the app
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2">
            {benefits.map((item, i) => (
              <li
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100/60"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm md:text-base">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* App preview placeholder */}
      <section className="px-4 py-14 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Everything in one app
          </h2>
          <p className="text-gray-600 mb-10 max-w-lg mx-auto">
            Collections, checkout, and order history — all in a simple, mobile-first experience.
          </p>
          <div className="flex justify-center">
            <div className="w-56 h-[480px] rounded-3xl border-4 border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 font-medium">
              App preview
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-14 md:py-20 bg-gray-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Get the app and order today
          </h2>
          <p className="text-gray-300 mb-8">
            Download Wrap It Up for iOS or Android and start ordering breakfast and gift boxes.
          </p>
          <DownloadButtons />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-gray-500 text-sm">© Wrap It Up</span>
          <Link
            href="/admin/login"
            className="text-sm text-[var(--pink-primary)] hover:underline"
          >
            Admin
          </Link>
        </div>
      </footer>
    </div>
  )
}
