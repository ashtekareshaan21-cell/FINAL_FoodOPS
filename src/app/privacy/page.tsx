import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '@/components/PublicPageShell';
import { IconLock } from '@/components/Icons';
import { CONTACT_EMAIL, HAS_CONFIGURED_CONTACT_EMAIL } from '@/lib/siteConfig';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Plain-language summary of what personal and organizational information FoodOPS stores during its Pune pilot and how you can request updates or deletion.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy Notice"
      title="Privacy Policy"
      subtitle="Plain-language explanation of the account, location, and rescue ledger data processed by FoodOPS."
      icon={<IconLock className="w-5 h-5" />}
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 font-medium leading-relaxed">
        Plain-language pilot document: this privacy notice describes current software behavior during the FoodOPS pilot and has not yet been reviewed by external legal counsel.
      </div>

      <section className="space-y-4">
        <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Information collected by role</h2>
          <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
            <li>
              <strong>Account credentials:</strong> email address, phone number (verified via OTP before donor publishing), password hash (stored using bcrypt, never plaintext), and role (`DONOR`, `NGO`, `VOLUNTEER`, or `ADMIN`).
            </li>
            <li>
              <strong>Donors & NGOs:</strong> organization name, facility/base address and coordinates for proximity matching, contact person name, FSSAI/registration details provided during NGO verification, and surplus batch records.
            </li>
            <li>
              <strong>Volunteer & fleet riders:</strong> full name, affiliated NGO link, vehicle category, operating area, emergency contact, and rescue handover timestamps.
            </li>
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Cookies and telemetry</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Authenticated sessions use a strictly necessary HttpOnly session cookie (`foodops_session`). FoodOPS does not serve cross-site advertising cookies. On production deployments, aggregate Web Vitals and traffic analytics may be recorded via Vercel Analytics and Speed Insights.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Database hosting and backups</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            FoodOPS uses Prisma ORM (`prisma/schema.prisma`, configured with SQLite for local development and switched to PostgreSQL via `prisma/prepare.js` when a `postgresql://` `DATABASE_URL` is configured). The web application is deployed on Vercel.
          </p>
          <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3 font-medium">
            Production Postgres host, hosting region, and automated backup schedule:{' '}
            <span className="font-mono text-xs bg-white border border-slate-300 px-1.5 py-0.5 rounded">
              [TEAM TO INSERT: verified Vercel DATABASE_URL Postgres provider/region, automated backup/retention policy, and data-controller owner]
            </span>
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Access, corrections, and deletion requests</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Partners and volunteers may request data export, correction, or account deletion by writing to{' '}
            {HAS_CONFIGURED_CONTACT_EMAIL ? (
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#047857] hover:underline">
                {CONTACT_EMAIL}
              </a>
            ) : (
              <span className="font-mono text-xs bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                {CONTACT_EMAIL}
              </span>
            )}
            . We reply within two working days.
          </p>
        </article>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/terms" className="btn-secondary px-5 py-2.5 text-sm font-semibold">
          Terms of Use
        </Link>
        <Link href="/contact" className="btn-primary px-5 py-2.5 text-sm font-semibold">
          Contact Team
        </Link>
      </div>
    </PublicPageShell>
  );
}
