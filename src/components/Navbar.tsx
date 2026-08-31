import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import { getAvatarGradient, getInitials } from '@/lib/ui';

export default async function Navbar() {
  const session = await getSession();
  const userGrad = session ? getAvatarGradient(session.email) : '';
  const userInit = session ? getInitials(session.email) : '';

  return (
    <nav className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#0f2942] tracking-tight font-display">
                  FoodOPS
                </span>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 tracking-widest uppercase">
                  OPERATIONAL PLATFORM
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
                      className="border-b-2 border-[#0f2942] text-[#0f2942] inline-flex items-center px-1 pt-1 text-sm font-semibold h-16 transition-all"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/donor/create"
                      className="border-b-2 border-transparent text-slate-600 hover:text-[#0f2942] inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-all"
                    >
                      New Surplus Listing
                    </Link>
                  </>
                )}
                {session.role === 'NGO' && (
                  <>
                    <Link
                      href="/ngo"
                      className="border-b-2 border-[#0f2942] text-[#0f2942] inline-flex items-center px-1 pt-1 text-sm font-semibold h-16 transition-all"
                    >
                      Accept Surplus
                    </Link>
                    <Link
                      href="/ngo/active"
                      className="border-b-2 border-transparent text-slate-600 hover:text-[#0f2942] inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-all"
                    >
                      Active Rescues
                    </Link>
                    <Link
                      href="/ngo/history"
                      className="border-b-2 border-transparent text-slate-600 hover:text-[#0f2942] inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-all"
                    >
                      Rescue History
                    </Link>
                  </>
                )}
                {session.role === 'VOLUNTEER' && (
                  <Link
                    href="/volunteer"
                    className="border-b-2 border-[#0f2942] text-[#0f2942] inline-flex items-center px-1 pt-1 text-sm font-semibold h-16 transition-all"
                  >
                    Assigned Pickups
                  </Link>
                )}
                {session.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin"
                      className="border-b-2 border-[#0f2942] text-[#0f2942] inline-flex items-center px-1 pt-1 text-sm font-semibold h-16 transition-all"
                    >
                      Overview & Verifications
                    </Link>
                    <Link
                      href="/admin/data"
                      className="border-b-2 border-transparent text-slate-600 hover:text-[#0f2942] inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-all"
                    >
                      Data Browser & Recovery
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
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 tracking-wider uppercase">
                    {session.role}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {session.email}
                  </p>
                </div>
                
                {/* Circular Profile Avatar Badge */}
                <div className={`w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                  {userInit}
                </div>

                <form action={logout}>
                  <button
                    type="submit"
                    className="btn-secondary px-3 py-1.5 text-xs font-semibold"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="btn-secondary px-4 py-2 text-sm font-semibold shadow-none border-transparent hover:bg-slate-100"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn-primary px-4.5 py-2 text-sm font-semibold shadow-xs"
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
