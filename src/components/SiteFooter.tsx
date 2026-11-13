import Link from 'next/link';
import { IconBrandMark } from './Icons';
import {
  CONTACT_EMAIL,
  HAS_CONFIGURED_CONTACT_EMAIL,
} from '@/lib/siteConfig';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1 - FoodOPS */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2 text-foreground font-extrabold text-base tracking-tight">
              <span className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center">
                <IconBrandMark className="w-4 h-4" />
              </span>
              <span>FoodOPS</span>
            </Link>
            <p className="text-xs text-slate-700 leading-relaxed">
              Surplus food rescue in Pune and Pimpri-Chinchwad. Pilot stage - first partners onboarding.
            </p>
            <p className="text-xs font-semibold text-foreground">
              Base city: Pune, Maharashtra
            </p>
          </div>

          {/* Column 2 - Explore */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Explore
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li>
                <Link href="/#how-it-works" className="hover:text-primary hover:underline">
                  How FoodOPS Works
                </Link>
              </li>
              <li>
                <Link href="/for-donors" className="hover:text-primary hover:underline">
                  For Donors
                </Link>
              </li>
              <li>
                <Link href="/for-ngos" className="hover:text-primary hover:underline">
                  For NGOs
                </Link>
              </li>
              <li>
                <Link href="/for-riders" className="hover:text-primary hover:underline">
                  For Riders
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary hover:underline">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Trust */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Trust
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li>
                <Link href="/food-safety" className="hover:text-primary hover:underline">
                  Food Safety and FSSAI Guidance
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:text-primary hover:underline">
                  Compliance
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary hover:underline">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div className="space-y-2.5 text-xs text-slate-700">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Contact
            </h3>
            <p>
              <span className="font-semibold text-foreground">Email: </span>
              {HAS_CONFIGURED_CONTACT_EMAIL ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-semibold hover:underline break-all">
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-900">
                  {CONTACT_EMAIL}
                </span>
              )}
            </p>
            <p>
              <Link href="/contact" className="text-primary font-semibold hover:underline">
                Contact page
              </Link>
            </p>
            <p className="text-slate-700">
              We reply within two working days.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-700">
          <p>&copy; {year} Eshaan Ashtekar / Team KALPAVAT - FoodOPS. All rights reserved. Pune, Maharashtra.</p>
          <p className="font-medium">
            Impact figures on this site are labelled REAL DATA, ESTIMATED IMPACT or SIMULATED.
          </p>
        </div>
      </div>
    </footer>
  );
}
