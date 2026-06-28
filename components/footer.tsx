"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Facebook, Instagram, ChevronUp } from "lucide-react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const TikTokIcon = () => (
  <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.08-1.4-1.22-.8-2.15-2.02-2.58-3.41-.02 1.83.01 3.66-.02 5.49 0 2.21-.55 4.45-1.74 6.22-1.19 1.77-3.08 2.94-5.18 3.26-2.1.32-4.38-.07-6.09-1.34C1.045 17.58.125 15.28.175 12.87c.05-2.41 1.09-4.8 2.96-6.32 1.87-1.52 4.44-2.06 6.81-1.47.02 1.41.01 2.82.02 4.23-1.32-.41-2.83-.17-3.92.65-1.09.82-1.63 2.28-1.38 3.65.25 1.37 1.34 2.52 2.69 2.81 1.35.29 2.88-.12 3.73-1.22.85-1.1 1.02-2.61.97-3.98.02-4.07-.01-8.14.02-12.21z"/>
  </svg>
);

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-neutral-50/50 border-t border-neutral-200">
      
      {/* 1. Feature Cards Grid Section */}
      <div className="dm-container pt-12 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Feature 1 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-neutral-100 shadow-xs">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <MaterialSymbol name="verified_user" className="!text-xl" />
            </span>
            <div>
              <h4 className="font-bold text-neutral-800 text-sm">Verified Sellers Only</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-normal">All sellers are verified for your safety.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-neutral-100 shadow-xs">
            <span className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0">
              <WhatsAppIcon className="size-5 text-orange-600" />
            </span>
            <div>
              <h4 className="font-bold text-neutral-800 text-sm">Chat on WhatsApp</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-normal">Chat directly with sellers instantly.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-neutral-100 shadow-xs">
            <span className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0">
              <MaterialSymbol name="location_on" className="!text-xl" />
            </span>
            <div>
              <h4 className="font-bold text-neutral-800 text-sm">Buy Near You</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-normal">Find items and shops close to you.</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-neutral-100 shadow-xs">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <MaterialSymbol name="check_circle" className="!text-xl" />
            </span>
            <div>
              <h4 className="font-bold text-neutral-800 text-sm">No Middlemen</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-normal">No scams. No middlemen. Just real deals.</p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Stay Updated Newsletter Section */}
      <div className="dm-container py-6">
        <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-orange-50/70 to-amber-50/40 border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="relative size-12 sm:size-14 rounded-full bg-orange-100/80 text-orange-600 grid place-items-center shrink-0">
              <MaterialSymbol name="mail" className="!text-2xl" />
              <span className="absolute -top-0.5 -right-0.5 size-4 bg-orange-600 text-white rounded-full flex items-center justify-center border border-white">
                <MaterialSymbol name="notifications" className="!text-[10px]" />
              </span>
            </div>
            <div>
              <h3 className="font-bold text-neutral-800 text-base">Stay updated with the latest deals</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Get the best offers, new arrivals and tips delivered to your inbox.</p>
            </div>
          </div>
          <form 
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2 w-full md:w-auto shrink-0"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-64 bg-white border border-neutral-200 focus:border-orange-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-neutral-800"
              required
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm hover:shadow-orange-600/10"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* 3. Main Footer Links Area */}
      <div className="dm-container py-10 sm:py-14 border-t border-neutral-200 mt-6 bg-white rounded-t-3xl shadow-xs">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          
          {/* Brand & Address Column */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="inline-block focus:outline-none">
              <Image
                src="/logo.png"
                alt="Midora Online"
                width={140}
                height={48}
                className="h-7 w-auto"
                priority
              />
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-neutral-500 max-w-xs">
              The marketplace where African brands and shoppers connect.
              Discover local shops, products, and services in one place.
            </p>

            <div className="space-y-2.5">
              <a
                href="mailto:midoraonline@gmail.com"
                className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors"
              >
                <Mail className="size-4 text-orange-500 shrink-0" />
                midoraonline@gmail.com
              </a>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500">
                <MapPin className="size-4 text-orange-500 shrink-0" />
                Kampala, Uganda
              </div>
            </div>

            {/* Social Icons Row */}
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="grid size-8 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:text-orange-600 hover:border-orange-500 transition-all bg-white" aria-label="Facebook">
                <Facebook className="size-4" />
              </a>
              <a href="#" className="grid size-8 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:text-orange-600 hover:border-orange-500 transition-all bg-white" aria-label="Instagram">
                <Instagram className="size-4" />
              </a>
              <a href="#" className="grid size-8 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:text-orange-600 hover:border-orange-500 transition-all bg-white" aria-label="TikTok">
                <TikTokIcon />
              </a>
              <a href="#" className="grid size-8 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:text-orange-600 hover:border-orange-500 transition-all bg-white" aria-label="WhatsApp">
                <WhatsAppIcon className="size-4 text-neutral-500 hover:text-orange-600 shrink-0" />
              </a>
            </div>
          </div>

          {/* Column 2: EXPLORE */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">Explore</p>
            <ul className="mt-4 space-y-2">
              <li><Link href="/shops" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Shops</Link></li>
              <li><Link href="/products" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Products</Link></li>
              <li><Link href="/products" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Categories</Link></li>
              <li><Link href="/products?q=deals" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">All deals</Link></li>
              <li><Link href="/products?sort=near_me" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Near me</Link></li>
            </ul>
          </div>

          {/* Column 3: COMPANY */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">Company</p>
            <ul className="mt-4 space-y-2">
              <li><Link href="/aboutus" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">About Midora</Link></li>
              <li><Link href="/onboarding" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">How it works</Link></li>
              <li><Link href="/open-shop" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Open a shop</Link></li>
              <li><Link href="#" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Column 4: SUPPORT */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">Support</p>
            <ul className="mt-4 space-y-2">
              <li><Link href="/contactus" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Contact us</Link></li>
              <li><Link href="/onboarding" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Help Center</Link></li>
              <li><Link href="/policies" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Safety tips</Link></li>
              <li><Link href="/policies" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Returns</Link></li>
              <li><Link href="/contactus" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Report issue</Link></li>
            </ul>
          </div>

          {/* Column 5: LEGAL */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">Legal</p>
            <ul className="mt-4 space-y-2">
              <li><Link href="/termsandconditions" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/policies" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/policies" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Cookies Policy</Link></li>
              <li><Link href="/policies" className="text-xs sm:text-sm text-neutral-500 hover:text-orange-600 transition-colors">Seller Policy</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* 4. Bottom Copy bar */}
      <div className="border-t border-neutral-200 bg-neutral-100/50 py-5">
        <div className="dm-container flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} Midora Online. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <Link href="/termsandconditions" className="hover:text-orange-600">Terms</Link>
            <span>•</span>
            <Link href="/policies" className="hover:text-orange-600">Privacy</Link>
            <span>•</span>
            <Link href="/policies" className="hover:text-orange-600">Cookies</Link>
          </div>
          <button 
            onClick={scrollToTop}
            className="grid size-8 place-items-center bg-orange-100 hover:bg-orange-200 active:bg-orange-300 text-orange-600 rounded-full transition-all cursor-pointer"
            title="Scroll to Top"
          >
            <ChevronUp className="size-4" />
          </button>
        </div>
      </div>

    </footer>
  );
}
