import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import { getAvatarGradient, getInitials } from '@/lib/ui';

export default async function Navbar() {
  const session = await getSession();
  const userGrad = session ? getAvatarGradient(session.email) : '';
  const userInit = session ? getInitials(session.email) : '';

  return (
    <nav className="sticky top-0 z-50 bg-white/90 border-b border-zinc-200 dark:bg-zinc-950/90 dark:border-zinc-850/80 backdrop-blur-md shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400 tracking-tight">
                  FoodOps
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-850">
                  MVP
                </span>
              </Link>
            </div>

            {/* Navigation links based on role */}
            {session && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6 items-center">
                {session.role === 'DONOR' && (
                  <>
                    <Link
                      href="/donor"
                      className="border-b-2 border-emerald-500 text-zinc-950 dark:text-zinc-50 inline-flex items-center px-1 pt-1 text-sm font-semibold h-16 transition-all"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/donor/create"
                      className="border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-200 inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-all"
                    >
                      New Donation
                    </Link>
                  </>
                )}
                {session.role === 'NGO' && (
                  <>
                    <Link
                      href="/ngo"
                      className="border-b-2 border-emerald-500 text-zinc-950 dark:text-zinc-50 inline-flex items-center px-1 pt-1 text-sm font-semibold h-16 transition-all"
                    >
                      Accept Donations
                    </Link>
                    <Link
                      href="/ngo/active"
                      className="border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-200 inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-all"
                    >
                      Active Rescues
                    </Link>
                    <Link
                      href="/ngo/history"
                      className="border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-200 inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-all"
                    >
                      History
                    </Link>
                  </>
                )}
                {session.role === 'VOLUNTEER' && (
                  <Link
                    href="/volunteer"
                    className="border-b-2 border-emerald-500 text-zinc-950 dark:text-zinc-50 inline-flex items-center px-1 pt-1 text-sm font-semibold h-16 transition-all"
                  >
                    My Pickups
                  </Link>
                )}
                {session.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin"
                      className="border-b-2 border-emerald-500 text-zinc-950 dark:text-zinc-50 inline-flex items-center px-1 pt-1 text-sm font-semibold h-16 transition-all"
                    >
                      Verifications
                    </Link>
                    <Link
                      href="/admin/data"
                      className="border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-200 inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-all"
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
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider leading-none">Logged In</p>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                    {session.email}
                  </p>
                </div>
                
                {/* Circular Profile Avatar Badge */}
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${userGrad} text-white font-bold text-xs flex items-center justify-center shadow-inner`}>
                  {userInit}
                </div>

                <form action={logout}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm text-xs font-bold text-zinc-700 dark:text-zinc-250 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-250 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4.5 py-2 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-emerald-500/10 transition-colors"
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
