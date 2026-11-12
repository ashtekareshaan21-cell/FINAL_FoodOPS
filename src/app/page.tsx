import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/Home/HeroSection';
import LazyHomeScenes from '@/components/Home/LazyHomeScenes';
import EsgMetrics from '@/components/Home/EsgMetrics';
import RoadmapSection from '@/components/Home/RoadmapSection';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import SiteFooter from '@/components/SiteFooter';
import {
  IconArrowRight,
  IconDonor,
  IconNgo,
  IconRider,
} from '@/components/Icons';
import {
  CANONICAL_SITE_URL,
  CONTACT_EMAIL,
  HAS_CONFIGURED_CONTACT_EMAIL,
} from '@/lib/siteConfig';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'FoodOPS | High-Efficiency Surplus Food Rescue Logistics',
  description:
    'Surplus food rescue coordination in Pune and Pimpri-Chinchwad connecting commercial kitchens, verified NGOs, and volunteer riders with safety checks and OTP handovers.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'FoodOPS',
    title: 'FoodOPS | High-Efficiency Surplus Food Rescue Logistics',
    description:
      'Surplus food rescue coordination in Pune and Pimpri-Chinchwad connecting commercial kitchens, verified NGOs, and volunteer riders with safety checks and OTP handovers.',
    url: `${CANONICAL_SITE_URL}/`,
    images: [
      {
        url: `${CANONICAL_SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'FoodOPS - Surplus food rescue, pilot in Pune',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoodOPS | High-Efficiency Surplus Food Rescue Logistics',
    description:
      'Surplus food rescue coordination in Pune and Pimpri-Chinchwad connecting commercial kitchens, verified NGOs, and volunteer riders.',
    images: [`${CANONICAL_SITE_URL}/opengraph-image`],
  },
};

export default function Home() {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'FoodOPS',
      url: CANONICAL_SITE_URL,
      description:
        'Surplus food rescue coordination in Pune and Pimpri-Chinchwad connecting commercial donors, verified NGOs, and volunteer riders.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Pune',
        addressRegion: 'Maharashtra',
        addressCountry: 'IN',
      },
      ...(HAS_CONFIGURED_CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'FoodOPS',
      url: CANONICAL_SITE_URL,
      description:
        'Surplus food rescue coordination platform for commercial kitchens, verified NGOs, and riders in Pune and Pimpri-Chinchwad.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-foreground relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <FoodOpsBackground variant="hero" />
      <Navbar />

      <main id="main-content" className="flex-grow">
        <HeroSection />

        {/* Live ESG Balance Sheet backed by GET /api/stats */}
        <EsgMetrics />

        {/* Lazy-loaded illustrative workflow walkthrough */}
        <LazyHomeScenes />

        {/* Roadmap section */}
        <RoadmapSection />

        {/* Role Entry Points (F17) */}
        <section id="how-it-works" className="bg-surface border-t border-border py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
                Verification &amp; Logistics Roles
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display">
                How FoodOPS Works
              </h2>
              <p className="max-w-2xl mx-auto text-sm text-slate-700 leading-relaxed font-medium">
                FoodOPS coordinates donors, NGOs, and riders across Pune and Pimpri-Chinchwad. Choose your role to inspect verification steps before registering.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Donor */}
              <div className="bg-surface p-8 rounded-lg border border-border hover:border-primary/30 shadow-xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="w-11 h-11 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center text-[#0b3c26] mb-5">
                    <IconDonor className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground mb-2">
                    1. Donors: List Surplus
                  </h3>
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
                    Commercial kitchens declare safe-window surplus with weight and pickup deadline. On the roadmap: photo-assisted listing checks to estimate quantity and flag damaged packaging.
                  </p>
                </div>
                <Link
                  href="/for-donors"
                  className="text-[#0b3c26] font-bold text-xs sm:text-sm hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Explore Donor onboarding</span>
                  <IconArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* NGO */}
              <div className="bg-surface p-8 rounded-lg border border-border hover:border-primary/30 shadow-xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="w-11 h-11 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center text-[#0b3c26] mb-5">
                    <IconNgo className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground mb-2">
                    2. NGOs: Match &amp; Claim
                  </h3>
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
                    Verified NGOs are matched by service radius and food categories. First-accept database locks prevent two organisations from claiming the same listing.
                  </p>
                </div>
                <Link
                  href="/for-ngos"
                  className="text-[#0b3c26] font-bold text-xs sm:text-sm hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Explore NGO onboarding</span>
                  <IconArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Rider */}
              <div className="bg-surface p-8 rounded-lg border border-border hover:border-primary/30 shadow-xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="w-11 h-11 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center text-[#0b3c26] mb-5">
                    <IconRider className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground mb-2">
                    3. Riders: Transit &amp; Handover
                  </h3>
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
                    Assigned riders check container condition at pickup, verify the private one-time OTP provided by the donor, and log delivery at the receiving NGO point.
                  </p>
                </div>
                <Link
                  href="/for-riders"
                  className="text-[#0b3c26] font-bold text-xs sm:text-sm hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Explore Rider onboarding</span>
                  <IconArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
