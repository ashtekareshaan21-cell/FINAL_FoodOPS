import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '@/components/PublicPageShell';
import { IconShield, IconCheck } from '@/components/Icons';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Compliance',
  description:
    'FoodOPS pilot operating process for NGO verification, food safety checks, pickup verification, and audit logging.',
  alternates: { canonical: '/compliance' },
};

const PROCESS_STEPS = [
  {
    title: 'NGO registration and FSSAI review before claiming',
    detail:
      'Every NGO account starts in PENDING review status. Administrators inspect the submitted registration or FSSAI license reference and contact details before moving the organization to VERIFIED. Unverified organizations cannot claim surplus listings.',
  },
  {
    title: 'Structured listing declaration and expiry window',
    detail:
      'Donors record food category, vegetarian/non-vegetarian/mixed classification, quantity, allergen notes, pickup location coordinates, and the safe pickup deadline before publishing a listing.',
  },
  {
    title: 'One-time donor pickup code at handover',
    detail:
      'At collection, the donor sees a time-bound one-time pickup verification code in their authenticated dashboard. The assigned rider confirms that code with the donor to transition the consignment into transit.',
  },
  {
    title: 'Immutable status history and spoilage diversion tracking',
    detail:
      'Pickup acceptance, rider assignment, OTP verification, final NGO delivery completion, cancellations, and expired-batch organic diversion events are logged separately so completed food rescues are never conflated with diverted waste.',
  },
];

export default function CompliancePage() {
  return (
    <PublicPageShell
      eyebrow="Operating Process"
      title="Compliance and Verification Workflow"
      subtitle="FoodOPS is in pilot. This page describes our operating process; it is not a regulatory certification."
      icon={<IconShield className="w-5 h-5" />}
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 font-medium leading-relaxed">
        FoodOPS is in pilot. This page describes our operating process; it is not a regulatory certification.
      </div>

      <section aria-labelledby="process-heading" className="space-y-4">
        <h2 id="process-heading" className="text-xl font-bold text-slate-900">
          What is enforced in the software today
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {PROCESS_STEPS.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-2"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-[#047857] flex-shrink-0">
                  <IconCheck className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed pl-7">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="roadmap-heading" className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 id="roadmap-heading" className="text-lg font-bold text-slate-900">
          What is planned vs. in pilot
        </h2>
        <ul className="space-y-2.5 text-sm text-slate-700 list-disc pl-5">
          <li>
            <strong>Food safety and temperature checks:</strong> physical condition and storage temperature remain the responsibility of the donor kitchen and receiving NGO at handover. FoodOPS does not read live IoT temperature hardware during pilot.
          </li>
          <li>
            <strong>Photo-assisted listing checks:</strong> advisory photo analysis is available only as a roadmap/pre-listing helper and never replaces human inspection before serving.
          </li>
          <li>
            <strong>External audit and third-party certification:</strong> no independent audit seal or regulatory accreditation is claimed at this stage.
          </li>
        </ul>
      </section>

      <section className="flex flex-wrap gap-3 pt-2">
        <Link href="/food-safety" className="btn-primary px-5 py-2.5 text-sm font-semibold">
          Food Safety and FSSAI Guidance
        </Link>
        <Link href="/contact" className="btn-secondary px-5 py-2.5 text-sm font-semibold">
          Contact Team
        </Link>
      </section>
    </PublicPageShell>
  );
}
