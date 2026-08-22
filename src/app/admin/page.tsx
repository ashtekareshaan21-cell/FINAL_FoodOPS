export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getPendingNgos, getAdminStats, verifyNgo, rejectNgo } from '@/app/actions/admin';
import PendingNgoList from './PendingNgoList';
import AdminMetrics from './AdminMetrics';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const pendingNgos = await getPendingNgos();
  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="admin" />
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 pb-6 border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
            System Administration Coordinator
          </h1>
          <p className="mt-1.5 text-sm text-muted-text font-medium">
            Verify FSSAI licenses for onboarding NGOs, monitor network health, and track climate impact metrics.
          </p>
        </div>

        {/* Platform metrics */}
        <AdminMetrics stats={stats} />

        {/* NGO approvals list */}
        <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-6">Pending NGO FSSAI Verifications</h2>
        
        <PendingNgoList 
          pendingNgos={pendingNgos} 
          verifyNgo={verifyNgo} 
          rejectNgo={rejectNgo} 
        />
      </main>
    </div>
  );
}
