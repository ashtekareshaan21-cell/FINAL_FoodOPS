export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getOrganicRecoveryData } from '@/app/actions/organicRecovery';
import { getNgoVolunteers } from '@/app/actions/ngo';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import NgoNavTabs from '@/components/NgoNavTabs';
import OrganicRecoveryView from './OrganicRecoveryView';

export default async function NgoOrganicRecoveryPage() {
  const session = await getSession();
  if (!session || (session.role !== 'NGO' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  const [recoveryData, volunteers] = await Promise.all([
    getOrganicRecoveryData(),
    getNgoVolunteers(),
  ]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="dashboard" />
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NgoNavTabs />

        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
            Organic Recovery & Clean Energy Operations
          </h1>
          <p className="mt-1 text-sm text-muted-text">
            Divert expired and quality-rejected surplus food to certified Pune biomethanation, bio-CNG, and organic composting plants.
          </p>
        </div>

        <OrganicRecoveryView
          facilities={(recoveryData?.facilities || []) as any}
          missions={(recoveryData?.missions || []) as any}
          candidateDonations={(recoveryData?.candidateDonations || []) as any}
          volunteers={(volunteers || []) as any}
          metrics={
            recoveryData?.metrics || {
              totalMissions: 0,
              totalWasteKg: 0,
              totalCleanEnergyKwh: 0,
              totalBioFertilizerKg: 0,
              totalMethaneAvoidedKg: 0,
            }
          }
        />
      </main>
    </div>
  );
}
