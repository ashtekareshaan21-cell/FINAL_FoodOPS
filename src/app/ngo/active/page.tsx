export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getNgoAcceptedDonations, assignVolunteer } from '@/app/actions/donations';
import { getNgoVolunteers } from '@/app/actions/ngo';
import ActiveRescuesList from './ActiveRescuesList';
import Navbar from '@/components/Navbar';

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Active Rescues & Assignments
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Assign volunteers to claimed donations and monitor pickup progress.
          </p>
        </div>

        <ActiveRescuesList 
          activeRescues={activeRescues} 
          volunteers={volunteers} 
          assignVolunteer={assignVolunteer}
        />
      </main>
    </div>
  );
}
