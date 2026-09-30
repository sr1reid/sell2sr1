'use client';

import React from 'react';
import Link from 'next/link';
import { CATEGORIES, DEALERSHIP_LOCATIONS } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-neutral-100">
      
      {/* REFINED ANNOUNCEMENT BAR (NO PHONE NUMBER) */}
      <div className="bg-neutral-900 border-b border-neutral-800 text-xs py-2 px-4 text-center flex items-center justify-between">
        <div className="hidden md:flex items-center space-x-2 text-neutral-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
          <span>Direct Vehicle & Equipment Purchasing Platform of SR1 Companies</span>
        </div>
        <div className="mx-auto md:mx-0 flex items-center space-x-3 text-neutral-300 font-medium">
          <span>Employee-Owned. Customer-Focused.</span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="text-neutral-400 text-xs hidden sm:inline">
            Dealership Locations in Maine & New Hampshire
          </span>
        </div>
        <div className="hidden md:block text-neutral-400 text-xs">
          Fast, Transparent Appraisals
        </div>
      </div>

      {/* MAIN HEADER WITH SR1 BRAND LOGO THEME */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="SR1 Companies" 
                className="h-10 sm:h-12 w-auto object-contain transition-opacity hover:opacity-90" 
              />
            </div>

            <div className="hidden sm:flex flex-col justify-center border-l border-neutral-800 pl-3">
              <span className="text-[12px] font-bold tracking-wide text-neutral-300 uppercase">
                sell2sr1<span className="text-neutral-500">.com</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider text-neutral-400">
                100% Employee-Owned
              </span>
            </div>
          </Link>

          <nav className="flex items-center space-x-2">
            <Link
              href="/contact"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-850 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/sell"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-white text-neutral-950 transition-all"
            >
              Get Cash Offer →
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION WITH NEUTRAL SOPHISTICATED STYLING */}
      <section className="py-16 sm:py-24 border-b border-neutral-850">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Sell Your Unit to the People You Trust at SR1
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Skip private sale delays, listing fees, and tire-kickers. We buy RVs, trailers, tractors, heavy equipment, powersports, motorcycles, boats, and shipping containers with fast appraisals and guaranteed corporate funds.
          </p>

          <div className="pt-4 flex items-center justify-center">
            <Link
              href="/sell"
              className="px-8 py-4 bg-neutral-100 hover:bg-white text-neutral-950 font-bold text-sm rounded-xl transition-all shadow-sm"
            >
              Start Your Valuation →
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES GRID (NO ICONS, 9 REVISED CATEGORIES) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Select Product Category</h2>
          <p className="text-xs text-neutral-400">Select what you want to sell to start the intake form.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <Link
              key={key}
              href={`/sell?category=${key}`}
              className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-400 rounded-xl p-5 transition-all flex items-center justify-between"
            >
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-neutral-200 transition-colors">
                {cat.label}
              </h3>
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-all">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY SELL TO SR1 VALUE PROPS IN NEUTRAL STYLING */}
      <section className="bg-neutral-900/50 border-t border-neutral-850 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <h2 className="text-2xl font-bold text-white">Why Sell to SR1 Companies?</h2>
            <p className="text-xs text-neutral-400">Professional, straightforward transactions backed by an employee-owned dealership group.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 space-y-2">
              <h3 className="font-bold text-white text-sm">Direct Loan Payoffs</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Still owe on your loan? We coordinate directly with your bank or credit union and pay them off directly.
              </p>
            </div>

            <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 space-y-2">
              <h3 className="font-bold text-white text-sm">Free On-Site Pickup</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Can't haul your unit? Our dedicated transport team provides pickup services throughout Maine, New Hampshire, and New England.
              </p>
            </div>

            <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 space-y-2">
              <h3 className="font-bold text-white text-sm">100% Employee-Owned</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Every team member you interact with is a company owner committed to transparent valuations and exceptional service.
              </p>
            </div>

            <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 space-y-2">
              <h3 className="font-bold text-white text-sm">Guaranteed Corporate Funds</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Payment issued upon physical verification. No bouncing checks, no escrow delays, no consignment holding periods.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
