import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '@/components/PublicPageShell';
import { IconLock } from '@/components/Icons';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Plain-language pilot Terms of Use covering surplus donor listings, NGO verification, rider handover, and platform responsibilities on FoodOPS.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Platform Rules"
      title="Terms of Use"
      subtitle="Expectations for donors, verified NGOs, and volunteer riders participating in the FoodOPS pilot."
      icon={<IconLock className="w-5 h-5" />}
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 font-medium leading-relaxed">
        Plain-language pilot document: these terms describe expected operating responsibilities during the FoodOPS pilot. They have not yet been reviewed by legal counsel and do not constitute formal legal advice.
      </div>

      <section className="space-y-4">
        <article className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Donor responsibilities</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Donors agree to list only safe, freshly held surplus food in clean containers, state accurate dietary categories, quantities, and expiry windows, and release orders only after confirming the one-time pickup code with the assigned rider.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. NGO and rider responsibilities</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            NGOs maintain active legal and FSSAI compliance where applicable, keep operating hours and coverage radii accurate, dispatch verified riders promptly, and inspect food on arrival before community distribution. Unfit batches must not be distributed as human meals.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Pilot availability and moderation</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            FoodOPS provides coordination software on an as-is pilot basis in Pune and Pimpri-Chinchwad. Accounts that submit inaccurate registration records, falsified handovers, or unsafe listings may be suspended by administrators.
          </p>
        </article>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/privacy" className="btn-secondary px-5 py-2.5 text-sm font-semibold">
          Privacy Policy
        </Link>
        <Link href="/food-safety" className="btn-secondary px-5 py-2.5 text-sm font-semibold">
          Food Safety and FSSAI Guidance
        </Link>
        <Link href="/contact" className="btn-primary px-5 py-2.5 text-sm font-semibold">
          Contact Team
        </Link>
      </div>
    </PublicPageShell>
  );
}
