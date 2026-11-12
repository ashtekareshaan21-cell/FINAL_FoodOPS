import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '@/components/PublicPageShell';
import { IconPin } from '@/components/Icons';
import { CONTACT_EMAIL, HAS_CONFIGURED_CONTACT_EMAIL } from '@/lib/siteConfig';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact the FoodOPS team in Pune and Pimpri-Chinchwad for donor onboarding, NGO verification, rider support, or data requests.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Team Contact"
      title="Contact FoodOPS"
      subtitle="Reach our pilot coordination team in Pune and Pimpri-Chinchwad for partner onboarding, verification questions, or privacy requests."
      icon={<IconPin className="w-5 h-5" />}
    >
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Direct Team Email</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Write directly to our monitored team inbox. We reply within two working days.
        </p>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <span className="font-semibold text-slate-900">Email: </span>
          {HAS_CONFIGURED_CONTACT_EMAIL ? (
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-[#047857] hover:underline break-all"
            >
              {CONTACT_EMAIL}
            </a>
          ) : (
            <span className="font-mono text-xs bg-white border border-slate-300 px-2 py-1 rounded text-slate-900">
              {CONTACT_EMAIL}
            </span>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
          <h2 className="text-base font-bold text-slate-900">Partner Onboarding & Verification</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            For NGOs waiting on FSSAI verification approval or kitchens in Pune and Pimpri-Chinchwad setting up pilot surplus handovers, include your organization name, registered email, and locality.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
          <h2 className="text-base font-bold text-slate-900">Safety, Corrections & Data Requests</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Use the team email above to report a food-handling incident, request account removal, or verify public pilot statistics. Base city: Pune, Maharashtra.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/register" className="btn-primary px-5 py-2.5 text-sm font-semibold">
          Create an Account
        </Link>
        <Link href="/compliance" className="btn-secondary px-5 py-2.5 text-sm font-semibold">
          Review Verification Process
        </Link>
      </div>
    </PublicPageShell>
  );
}
