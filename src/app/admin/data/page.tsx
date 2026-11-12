export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isLocalhostDevAdmin } from '@/lib/adminGate';
import { getAllDonors, getAllNgos, getAllVolunteers, getAllDonations, getAllImpactRecords, getAllVerificationRequests } from '@/app/actions/admin';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import AdminDataBrowser from './AdminDataBrowser';

export default async function AdminDataPage() {
  const localDevAdmin = await isLocalhostDevAdmin();
  if (!localDevAdmin) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      redirect('/login');
    }
  }

  const donors = await getAllDonors();
  const ngos = await getAllNgos();
  const volunteers = await getAllVolunteers();
  const donations = await getAllDonations();
  const impactRecords = await getAllImpactRecords();
  const verifications = await getAllVerificationRequests();

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="admin" />
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
        <div className="pb-6 border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
            System Data Browser
          </h1>
          <p className="mt-1.5 text-sm text-muted-text font-medium">
            Search, filter, and audit raw database rows, operational status transitions, verification requests, and impact logs.
          </p>
        </div>

        <AdminDataBrowser
          donors={donors}
          ngos={ngos}
          volunteers={volunteers}
          donations={donations}
          impactRecords={impactRecords}
          verifications={verifications}
        />
      </main>
    </div>
  );
}
