export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getNgoHistory } from '@/app/actions/donations';
import Navbar from '@/components/Navbar';

export default async function NgoHistoryPage() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    redirect('/login');
  }

  const ngo = await prisma.nGOProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!ngo) throw new Error('NGO not found');

  const history = await getNgoHistory();

  // Aggregate local NGO impact metrics from completed donations
  const completedDonationIds = history
    .filter((d) => d.status === 'COMPLETED')
    .map((d) => d.id);

  const impactRecords = await prisma.impactRecord.findMany({
    where: {
      donationId: { in: completedDonationIds },
    },
  });

  const totals = impactRecords.reduce(
    (acc, record) => {
      acc.foodWeight += record.foodWeightKg;
      acc.co2Saved += record.co2EquivalentKg;
      acc.waterSaved += record.waterSavedLiters;
      acc.servings += record.estimatedServings;
      return acc;
    },
    { foodWeight: 0, co2Saved: 0, waterSaved: 0, servings: 0 }
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Rescue History & Impact
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            View completed rescues and monitor your organization&apos;s ecological impact.
          </p>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {totals.foodWeight.toFixed(1)} kg
            </p>
            <p className="mt-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Food Rescued</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {totals.servings.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Meals Provided</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {Math.round(totals.co2Saved).toLocaleString()} kg
            </p>
            <p className="mt-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">CO₂e Prevented</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {Math.round(totals.waterSaved).toLocaleString()} L
            </p>
            <p className="mt-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Water Footprint Saved</p>
          </div>
        </div>

        {/* List */}
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Completed Rescues</h2>

        {history.length === 0 ? (
          <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 shadow-sm">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No historical data available. Completed rescues will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <ul role="list" className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {history.map((donation) => (
                <li key={donation.id} className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                          {donation.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            donation.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {donation.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{donation.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <div>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Donor:</span>{' '}
                          {donation.donor.organizationName}
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Quantity:</span>{' '}
                          {donation.quantity} {donation.quantityUnit}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Completed on:</span>{' '}
                          {new Date(donation.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {donation.status === 'COMPLETED' && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-2 rounded">
                          🌱 Verified Impact
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
