export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getNgoAcceptedDonations, assignVolunteer } from '@/app/actions/donations';
import { getNgoVolunteers } from '@/app/actions/ngo';
import ActiveRescuesList from './ActiveRescuesList';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import NgoNavTabs from '@/components/NgoNavTabs';

export default async function ActiveRescuesPage() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    redirect('/login');
  }

  const ngo = await prisma.nGOProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!ngo) {
    redirect('/login');
  }

  const activeRescues = await getNgoAcceptedDonations();
  const volunteers = await getNgoVolunteers();

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="dashboard" />
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NgoNavTabs />

        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
            Live Rescue Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-text">
            Monitor multiple concurrent food rescues across volunteers, allot pending tasks, and track real-time delivery progress.
          </p>
        </div>

        <ActiveRescuesList 
          activeRescues={activeRescues} 
          volunteers={volunteers}
          ngo={ngo}
          assignVolunteer={assignVolunteer}
        />
      </main>
    </div>
  );
}
