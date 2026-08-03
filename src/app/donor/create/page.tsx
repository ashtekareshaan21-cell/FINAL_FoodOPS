export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import CreateDonationForm from './CreateDonationForm';
import Navbar from '@/components/Navbar';

export default async function CreateDonationPage() {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Create Surplus Food Rescue Request
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Fill in the details below to notify nearby NGOs.
            </p>
          </div>

          <CreateDonationForm />
        </div>
      </main>
    </div>
  );
}
