'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createScope, animate } from 'animejs';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';

interface HeroSectionProps {
  sessionRole?: string;
}

export default function HeroSection({ sessionRole }: HeroSectionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    // Component-scoped Anime.js timeline entrance
    const scope = createScope({ root }).add(() => {
      const textItems = root.querySelectorAll('.hero-text-anim');
      const nodes = root.querySelectorAll('.hero-node-anim');
      const lines = root.querySelectorAll('.hero-line-anim');

      // Animating the text and then drawing the connections of the central core
      animate(textItems, {
        opacity: [0, 1],
        translateY: [25, 0],
        duration: MOTION.duration.slow,
        ease: MOTION.easing.smooth,
        delay: (_el?: any, i?: number) => (i || 0) * 120,
      });

      animate(lines, {
        strokeDashoffset: [300, 0],
        opacity: [0, 1],
        duration: MOTION.duration.slow,
        ease: MOTION.easing.smooth,
        delay: 500,
      });

      animate(nodes, {
        scale: [0, 1],
        opacity: [0, 1],
        duration: MOTION.duration.medium,
        ease: MOTION.easing.bounce,
        delay: (_el?: any, i?: number) => 800 + (i || 0) * 100,
      });
    });

    return () => {
      scope.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden min-h-[90vh] pt-20 pb-16 flex items-center bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Headline & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="hero-text-anim inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#0b3c26] border border-emerald-200/80 text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <span>Real-Time Surplus Rescue Network</span>
            </div>

            <h1 
              className="hero-text-anim text-4xl sm:text-6xl font-extrabold tracking-tight text-[#0b3c26] leading-[1.08] font-display"
            >
              Rescue surplus food <br />
              <span className="text-slate-800 font-bold">
                before the window closes.
              </span>
            </h1>
            
            <p 
              className="hero-text-anim max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed font-medium"
            >
              Connect surplus meals from commercial kitchens with verified local receiver NGOs in minutes. Automated time-window countdowns, verified OTP handovers, and continuous organic recovery routing.
            </p>
            
            <div 
              className="hero-text-anim pt-2 flex flex-col sm:flex-row gap-3.5"
            >
              {sessionRole === 'DONOR' ? (
                <>
                  <Link
                    href="/donor"
                    className="btn-primary px-8 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>Open Donor Dashboard</span>
                    <span className="text-emerald-300">&rarr;</span>
                  </Link>
                  <Link
                    href="/donor/create"
                    className="btn-secondary px-7 py-3.5 text-sm font-semibold shadow-xs text-center inline-flex items-center justify-center"
                  >
                    + New Surplus Listing
                  </Link>
                </>
              ) : sessionRole === 'NGO' ? (
                <>
                  <Link
                    href="/ngo"
                    className="btn-primary px-8 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>Open NGO Portal</span>
                    <span className="text-emerald-300">&rarr;</span>
                  </Link>
                  <Link
                    href="/ngo/active"
                    className="btn-secondary px-7 py-3.5 text-sm font-semibold shadow-xs text-center inline-flex items-center justify-center"
                  >
                    Active Rescues
                  </Link>
                </>
              ) : sessionRole === 'VOLUNTEER' ? (
                <>
                  <Link
                    href="/volunteer"
                    className="btn-primary px-8 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>My Assigned Pickups</span>
                    <span className="text-emerald-300">&rarr;</span>
                  </Link>
                </>
              ) : sessionRole === 'ADMIN' ? (
                <>
                  <Link
                    href="/admin"
                    className="btn-primary px-8 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>Admin Coordinator</span>
                    <span className="text-emerald-300">&rarr;</span>
                  </Link>
                  <Link
                    href="/admin/data"
                    className="btn-secondary px-7 py-3.5 text-sm font-semibold shadow-xs text-center inline-flex items-center justify-center"
                  >
                    Data Browser
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="btn-primary px-8 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>Publish Surplus Food</span>
                    <span className="text-emerald-300">&rarr;</span>
                  </Link>
                  <a
                    href="#how-it-works"
                    className="btn-secondary px-7 py-3.5 text-sm font-semibold shadow-xs text-center"
                  >
                    How FoodOPS Works
                  </a>
                </>
              )}
            </div>

            {/* Platform Operational Metrics Bar */}
            <div className="hero-text-anim pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80">
              <div>
                <p className="text-2xl font-black text-[#0b3c26] font-display">100%</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified NGOs</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#0b3c26] font-display">&lt; 45m</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Rescue Window</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#10b981] font-display">Zero</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Food Waste Target</p>
              </div>
            </div>
          </div>

          {/* Live Operational Rescue Preview Card */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
              {/* Header */}
              <div className="bg-[#0b3c26] p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">Active Rescue Stream</span>
                </div>
                <span className="status-badge bg-emerald-950/60 text-emerald-300 border-emerald-700/50 text-[10px]">
                  LIVE MATCH
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* Active Item Title & SLA Counter */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Fresh Veg Biryani & Curry</h3>
                    <p className="text-xs text-slate-500 font-medium">Grand Palace Hotel &bull; 45 Servings (~18 kg)</p>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold font-mono flex items-center gap-1">
                    <span>⏱️</span>
                    <span>42 MIN REMAINING</span>
                  </div>
                </div>

                {/* Stepper Pipeline */}
                <div className="space-y-3 py-2 border-y border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">1</span>
                      Donor Audit
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span>✓</span> AI Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">2</span>
                      Receiver Claim
                    </span>
                    <span className="text-emerald-700 font-bold">Asha Shelter Org</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-[#0b3c26]">
                      <span className="w-5 h-5 rounded-full bg-[#0b3c26] text-white flex items-center justify-center font-bold text-[10px] animate-pulse">3</span>
                      Rider Transit
                    </span>
                    <span className="status-badge status-badge-active text-[10px]">
                      EN ROUTE
                    </span>
                  </div>
                </div>

                {/* Handover OTP Box */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Pickup Security OTP</p>
                    <p className="text-xs text-slate-600 font-medium">Verify code with Donor at location</p>
                  </div>
                  <div className="px-3 py-1.5 bg-[#0b3c26] text-white rounded font-mono font-bold text-sm tracking-widest">
                    4 8 2 9
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] font-medium text-slate-500">
                <span>📍 MG Road Sector 4 &rarr; Koramangala</span>
                <span className="text-emerald-700 font-bold">9.8 kg CO2e Saved</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
