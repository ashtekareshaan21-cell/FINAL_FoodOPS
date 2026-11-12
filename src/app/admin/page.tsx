export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isLocalhostDevAdmin } from '@/lib/adminGate';
import { getPendingNgos, getAdminStats, verifyNgo, rejectNgo, getAllDonors, verifyDonor, rejectDonor, getAllVolunteers, verifyVolunteer, rejectVolunteer, getRecoveryDonations } from '@/app/actions/admin';
import { escalateDonation, resolveOrganicDonation } from '@/app/actions/donations';
import PendingNgoList from './PendingNgoList';
import DonorVerificationList from './DonorVerificationList';
import VolunteerVerificationList from './VolunteerVerificationList';
import AdminRecoveryView from './AdminRecoveryView';
import AdminMetrics from './AdminMetrics';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';

export default async function AdminPage() {
  const localDevAdmin = await isLocalhostDevAdmin();
  if (!localDevAdmin) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      redirect('/login');
    }
  }

  const pendingNgos = await getPendingNgos();
  const donors = await getAllDonors();
  const volunteers = await getAllVolunteers();
  const recoveryDonations = await getRecoveryDonations();
  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="admin" />
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="pb-6 border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
            System Administration Coordinator
          </h1>
          <p className="mt-1.5 text-sm text-muted-text font-medium">
            Verify FSSAI licenses for onboarding NGOs, manage donor and rider verification status, monitor recovery pathways, and track climate impact metrics.
          </p>
        </div>

        {/* Platform metrics */}
        <AdminMetrics stats={stats} />

        {/* NGO approvals list */}
        <section>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-4">Pending NGO FSSAI Verifications</h2>
          <PendingNgoList 
            pendingNgos={pendingNgos} 
            verifyNgo={verifyNgo} 
            rejectNgo={rejectNgo} 
          />
        </section>

        {/* Volunteer Verification section */}
        <section>
          <VolunteerVerificationList
            volunteers={volunteers}
            verifyVolunteer={verifyVolunteer}
            rejectVolunteer={rejectVolunteer}
          />
        </section>

        {/* Donor Verification section */}
        <section>
          <DonorVerificationList
            donors={donors}
            verifyDonor={verifyDonor}
            rejectDonor={rejectDonor}
          />
        </section>

        {/* Recovery Management Section */}
        <section>
          <AdminRecoveryView
            recoveryDonations={recoveryDonations}
            escalateDonation={escalateDonation}
            resolveOrganicDonation={resolveOrganicDonation}
          />
        </section>
      </main>
    </div>
  );
}
