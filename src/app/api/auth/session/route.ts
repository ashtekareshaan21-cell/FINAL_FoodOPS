import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { authenticated: false, role: null },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    return NextResponse.json(
      { authenticated: true, role: session.role },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch {
    return NextResponse.json(
      { authenticated: false, role: null },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
