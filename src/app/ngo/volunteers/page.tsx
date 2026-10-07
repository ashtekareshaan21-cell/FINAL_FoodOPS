export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getNgoFleetRoster } from '@/app/actions/ngo';
import { getNgoAcceptedDonations } from '@/app/actions/donations';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import VerificationBanner from '@/components/VerificationBanner';
import NgoNavTabs from '@/components/NgoNavTabs';
import VolunteerFleetView from './VolunteerFleetView';

export default async function NgoVolunteersPage() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    redirect('/login');
  }

  const { ngo, volunteers, stats } = await getNgoFleetRoster();
  const acceptedDonations = await getNgoAcceptedDonations();

  // Filter unassigned or pending donations for allotment
  const unassignedDonations = acceptedDonations
    .filter((d: any) => d.status === 'ACCEPTED' || (d.status === 'VOLUNTEER_ASSIGNED' && !d.assignment?.startedAt))
    .map((d: any) => ({
      id: d.id,
      title: d.title,
      quantity: d.quantity,
      quantityUnit: d.quantityUnit,
      status: d.status,
      pickupAddress: d.pickupAddress,
      donor: { organizationName: d.donor.organizationName },
    }));

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="dashboard" />
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VerificationBanner
          status={ngo.status as any}
          role="NGO"
        />

        <NgoNavTabs />

        <div className="mb-6 pb-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
              Volunteer Fleet & Task Allotment
            </h1>
            <p className="mt-1 text-sm text-muted-text">
              Manage all volunteers associated with <span className="font-semibold text-foreground">{ngo.organizationName}</span>, allot tasks in bulk or at random, and dispatch food rescues.
            </p>
          </div>
        </div>

        <VolunteerFleetView
          ngo={ngo}
          volunteers={volunteers as any}
          stats={stats}
          unassignedDonations={unassignedDonations}
        />
      </main>
    </div>
  );
}
