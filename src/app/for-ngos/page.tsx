import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '@/components/PublicPageShell';
import { IconNgo, IconCheck, IconArrowRight } from '@/components/Icons';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'For NGOs',
  description:
    'Verification rules, coverage radius configuration, and rider dispatch workflow for NGOs receiving surplus food on FoodOPS.',
  alternates: { canonical: '/for-ngos' },
};

const EXPECTATIONS = [
  'Operate an active community shelter, kitchen, or charitable trust serving Pune or Pimpri-Chinchwad.',
  'New NGO accounts start in PENDING status until an administrator verifies your FSSAI registration / license reference and organization contacts.',
  'Set your base coordinates, service coverage radius (2 to 25 km), accepted food categories, and availability status.',
  'Inspect delivered batches physically on arrival, close handovers accurately, and escalate spoiled or overdue batches to organic recovery.',
];

export default function ForNgosPage() {
  return (
    <PublicPageShell
      eyebrow="Verified NGO Partner Guide"
      title="For NGOs and Community Kitchens"
      subtitle="Claim nearby surplus food listings within your operating radius, dispatch linked riders, and log verified distribution."
      icon={<IconNgo className="w-5 h-5" />}
    >
      <section aria-labelledby="ngo-expectations" className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 id="ngo-expectations" className="text-xl font-bold text-slate-900">
          What to expect before you register
        </h2>
        <ul className="space-y-3 text-sm text-slate-700">
          {EXPECTATIONS.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 text-[#047857] flex-shrink-0">
                <IconCheck className="w-5 h-5" />
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
        <h2 className="text-base font-bold text-amber-950">Verification timeline note</h2>
        <p className="text-sm text-amber-950 leading-relaxed">
          We check new NGO accounts manually against submitted registration / FSSAI license details before granting permission to claim food. Read more on our{' '}
          <Link href="/compliance" className="font-semibold underline">
            Compliance page
          </Link>
          .
        </p>
      </section>

      <div className="pt-2">
        <Link
          href="/register?role=ngo"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold shadow-sm"
        >
          <span>Register as an NGO</span>
          <IconArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </PublicPageShell>
  );
}
