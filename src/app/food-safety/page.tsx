import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '@/components/PublicPageShell';
import { IconShield } from '@/components/Icons';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Food Safety and FSSAI Guidance',
  description:
    'Surplus food eligibility, packing, temperature discipline, handover checks, and official FSSAI Surplus Food guidance for FoodOPS partners.',
  alternates: { canonical: '/food-safety' },
};

const HANDLING_RULES = [
  {
    title: 'Eligible surplus food only',
    body: 'Publish freshly prepared, unserved kitchen surplus, sealed bakery items, fruits and vegetables, dry rations, or commercially packaged food well within best-before dates. Do not list plated leftovers or food with altered smell, texture, or appearance.',
  },
  {
    title: 'Clean containers and dietary labeling',
    body: 'Pack items in clean, covered, food-grade containers separated cleanly by Veg, Non-Veg, and allergen notes before the rider arrives.',
  },
  {
    title: 'Time window and temperature discipline',
    body: 'Pilot rescues target pickup and handover within short local windows (under 45 minutes end-to-end where traffic allows). Keep cooked hot food covered and perishables protected from ambient heat prior to dispatch.',
  },
  {
    title: 'Handover verification and recipient inspection',
    body: 'Riders confirm handover via the donor one-time pickup code. The receiving NGO visually inspects containers, temperature suitability, and freshness upon arrival before distributing meals, or records organic diversion if a batch exceeds safe holding time.',
  },
];

export default function FoodSafetyPage() {
  return (
    <PublicPageShell
      eyebrow="Safe Surplus Handling"
      title="Food Safety and FSSAI Guidance"
      subtitle="Practical food-handling expectations for donors, riders, and NGOs operating under India's surplus food recovery framework."
      icon={<IconShield className="w-5 h-5" />}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Pilot disclaimer</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          This page summarizes FoodOPS operational guidance aligned with the Food Safety and Standards Authority of India (FSSAI) Recovery and Distribution of Surplus Food framework. Participating organizations remain responsible for holding required FSSAI registrations or licenses and exercising physical food inspection at handover.
        </p>
        <p className="text-sm">
          <a
            href="https://www.fssai.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#047857] hover:underline"
          >
            Official FSSAI portal (fssai.gov.in)
          </a>
        </p>
      </div>

      <section aria-labelledby="guidelines-heading" className="space-y-4">
        <h2 id="guidelines-heading" className="text-xl font-bold text-slate-900">
          Partner food handling standards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HANDLING_RULES.map((rule) => (
            <article key={rule.title} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
              <h3 className="text-base font-bold text-slate-900">{rule.title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{rule.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 space-y-2">
        <h2 className="text-base font-bold text-[#0b3c26]">
          How FoodOPS handles expired or unsafe batches
        </h2>
        <p className="text-sm text-slate-800 leading-relaxed">
          Any batch whose pickup deadline passes uncollected or fails condition review can be escalated to organic recovery / biogas diversion inside the NGO dashboard. Diverted organic weight is tracked strictly separate from completed edible meal rescues.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/compliance" className="btn-secondary px-5 py-2.5 text-sm font-semibold">
          Read Operating Compliance Process
        </Link>
        <Link href="/for-donors" className="btn-primary px-5 py-2.5 text-sm font-semibold">
          Donor Expectations
        </Link>
      </div>
    </PublicPageShell>
  );
}
