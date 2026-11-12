'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import NavbarLinks from './NavbarLinks';

interface ClientSessionState {
  loaded: boolean;
  authenticated: boolean;
  role: string | null;
}

export default function NavbarClientAuth() {
  const [sessionState, setSessionState] = useState<ClientSessionState>({
    loaded: false,
    authenticated: false,
    role: null,
  });

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { authenticated: false, role: null }))
      .then((data: { authenticated?: boolean; role?: string | null }) => {
        if (active) {
          setSessionState({
            loaded: true,
            authenticated: Boolean(data.authenticated),
            role: data.role || null,
          });
        }
      })
      .catch(() => {
        if (active) {
          setSessionState({ loaded: true, authenticated: false, role: null });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (sessionState.authenticated && sessionState.role) {
    return (
      <div className="flex items-center gap-3">
        <NavbarLinks role={sessionState.role} adminEnabled={true} />
        <Link
          href={
            sessionState.role === 'DONOR'
              ? '/donor'
              : sessionState.role === 'NGO'
              ? '/ngo'
              : sessionState.role === 'VOLUNTEER'
              ? '/volunteer'
              : '/admin'
          }
          className="text-xs font-bold px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
        >
          {sessionState.role} Portal
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="btn-secondary px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            Logout
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="btn-secondary px-3.5 py-2 text-sm font-semibold border-slate-200 hover:border-slate-300"
      >
        Sign In
      </Link>
      <Link
        href="/register"
        className="btn-primary px-4 py-2 text-sm font-semibold shadow-xs"
      >
        Register
      </Link>
    </div>
  );
}
