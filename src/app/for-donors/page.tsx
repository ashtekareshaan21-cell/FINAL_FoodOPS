import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '@/components/PublicPageShell';
import { IconDonor, IconCheck, IconArrowRight } from '@/components/Icons';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'For Donors',
  description:
    'Surplus food donation expectations, pickup verification, and onboarding for kitchens, hotels, caterers, and canteens in Pune and Pimpri-Chinchwad.',
  alternates: { canonical: '/for-donors' },
};

const EXPECTATIONS = [
  'Operate a commercial kitchen, hotel, bakery, corporate canteen, caterer, or verified donor location in Pune or Pimpri-Chinchwad.',
  'List only fresh, unserved surplus packaged cleanly in covered containers with accurate veg / non-veg labels and pickup deadline.',
  'Confirm your pickup address coordinates and contact phone number (verified via OTP before publishing).',
  'Verify the one-time pickup code shown in your donor dashboard before handing meals over to the assigned rider.',
];

export default function ForDonorsPage() {
  return (
    <PublicPageShell
      eyebrow="Surplus Donor Guide"
      title="For Surplus Food Donors"
      subtitle="Share excess prepared meals and packaged food cleanly with verified nearby NGOs in Pune and Pimpri-Chinchwad."
      icon={<IconDonor className="w-5 h-5" />}
    >
      <section aria-labelledby="donor-expectations" className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 id="donor-expectations" className="text-xl font-bold text-slate-900">
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
        <h2 className="text-base font-bold text-slate-900">How pickup accounting works</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Only verified deliveries completed to the receiving NGO count toward completed rescues. Listings that expire before pickup can be logged under organic diversion separately, keeping your kitchen impact reports accurate.
        </p>
        <p className="text-xs text-slate-600 pt-1">
          Please also review{' '}
          <Link href="/food-safety" className="font-semibold text-[#047857] hover:underline">
            Food Safety and FSSAI Guidance
          </Link>
          .
        </p>
      </section>

      <div className="pt-2">
        <Link
          href="/register?role=donor"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold shadow-sm"
        >
          <span>Register as a Donor</span>
          <IconArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </PublicPageShell>
  );
}
