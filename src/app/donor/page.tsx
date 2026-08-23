export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDonorDonations } from '@/app/actions/donations';
import Navbar from '@/components/Navbar';
import DonorDonationsList from './DonorDonationsList';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';


export default async function DonorDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    redirect('/login');
  }

  const donor = await prisma.donorProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!donor) {
    redirect('/login');
  }

  const donations = await getDonorDonations();

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="dashboard" />
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 pb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
              {donor.organizationName}
            </h1>
            <p className="mt-1 text-sm text-muted-text font-medium">
              Catering Profile Type: <span className="font-semibold text-foreground">{donor.organizationType}</span> &bull; Facility Center
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/donor/create"
              className="btn-primary flex items-center gap-1.5 px-5 py-3 shadow-md shadow-primary/10 hover:scale-[1.01]"
            >
              <span>+</span>
              <span>Publish Surplus Food</span>
            </Link>
          </div>
        </div>

        {/* Donations Grid Layout */}
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
            Surplus Rescue Requests
          </h2>

          {donations.length === 0 ? (
            <div className="text-center bg-surface border border-border rounded-lg p-16 shadow-sm">
              <div className="w-16 h-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                📋
              </div>
              <h3 className="text-lg font-bold text-foreground">No active donations published</h3>
              <p className="mt-1.5 text-sm text-muted-text max-w-sm mx-auto font-medium">
                Clean and list food from banquet halls, catering event reserves, or kitchens.
              </p>
              <div className="mt-8">
                <Link
                  href="/donor/create"
                  className="btn-primary px-5 py-2.5 shadow-sm"
                >
                  List Surplus Now
                </Link>
              </div>
            </div>
          ) : (
            <DonorDonationsList donations={donations} />
          )}
        </div>
      </main>
    </div>
  );
}
