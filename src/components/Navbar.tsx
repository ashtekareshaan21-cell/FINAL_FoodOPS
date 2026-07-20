import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { logout } from '@/app/actions/auth';

export default async function Navbar() {
  const session = await getSession();

  return (
    <nav className="bg-white border-b border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  FoodOps
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  MVP
                </span>
              </Link>
            </div>

            {/* Navigation links based on role */}
            {session && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
                {session.role === 'DONOR' && (
                  <>
                    <Link
                      href="/donor"
                      className="border-b-2 border-emerald-500 text-zinc-950 dark:text-zinc-50 inline-flex items-center px-1 pt-1 text-sm font-medium h-16"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/donor/create"
                      className="border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 inline-flex items-center px-1 pt-1 text-sm font-medium h-16"
                    >
                      New Donation
                    </Link>
                  </>
                )}
                {session.role === 'NGO' && (
                  <>
                    <Link
                      href="/ngo"
                      className="border-b-2 border-emerald-500 text-zinc-950 dark:text-zinc-50 inline-flex items-center px-1 pt-1 text-sm font-medium h-16"
                    >
                      Accept Donations
                    </Link>
                    <Link
                      href="/ngo/active"
                      className="border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 inline-flex items-center px-1 pt-1 text-sm font-medium h-16"
                    >
                      Active Rescues
                    </Link>
                    <Link
                      href="/ngo/history"
                      className="border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 inline-flex items-center px-1 pt-1 text-sm font-medium h-16"
                    >
                      History
                    </Link>
                  </>
                )}
                {session.role === 'VOLUNTEER' && (
                  <Link
                    href="/volunteer"
                    className="border-b-2 border-emerald-500 text-zinc-950 dark:text-zinc-50 inline-flex items-center px-1 pt-1 text-sm font-medium h-16"
                  >
                    My Pickups
                  </Link>
                )}
                {session.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin"
                      className="border-b-2 border-emerald-500 text-zinc-950 dark:text-zinc-50 inline-flex items-center px-1 pt-1 text-sm font-medium h-16"
                    >
                      Verifications
                    </Link>
                    <Link
                      href="/admin/data"
                      className="border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 inline-flex items-center px-1 pt-1 text-sm font-medium h-16"
                    >
                      Browse Data
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Logged in as</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {session.email} ({session.role})
                  </p>
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
