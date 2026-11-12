'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DemoPanelBanner from '@/components/DemoPanelBanner';
import { MetricKindBadge } from '@/components/ImpactStats';
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconLock,
  IconPin,
  IconRider,
  IconShield,
} from '@/components/Icons';
import { DEMO_SITE_URL, IS_DEMO_MODE } from '@/lib/siteConfig';

export default function HeroSection() {
  const [sessionRole, setSessionRole] = useState<string | null>(null);
  const [adminEnabled, setAdminEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { role: null, adminEnabled: false }))
      .then((data: { role?: string | null; adminEnabled?: boolean }) => {
        if (active) {
          if (data.role) {
            setSessionRole(data.role);
          }
          setAdminEnabled(Boolean(data.adminEnabled));
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden py-14 sm:py-20 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Headline & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#0b3c26] border border-emerald-200 text-xs font-bold tracking-wide uppercase">
              <IconShield className="w-3.5 h-3.5 text-emerald-800" />
              <span>Surplus Food Rescue · Pune &amp; Pimpri-Chinchwad Pilot</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#0b3c26] leading-[1.08] font-display">
              Rescue surplus food <br />
              <span className="text-slate-800 font-bold">
                before the window closes.
              </span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
              FoodOPS coordinates surplus meals from commercial kitchens with verified local NGOs in Pune and Pimpri-Chinchwad. Fixed pickup windows, one-time OTP handovers, and compost or biogas routing if a batch expires.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row flex-wrap gap-3.5">
              {sessionRole === 'DONOR' ? (
                <>
                  <Link
                    href="/donor"
                    className="btn-primary px-7 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>Open Donor Dashboard</span>
                    <IconArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/donor/create"
                    className="btn-secondary px-6 py-3.5 text-sm font-semibold shadow-xs inline-flex items-center justify-center"
                  >
                    New Surplus Listing
                  </Link>
                </>
              ) : sessionRole === 'NGO' ? (
                <>
                  <Link
                    href="/ngo"
                    className="btn-primary px-7 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>Open NGO Portal</span>
                    <IconArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/ngo/active"
                    className="btn-secondary px-6 py-3.5 text-sm font-semibold shadow-xs inline-flex items-center justify-center"
                  >
                    Active Rescues
                  </Link>
                </>
              ) : sessionRole === 'VOLUNTEER' ? (
                <Link
                  href="/volunteer"
                  className="btn-primary px-7 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                >
                  <span>My Assigned Pickups</span>
                  <IconArrowRight className="w-4 h-4" />
                </Link>
              ) : process.env.NODE_ENV === 'development' && sessionRole === 'ADMIN' && adminEnabled ? (
                <>
                  <Link
                    href="/admin"
                    className="btn-primary px-7 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>Admin Coordinator</span>
                    <IconArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/admin/data"
                    className="btn-secondary px-6 py-3.5 text-sm font-semibold shadow-xs inline-flex items-center justify-center"
                  >
                    Data Browser
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/for-donors"
                    className="btn-primary px-7 py-3.5 text-sm font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>Onboard as Partner</span>
                    <IconArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="btn-secondary px-6 py-3.5 text-sm font-semibold shadow-xs text-center inline-flex items-center justify-center"
                  >
                    How FoodOPS Works
                  </a>
                  {!IS_DEMO_MODE && DEMO_SITE_URL ? (
                    <a
                      href={DEMO_SITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary px-6 py-3.5 text-sm font-semibold shadow-xs text-center inline-flex items-center justify-center border-emerald-300 text-[#0b3c26]"
                    >
                      Try the demo
                    </a>
                  ) : !IS_DEMO_MODE ? (
                    <Link
                      href="/about#demo-environment"
                      className="btn-secondary px-6 py-3.5 text-sm font-semibold shadow-xs text-center inline-flex items-center justify-center border-emerald-300 text-[#0b3c26]"
                    >
                      Try the demo
                    </Link>
                  ) : null}
                </>
              )}
            </div>

            {/* Honest Pilot Expectations & Claims (F07, F08, F11) */}
            <div className="pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200">
              <div className="rounded-lg border border-border bg-white/90 p-3.5 space-y-1">
                <p className="text-xs font-extrabold text-[#0b3c26] uppercase tracking-wider">
                  NGO Verification
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Every NGO is verified before its first claim: registration details, a named contact, and a food-handling check. Verification steps are listed on our{' '}
                  <Link href="/food-safety" className="text-emerald-800 font-semibold underline">
                    Food Safety page
                  </Link>
                  .
                </p>
              </div>

              <div className="rounded-lg border border-border bg-white/90 p-3.5 space-y-1">
                <p className="text-xs font-extrabold text-[#0b3c26] uppercase tracking-wider">
                  Pilot Window Target
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Our target: from listing to pickup in under 45 minutes inside our pilot area. We will publish the measured average after the first 20 rescues.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-white/90 p-3.5 space-y-1">
                <p className="text-xs font-extrabold text-[#0b3c26] uppercase tracking-wider">
                  Safe Handling Checks
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Food safety first: donors confirm the food was stored safely and is within its safe window; receivers check temperature and condition at pickup.{' '}
                  <Link href="/food-safety" className="text-emerald-800 font-semibold underline">
                    See how our checks work
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Example Rescue Walkthrough Card (F02, F03, F19, F35, F36) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {/* Mandatory Top Demo Banner (F02) */}
              <div className="p-3 bg-slate-50 border-b border-slate-200">
                <DemoPanelBanner title="Illustrative Walkthrough" />
              </div>

              {/* Card Header */}
              <div className="bg-[#0b3c26] px-5 py-3.5 text-white flex justify-between items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  How a rescue flows - example
                </span>
                <span className="inline-flex items-center rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-950">
                  DEMO
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">
                      Veg Biryani - Example Listing
                    </h2>
                    <p className="text-xs text-slate-700 font-medium">
                      Sample commercial kitchen &bull; ~18 kg (illustrative)
                    </p>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded bg-amber-50 text-amber-950 border border-amber-300 text-[11px] font-bold flex items-center gap-1.5 shrink-0"
                    aria-label="Safe pickup window: 42 minutes remaining in this example"
                  >
                    <IconClock className="w-3.5 h-3.5 text-amber-900" />
                    <span>42 minutes remaining in this example</span>
                  </div>
                </div>

                {/* Stepper Pipeline */}
                <div className="space-y-3 py-2.5 border-y border-slate-200">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px]">
                        1
                      </span>
                      Donor safe-window declaration
                    </span>
                    <span className="text-emerald-900 font-bold flex items-center gap-1">
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Declared (example)</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px]">
                        2
                      </span>
                      NGO claim (first-accept lock)
                    </span>
                    <span className="text-emerald-900 font-bold">
                      Verified NGO Partner (example)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="flex items-center gap-2 font-semibold text-[#0b3c26]">
                      <IconRider className="w-4 h-4 text-[#0b3c26]" />
                      Rider pickup &amp; handover
                    </span>
                    <span className="inline-flex items-center rounded border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-900">
                      EN ROUTE (EXAMPLE)
                    </span>
                  </div>
                </div>

                {/* Masked Handover OTP Box (F03) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      <IconLock className="w-3.5 h-3.5 text-[#0b3c26]" />
                      <span>Pickup Handover Code</span>
                    </p>
                    <p className="text-xs text-slate-700 font-medium leading-snug">
                      The donor sees a one-time code at pickup. Codes are never shown publicly.
                    </p>
                  </div>
                  <div
                    aria-label="Masked one-time pickup code"
                    className="px-3 py-1.5 bg-[#0b3c26] text-white rounded font-mono font-bold text-base tracking-[0.25em] shrink-0"
                  >
                    &bull;&bull;&bull;&bull;
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <IconPin className="w-3.5 h-3.5 text-[#0b3c26]" />
                  <span>A hotel kitchen to a shelter, about 4 km in this scenario</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MetricKindBadge kind="SIMULATED" />
                  <span className="font-bold text-slate-900">Example CO₂e: 45 kg</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
