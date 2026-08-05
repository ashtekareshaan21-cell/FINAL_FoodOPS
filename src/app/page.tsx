export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getAdminStats } from '@/app/actions/admin';

export default async function Home() {
  const stats = await getAdminStats();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden py-24 sm:py-32">
          {/* Decorative Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 opacity-30 dark:opacity-20 pointer-events-none -z-10">
            <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 blur-[120px]" />
            <div className="absolute -top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 animate-pulse">
                🌱 Climate-Tech Surplus Rescue Platform
              </span>
              <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                Surplus Food Recovery,{' '}
                <span className="block mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
                  Optimized
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Connecting commercial food donors, verified NGOs, and active rescue volunteers in real-time. Rescue food, reduce landfill methane emissions, and feed nearby communities.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-3.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-center"
                >
                  Join the Rescue Mission
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold rounded-xl text-zinc-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-900/80 backdrop-blur hover:bg-zinc-50 dark:hover:bg-zinc-800/80 shadow-sm border border-zinc-250 dark:border-zinc-850 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-center"
                >
                  Dashboard Access
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Live Impact Counter */}
        <div className="bg-white dark:bg-zinc-900/50 border-y border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/20">
                Environmental Balance Sheet
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Collective Climate & Rescue Impact
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Stat 1 */}
              <div className="group relative p-8 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200 dark:border-zinc-900 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Weight Rescued</span>
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {(stats.foodWeightKg || 0).toLocaleString()} kg
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Total surplus food recovered from landfills.</p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="group relative p-8 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200 dark:border-zinc-900 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Completed Rescues</span>
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {stats.completedRescues || 0}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Successful end-to-end collection missions.</p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="group relative p-8 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200 dark:border-zinc-900 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">CO₂e Diverted</span>
                  <span className="text-2xl">🌱</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {Math.round(stats.co2SavedKg || 0).toLocaleString()} kg
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Greenhouse gas emissions prevented.</p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="group relative p-8 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200 dark:border-zinc-900 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Water Saved</span>
                  <span className="text-2xl">💧</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {Math.round(stats.waterSavedLiters || 0).toLocaleString()} L
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Virtual water footprint conserved.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">
              The Food Recovery Ecosystem
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
              FoodOps connects key partners together seamlessly to ensure safety, reliability, and speed in redistribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Donor */}
            <div className="group bg-white dark:bg-zinc-900/60 p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/30 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">Surplus Food Donors</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                  Restaurants, wedding halls, caterers, and corporate kitchens list surplus food in seconds. Set pickup locations, details, servings, and expiration deadlines.
                </p>
              </div>
              <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm hover:underline inline-flex items-center gap-1">
                Register as Donor &rarr;
              </Link>
            </div>

            {/* NGO */}
            <div className="group bg-white dark:bg-zinc-900/60 p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-teal-500/30 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950/40 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">Verified NGOs</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                  NGOs within range check matching lists. Exclusively lock rescues via our first-claim concurrency architecture to prevent double booking.
                </p>
              </div>
              <Link href="/register" className="text-teal-600 dark:text-teal-400 font-semibold text-xs sm:text-sm hover:underline inline-flex items-center gap-1">
                Register as NGO &rarr;
              </Link>
            </div>

            {/* Volunteer */}
            <div className="group bg-white dark:bg-zinc-900/60 p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-blue-500/30 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">Rescue Volunteers</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                  Riders get alerts of assigned rescues. Access navigation tools, coordinates, and execute transparent collections from donor loading bays to NGO tables.
                </p>
              </div>
              <Link href="/register" className="text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm hover:underline inline-flex items-center gap-1">
                Join an NGO Team &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-zinc-100 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
          <p>&copy; {new Date().getFullYear()} FoodOps. Developed for the Climate Tech & Sustainability Hackathon.</p>
          <div className="flex gap-4 font-semibold">
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300">Compliance</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300">FSSAI Rules</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
