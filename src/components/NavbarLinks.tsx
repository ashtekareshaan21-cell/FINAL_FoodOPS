'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarLinksProps {
  role: string;
  adminEnabled: boolean;
}

export default function NavbarLinks({ role, adminEnabled }: NavbarLinksProps) {
  const pathname = usePathname();

  const getLinkClasses = (href: string, exact = false) => {
    const isActive = exact 
      ? pathname === href 
      : pathname === href || (href !== '/' && pathname.startsWith(href));

    return isActive
      ? 'border-b-2 border-[#0b3c26] text-[#0b3c26] inline-flex items-center px-1 pt-1 text-sm font-semibold h-16 transition-all'
      : 'border-b-2 border-transparent text-slate-600 hover:text-[#0b3c26] inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-all';
  };

  return (
    <div className="hidden sm:ml-8 sm:flex sm:space-x-6 items-center">
      {role === 'DONOR' && (
        <>
          <Link
            href="/donor"
            className={getLinkClasses('/donor', true)}
          >
            Dashboard
          </Link>
          <Link
            href="/donor/create"
            className={getLinkClasses('/donor/create')}
          >
            New Surplus Listing
          </Link>
        </>
      )}

      {role === 'NGO' && (
        <>
          <Link
            href="/ngo"
            className={getLinkClasses('/ngo', true)}
          >
            Accept Surplus
          </Link>
          <Link
            href="/ngo/active"
            className={getLinkClasses('/ngo/active')}
          >
            Active Rescues & Monitor
          </Link>
          <Link
            href="/ngo/volunteers"
            className={getLinkClasses('/ngo/volunteers')}
          >
            Volunteers & Fleet
          </Link>
          <Link
            href="/ngo/recovery"
            className={getLinkClasses('/ngo/recovery')}
          >
            Organic Recovery
          </Link>
          <Link
            href="/ngo/history"
            className={getLinkClasses('/ngo/history')}
          >
            Rescue History
          </Link>
        </>
      )}

      {role === 'VOLUNTEER' && (
        <Link
          href="/volunteer"
          className={getLinkClasses('/volunteer')}
        >
          Assigned Pickups
        </Link>
      )}

      {process.env.NODE_ENV === 'development' && role === 'ADMIN' && adminEnabled && (
        <>
          <Link
            href="/admin"
            className={getLinkClasses('/admin', true)}
          >
            Overview & Verifications
          </Link>
          <Link
            href="/admin/data"
            className={getLinkClasses('/admin/data')}
          >
            Data Browser & Recovery
          </Link>
        </>
      )}
    </div>
  );
}
