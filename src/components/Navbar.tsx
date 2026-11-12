import Link from 'next/link';
import { IconBrandMark } from './Icons';
import { IS_DEMO_MODE } from '@/lib/siteConfig';
import NavbarClientAuth from './NavbarClientAuth';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-xs transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-[#0b3c26] focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-emerald-500"
      >
        Skip to main content
      </a>

      {IS_DEMO_MODE ? (
        <div
          role="note"
          className="bg-amber-100 border-b border-amber-300 text-amber-950 text-center py-1.5 px-4 text-xs font-bold tracking-wide"
        >
          FoodOPS Demo - sample data only.
        </div>
      ) : null}

      <nav aria-label="Primary navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <span className="w-8 h-8 rounded-lg bg-[#0b3c26] text-white flex items-center justify-center shadow-xs group-hover:bg-[#062b1b] transition-colors">
                <IconBrandMark className="w-5 h-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-xl font-bold text-[#0b3c26] tracking-tight font-display leading-none">
                  Food<span className="text-emerald-700">OPS</span>
                </span>
                <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase mt-0.5">
                  Surplus Rescue Logistics
                </span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-700">
              <Link href="/#how-it-works" className="hover:text-[#0b3c26] transition-colors">
                How FoodOPS Works
              </Link>
              <Link href="/for-donors" className="hover:text-[#0b3c26] transition-colors">
                For Donors
              </Link>
              <Link href="/for-ngos" className="hover:text-[#0b3c26] transition-colors">
                For NGOs
              </Link>
              <Link href="/for-riders" className="hover:text-[#0b3c26] transition-colors">
                For Riders
              </Link>
              <Link href="/food-safety" className="hover:text-[#0b3c26] transition-colors">
                Food Safety
              </Link>
            </div>
          </div>

          <NavbarClientAuth />
        </div>
      </nav>
    </header>
  );
}
