import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '@/components/PublicPageShell';
import { IconRider, IconCheck, IconArrowRight } from '@/components/Icons';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'For Riders',
  description:
    'Onboarding prerequisites, NGO affiliation, OTP pickup verification, and delivery expectations for rescue riders on FoodOPS.',
  alternates: { canonical: '/for-riders' },
};

const EXPECTATIONS = [
  'Operate a two-wheeler, bicycle, three-wheeler, car, or van in Pune or Pimpri-Chinchwad with an emergency contact number on file.',
  'Link during signup to an existing NGO registered on FoodOPS that coordinates your pickups and drop-offs.',
  'Verify the donor pickup code in person at handover before collecting food and keep transit clean and protected.',
  'Target end-to-end collection and delivery within short local windows (under 45 minutes where traffic allows) and confirm completion at the NGO base.',
];

export default function ForRidersPage() {
  return (
    <PublicPageShell
      eyebrow="Rescue Rider Guide"
      title="For Volunteer and Fleet Riders"
      subtitle="Help carry packed surplus food safely from donor kitchens to verified NGOs across Pune and Pimpri-Chinchwad."
      icon={<IconRider className="w-5 h-5" />}
    >
      <section aria-labelledby="rider-expectations" className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 id="rider-expectations" className="text-xl font-bold text-slate-900">
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

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
        <h2 className="text-base font-bold text-slate-900">No-fee NGO linkage</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Riders register directly under an affiliated NGO on FoodOPS so dispatchers can assign active pickups safely. If your NGO has not registered yet, ask an NGO coordinator to sign up first via{' '}
          <Link href="/for-ngos" className="font-semibold text-[#047857] hover:underline">
            For NGOs
          </Link>
          .
        </p>
      </section>

      <div className="pt-2">
        <Link
          href="/register?role=rider"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold shadow-sm"
        >
          <span>Register as a Rider</span>
          <IconArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </PublicPageShell>
  );
}
