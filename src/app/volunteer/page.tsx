export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getVolunteerAssignments, updateAssignmentStatus } from '@/app/actions/donations';
import VolunteerAssignmentList from './VolunteerAssignmentList';
import Navbar from '@/components/Navbar';

export default async function VolunteerDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'VOLUNTEER') {
    redirect('/login');
  }

  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: session.userId },
  });

  if (!volunteer) throw new Error('Volunteer profile not found');

  const assignments = await getVolunteerAssignments();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            My Rescue Shipments
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track and update states of your assigned surplus food collections.
          </p>
        </div>

        <VolunteerAssignmentList 
          assignments={assignments} 
          updateAssignmentStatus={updateAssignmentStatus} 
        />
      </main>
    </div>
  );
}
