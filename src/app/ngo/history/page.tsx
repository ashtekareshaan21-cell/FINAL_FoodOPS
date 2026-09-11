export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getNgoHistory } from '@/app/actions/donations';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';

export default async function NgoHistoryPage() {
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
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="dashboard" />
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 pb-5 border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
            Rescue History & Impact
          </h1>
          <p className="mt-1 text-sm text-muted-text">
            View completed rescues and monitor your organization&apos;s ecological impact.
          </p>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-premium p-6 text-center">
            <p className="text-3xl font-extrabold text-success">
              {totals.foodWeight.toFixed(1)} kg
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-light uppercase tracking-wider">Total Food Rescued</p>
          </div>
          <div className="card-premium p-6 text-center">
            <p className="text-3xl font-extrabold text-success">
              {totals.servings.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-light uppercase tracking-wider">Meals Provided</p>
          </div>
          <div className="card-premium p-6 text-center">
            <p className="text-3xl font-extrabold text-success">
              {Math.round(totals.co2Saved).toLocaleString()} kg
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-light uppercase tracking-wider">CO₂e Prevented</p>
          </div>
          <div className="card-premium p-6 text-center">
            <p className="text-3xl font-extrabold text-success">
              {Math.round(totals.waterSaved).toLocaleString()} L
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-light uppercase tracking-wider">Water Footprint Saved</p>
          </div>
        </div>

        {/* List */}
        <h2 className="text-xl font-bold text-foreground mb-4">Completed Rescues</h2>

        {history.length === 0 ? (
          <div className="text-center card-premium p-12 shadow-sm">
            <p className="text-sm text-muted-text">
              No historical data available. Completed rescues will appear here.
            </p>
          </div>
        ) : (
          <div className="card-premium overflow-hidden shadow-sm">
            <ul role="list" className="divide-y divide-border">
              {history.map((donation) => (
                <li key={donation.id} className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-foreground">
                          {donation.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            donation.status === 'COMPLETED'
                              ? 'bg-success-bg border border-success-border text-success'
                              : 'bg-surface-muted border border-border text-muted-text'
                          }`}
                        >
                          {donation.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-text">{donation.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs text-muted-text">
                        <div>
                          <span className="font-semibold text-foreground">Donor:</span>{' '}
                          {donation.donor.organizationName}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Quantity:</span>{' '}
                          {donation.quantity} {donation.quantityUnit}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-semibold text-foreground">Completed on:</span>{' '}
                          {new Date(donation.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {donation.status === 'COMPLETED' && (
                        <div className="text-xs text-success font-semibold bg-success-bg border border-success-border p-2 rounded">
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
