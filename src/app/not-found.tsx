import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import { IconAlert, IconArrowRight } from '@/components/Icons';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 flex flex-col relative">
      <FoodOpsBackground variant="dashboard" />
      <Navbar />
      <main
        id="main-content"
        className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="max-w-xl w-full rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-xs space-y-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
            <IconAlert className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#047857]">
              HTTP 404
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              This page does not exist
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed max-w-md mx-auto">
              The address you requested could not be found on FoodOPS. Use one of the pages below to continue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href="/"
              className="btn-primary px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <span>Home</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#how-it-works"
              className="btn-secondary px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center"
            >
              How it works
            </Link>
            <Link
              href="/contact"
              className="btn-secondary px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center"
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="btn-secondary px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
