import { prisma } from '@/lib/db';
import RegisterForm from './RegisterForm';
import Navbar from '@/components/Navbar';

export default async function RegisterPage() {
  // Fetch NGOs for volunteer registration dropdown
  const ngos = await prisma.nGOProfile.findMany({
    select: {
      id: true,
      organizationName: true,
    },
    orderBy: {
      organizationName: 'asc',
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              Create your FoodOps account
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Select your role below to register
            </p>
          </div>

          <RegisterForm ngos={ngos} />
        </div>
      </div>
    </div>
  );
}
