import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '@/components/PublicPageShell';
import { IconLeaf } from '@/components/Icons';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About',
  description:
    'About FoodOPS: our mission in Pune and Pimpri-Chinchwad, transparent pilot status, and honest rescue accounting.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="Mission & Stage"
      title="About FoodOPS"
      subtitle="FoodOPS coordinates time-sensitive surplus food rescue between donors, verified NGOs, and volunteer riders in Pune and Pimpri-Chinchwad."
      icon={<IconLeaf className="w-5 h-5" />}
    >
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0b3c26]">
          Pilot Status
        </p>
        <h2 className="text-lg font-bold text-slate-900">
          Core rescue flow - BUILT, entering pilot.
        </h2>
        <p className="text-sm text-slate-800 leading-relaxed">
          We publish our public rescue counter directly from our live database (`0` completed rescues until real pilot rescues finish) rather than showing placeholder or synthetic counts on production pages.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
          <h2 className="text-base font-bold text-slate-900">Why FoodOPS exists</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Commercial kitchens, events, and cafeterias frequently end service with safe, unserved meals while community shelters lack predictable last-mile pickup. FoodOPS links proximity matching, pickup deadlines, NGO verification, and rider handover confirmation in one ledger.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
          <h2 className="text-base font-bold text-slate-900">How we label numbers</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Every figure published by FoodOPS is tagged as <strong>REAL DATA</strong> (database counts of completed rescues), <strong>ESTIMATED IMPACT</strong> (derived using standard IPCC/WRI 2.5 kg CO2e per kg diverted food), or <strong>SIMULATED</strong> (example walkthroughs separated on the demo environment).
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/for-donors" className="btn-primary px-5 py-2.5 text-sm font-semibold">
          Join Pilot as Donor
        </Link>
        <Link href="/for-ngos" className="btn-secondary px-5 py-2.5 text-sm font-semibold">
          Join Pilot as NGO
        </Link>
        <Link href="/contact" className="btn-secondary px-5 py-2.5 text-sm font-semibold">
          Contact Team
        </Link>
      </div>
    </PublicPageShell>
  );
}
