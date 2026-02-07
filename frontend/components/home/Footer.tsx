'use client'

import Link from 'next/link'

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}
function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer
      className="bg-white border-t py-12 md:py-16"
      style={{ borderColor: 'var(--neutral-200)' }}
    >
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-10 md:mb-12">
          <div className="md:col-span-1">
            <h3 className="mb-4 text-[var(--neutral-900)]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              Wrap It Up
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)', lineHeight: '1.6' }}>
              Luxury breakfast gifts for unforgettable mornings.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-[var(--neutral-900)]" style={{ fontSize: '1rem', fontWeight: 600 }}>
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/collections" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)' }}>
                  All Collections
                </Link>
              </li>
              <li>
                <Link href="/collections/letterlicious-trays" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)' }}>
                  Breakfast Trays
                </Link>
              </li>
              <li>
                <Link href="/collections" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)' }}>
                  Gift Boxes
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)' }}>
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[var(--neutral-900)]" style={{ fontSize: '1rem', fontWeight: 600 }}>
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about-us" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)' }}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)' }}>
                  Delivery Info
                </Link>
              </li>
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)' }}>
                  Returns
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)' }}>
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[var(--neutral-900)]" style={{ fontSize: '1rem', fontWeight: 600 }}>
              Connect
            </h4>
            <p className="mb-4" style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)', lineHeight: '1.6' }}>
              Follow us for inspiration and exclusive offers
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ background: 'var(--pink-light-luxury)' }}
                aria-label="Instagram"
              >
                <span style={{ color: 'var(--neutral-900)' }}><InstagramIcon /></span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ background: 'var(--pink-light-luxury)' }}
                aria-label="Facebook"
              >
                <span style={{ color: 'var(--neutral-900)' }}><FacebookIcon /></span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ background: 'var(--pink-light-luxury)' }}
                aria-label="Twitter"
              >
                <span style={{ color: 'var(--neutral-900)' }}><TwitterIcon /></span>
              </a>
            </div>
          </div>
        </div>

        <div
          className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: 'var(--neutral-200)' }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-700)' }}>
            © {new Date().getFullYear()} Wrap It Up. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.875rem', color: 'var(--neutral-700)' }}>
              Privacy Policy
            </a>
            <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark-luxury)]" style={{ fontSize: '0.875rem', color: 'var(--neutral-700)' }}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
