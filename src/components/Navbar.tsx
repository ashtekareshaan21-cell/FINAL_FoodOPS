import Link from 'next/link';
import { getSession, isAdminPortalEnabled } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import { getAvatarGradient, getInitials } from '@/lib/ui';
import NavbarLinks from './NavbarLinks';

export default async function Navbar() {
  const session = await getSession();
  const userGrad = session ? getAvatarGradient(session.email) : '';
  const userInit = session ? getInitials(session.email) : '';
  const adminEnabled = isAdminPortalEnabled();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Brand Logo & Platform Title */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-[#0b3c26] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-[#062b1b] transition-colors">
                  🌱
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-[#0b3c26] tracking-tight font-display leading-none">
                    Food<span className="text-[#10b981]">OPS</span>
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase mt-0.5">
                    SURPLUS RESCUE & RECOVERY
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation links based on role */}
            {session && (
              <NavbarLinks role={session.role} adminEnabled={adminEnabled} />
            )}
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border tracking-wider uppercase ${
                    session.role === 'DONOR' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    session.role === 'NGO' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                    session.role === 'VOLUNTEER' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {session.role}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {session.email}
                  </p>
                </div>
                
                {/* Circular Profile Avatar Badge */}
                <div className="w-8 h-8 rounded-full bg-[#0b3c26] text-white font-bold text-xs flex items-center justify-center ring-2 ring-emerald-400/30 shadow-xs">
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
                  className="btn-secondary px-4 py-2 text-sm font-semibold border-slate-200 hover:border-slate-300"
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
