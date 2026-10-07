export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getNgoHistory } from '@/app/actions/donations';
import Navbar from '@/components/Navbar';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';

import NgoHistoryInteractive from './NgoHistoryInteractive';

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
  const historyDonationIds = history.map((d) => d.id);

  const impactRecords = await prisma.impactRecord.findMany({
    where: {
      donationId: { in: historyDonationIds },
    },
  });

  const impactMap = impactRecords.reduce<
    Record<
      string,
      {
        foodWeightKg: number;
        estimatedServings: number;
        co2EquivalentKg: number;
        waterSavedLiters: number;
        calculationMethod: string;
        factorsUsed: string;
      }
    >
  >((acc, record) => {
    acc[record.donationId] = {
      foodWeightKg: record.foodWeightKg,
      estimatedServings: record.estimatedServings,
      co2EquivalentKg: record.co2EquivalentKg,
      waterSavedLiters: record.waterSavedLiters,
      calculationMethod: record.calculationMethod,
      factorsUsed: record.factorsUsed,
    };
    return acc;
  }, {});

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

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="pb-5 border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
            Rescue History & Impact
          </h1>
          <p className="mt-1 text-sm text-muted-text">
            Search, filter, and inspect detailed timelines and ecological impact for all organization rescues.
          </p>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Interactive Rescue List & Detail Modal */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Historical Rescue Audit & Details</h2>
          <NgoHistoryInteractive history={history as any} impactMap={impactMap} />
        </section>
      </main>
    </div>
  );
}
