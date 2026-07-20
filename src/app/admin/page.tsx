import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getPendingNgos, getAdminStats, verifyNgo, rejectNgo } from '@/app/actions/admin';
import PendingNgoList from './PendingNgoList';
import Navbar from '@/components/Navbar';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const pendingNgos = await getPendingNgos();
  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            System Administation Coordinator
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Verify FSSAI licenses for onboarding NGOs, monitor network health, and track climate impact metrics.
          </p>
        </div>

        {/* Platform metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.completedRescues}</p>
            <p className="mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Completed Rescues</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.foodWeightKg.toFixed(1)} kg</p>
            <p className="mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Rescued Weight</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{Math.round(stats.co2SavedKg).toLocaleString()} kg</p>
            <p className="mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">CO₂e Prevented</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{Math.round(stats.waterSavedLiters).toLocaleString()} L</p>
            <p className="mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Water Saved</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center col-span-2 lg:col-span-1">
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.verifiedNgos} / {stats.totalNgos}</p>
            <p className="mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Verified / Total NGOs</p>
          </div>
        </div>

        {/* NGO approvals list */}
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Pending NGO FSSAI Verifications</h2>
        
        <PendingNgoList 
          pendingNgos={pendingNgos} 
          verifyNgo={verifyNgo} 
          rejectNgo={rejectNgo} 
        />
      </main>
    </div>
  );
}
