export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import RegisterForm from './RegisterForm';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    if (session.role === 'DONOR') redirect('/donor');
    if (session.role === 'NGO') redirect('/ngo');
    if (session.role === 'VOLUNTEER') redirect('/volunteer');
    if (session.role === 'ADMIN') redirect('/admin');
    redirect('/');
  }

  let ngos: { id: string; organizationName: string }[] = [];
  try {
    const fetchedNgos = await prisma.nGOProfile.findMany({
      select: {
        id: true,
        organizationName: true,
      },
      orderBy: [
        { status: 'desc' },
        { organizationName: 'asc' },
      ],
    });
    // Ensure the registered Bengaluru NGO (Save Food Foundation) is prioritized at top of list
    ngos = fetchedNgos.sort((a, b) => {
      if (a.organizationName.includes('Save Food Foundation')) return -1;
      if (b.organizationName.includes('Save Food Foundation')) return 1;
      return 0;
    });
  } catch (err) {
    console.error('Failed to fetch NGOs for registration page:', err);
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="auth" />
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8 bg-surface/75 backdrop-blur-md p-8 rounded-2xl border border-border shadow-lg">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-foreground">
              Create your FoodOps account
            </h2>
            <p className="mt-2 text-center text-sm text-muted-text">
              Select your role below to register
            </p>
          </div>

          <RegisterForm ngos={ngos} />
        </div>
      </div>
    </div>
  );
}
