export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getVolunteerAssignments, updateAssignmentStatus } from '@/app/actions/donations';
import VolunteerAssignmentList from './VolunteerAssignmentList';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';
import VerificationBanner from '@/components/VerificationBanner';

export default async function VolunteerDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'VOLUNTEER') {
    redirect('/login');
  }

  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: session.userId },
  });

  if (!volunteer) {
    redirect('/login');
  }

  const assignments = await getVolunteerAssignments();

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="dashboard" />
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VerificationBanner
          status={volunteer.verificationStatus}
          role="VOLUNTEER"
          rejectionReason={volunteer.rejectionReason}
        />

        <div className="mb-8 pb-5 border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
            My Rescue Shipments
          </h1>
          <p className="mt-1 text-sm text-muted-text">
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
