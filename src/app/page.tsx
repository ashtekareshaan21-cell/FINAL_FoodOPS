export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getAdminStats } from '@/app/actions/admin';

export default async function Home() {
  const stats = await getAdminStats();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Surplus Food Recovery,{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Optimized
                </span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-zinc-500 dark:text-zinc-400">
                Connecting commercial donors, verified NGOs, and active volunteers in real time to rescue surplus food, mitigate carbon emissions, and fight hunger.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all duration-200"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-base font-medium rounded-md text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all duration-200"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Live Impact Counter */}
        <div className="bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-full">
                Live Environmental & Rescue Metrics
              </span>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                FoodOps Platform Collective Impact
              </h2>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {(stats.foodWeightKg || 0).toLocaleString()} kg
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Food Rescued</p>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.completedRescues || 0}
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Completed Rescues</p>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {Math.round(stats.co2SavedKg || 0).toLocaleString()} kg
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">CO₂e Diverted</p>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {Math.round(stats.waterSavedLiters || 0).toLocaleString()} L
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Virtual Water Saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">How FoodOps Works</h2>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">An optimized flow bringing accountability and transparency to food recovery.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Donor */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Surplus Food Donors</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                  Restaurants, wedding venues, caterers, and corporate canteens list available surplus food within minutes. Pin exact coordinates, specify servings, preparation times, and pickup deadlines.
                </p>
              </div>
              <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline inline-flex items-center gap-1">
                Register as Donor &rarr;
              </Link>
            </div>

            {/* NGO */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Verified NGOs</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                  NGOs within the service radius receive instant notifications. Claim exclusive ownership of a rescue using our backend **First-Acceptance Locking** to prevent double-booking.
                </p>
              </div>
              <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline inline-flex items-center gap-1">
                Register as NGO &rarr;
              </Link>
            </div>

            {/* Volunteer */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Rescue Volunteers</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                  Receive pickup assignments from your NGO. Access donor addresses, pin locations, and track progress transparently from pickup to delivery.
                </p>
              </div>
              <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline inline-flex items-center gap-1">
                Join a registered NGO &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
          <p>&copy; {new Date().getFullYear()} FoodOps. Developed for the Climate Tech & Sustainability Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}
