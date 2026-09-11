export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CreateDonationForm from './CreateDonationForm';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';

export default async function CreateDonationPage() {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    redirect('/login');
  }

  // Fetch the donor's registered profile location as default coordinates
  const donor = await prisma.donorProfile.findUnique({
    where: { userId: session.userId },
    select: {
      address: true,
      latitude: true,
      longitude: true,
      verificationStatus: true,
    },
  });

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="dashboard" />
      <Navbar />

      <main className="flex-grow max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Create Surplus Food Rescue Request
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Notify nearby verified NGOs. Use your registered location or pick another event loading bay.
            </p>
          </div>

          <CreateDonationForm 
            defaultLocation={donor ? { address: donor.address, latitude: donor.latitude, longitude: donor.longitude } : null}
            donorVerificationStatus={donor?.verificationStatus}
          />
        </div>
      </main>
    </div>
  );
}
