import * as React from "react";
import { Instagram, Facebook, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t py-12 md:py-16" style={{ borderColor: "var(--neutral-200)" }}>
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8 lg:px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-10 md:mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <h3 className="mb-4" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              Wrap It Up
            </h3>
            <p style={{ fontSize: "0.9375rem", color: "var(--neutral-700)", lineHeight: "1.6" }}>
              Luxury breakfast gifts for unforgettable mornings.
            </p>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="mb-4" style={{ fontSize: "1rem", fontWeight: 600 }}>
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.9375rem", color: "var(--neutral-700)" }}>
                  All Collections
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.9375rem", color: "var(--neutral-700)" }}>
                  Breakfast Trays
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.9375rem", color: "var(--neutral-700)" }}>
                  Gift Boxes
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.9375rem", color: "var(--neutral-700)" }}>
                  Custom Orders
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="mb-4" style={{ fontSize: "1rem", fontWeight: 600 }}>
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.9375rem", color: "var(--neutral-700)" }}>
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.9375rem", color: "var(--neutral-700)" }}>
                  Delivery Info
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.9375rem", color: "var(--neutral-700)" }}>
                  Returns
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.9375rem", color: "var(--neutral-700)" }}>
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h4 className="mb-4" style={{ fontSize: "1rem", fontWeight: 600 }}>
              Connect
            </h4>
            <p className="mb-4" style={{ fontSize: "0.9375rem", color: "var(--neutral-700)", lineHeight: "1.6" }}>
              Follow us for inspiration and exclusive offers
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ background: "var(--pink-light)" }}
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" style={{ color: "var(--neutral-900)" }} strokeWidth={1.5} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ background: "var(--pink-light)" }}
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" style={{ color: "var(--neutral-900)" }} strokeWidth={1.5} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ background: "var(--pink-light)" }}
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" style={{ color: "var(--neutral-900)" }} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: "var(--neutral-200)" }}
        >
          <p style={{ fontSize: "0.875rem", color: "var(--neutral-700)" }}>
            © 2026 Wrap It Up. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.875rem", color: "var(--neutral-700)" }}>
              Privacy Policy
            </a>
            <a href="#" className="transition-colors duration-200 hover:text-[var(--pink-dark)]" style={{ fontSize: "0.875rem", color: "var(--neutral-700)" }}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}