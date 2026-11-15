export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import RegisterForm from './RegisterForm';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Register as a surplus food donor, verified NGO partner, or rescue rider on FoodOPS.',
  alternates: { canonical: '/register' },
};

type RoleChoice = 'DONOR' | 'NGO' | 'VOLUNTEER';

function parseRoleParam(roleParam?: string): RoleChoice | undefined {
  const normalized = roleParam?.trim().toLowerCase();
  if (normalized === 'donor') return 'DONOR';
  if (normalized === 'ngo') return 'NGO';
  if (normalized === 'rider' || normalized === 'volunteer') return 'VOLUNTEER';
  return undefined;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const session = await getSession();
  if (session) {
    if (session.role === 'DONOR') redirect('/donor');
    if (session.role === 'NGO') redirect('/ngo');
    if (session.role === 'VOLUNTEER') redirect('/volunteer');
    if (session.role === 'ADMIN') redirect('/admin');
    redirect('/');
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialRole = parseRoleParam(resolvedParams?.role);

  let ngos: { id: string; organizationName: string }[] = [];
  try {
    const fetchedNgos = await prisma.nGOProfile.findMany({
      where: {
        status: 'VERIFIED',
      },
      select: {
        id: true,
        organizationName: true,
      },
      orderBy: {
        organizationName: 'asc',
      },
    });
    ngos = fetchedNgos;
  } catch (err) {
    console.error('Failed to fetch NGOs for registration page:', err);
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="auth" />
      <Navbar />
      <main id="main-content" className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8 bg-surface/85 backdrop-blur-md p-8 rounded-2xl border border-border shadow-lg">
          <div>
            <h1 className="text-center text-3xl font-extrabold text-foreground">
              Create your FoodOPS account
            </h1>
            <p className="mt-2 text-center text-sm text-muted-text">
              Register as a surplus donor, verified NGO, or rescue rider
            </p>
          </div>

          <RegisterForm ngos={ngos} initialRole={initialRole} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
