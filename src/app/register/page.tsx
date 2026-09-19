export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import RegisterForm from './RegisterForm';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';

export default async function RegisterPage() {
  let ngos: { id: string; organizationName: string }[] = [];
  try {
    ngos = await prisma.nGOProfile.findMany({
      select: {
        id: true,
        organizationName: true,
      },
      orderBy: {
        organizationName: 'asc',
      },
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
