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
        <div className="card-premium p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-foreground tracking-tight font-display">
              Create Surplus Food Rescue Request
            </h1>
            <p className="text-sm text-muted-text mt-1">
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
