import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isLocalhostDevAdmin } from '@/lib/adminGate';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [session, adminEnabled] = await Promise.all([
      getSession(),
      isLocalhostDevAdmin(),
    ]);
    if (!session) {
      return NextResponse.json(
        { authenticated: false, role: null, adminEnabled },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    return NextResponse.json(
      { authenticated: true, role: session.role, adminEnabled },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch {
    return NextResponse.json(
      { authenticated: false, role: null, adminEnabled: false },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
