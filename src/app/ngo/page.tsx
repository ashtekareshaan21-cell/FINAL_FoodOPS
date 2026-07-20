import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getNearbyAvailableDonations, acceptDonation } from '@/app/actions/donations';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';
import Navbar from '@/components/Navbar';
import AcceptButton from './AcceptButton';

export default async function NgoDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    redirect('/login');
  }

  const ngo = await prisma.nGOProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!ngo) {
    throw new Error('NGO profile not found');
  }

  const availableDonations = await getNearbyAvailableDonations();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {ngo.organizationName}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Service Radius: {ngo.serviceRadiusKm} km | FSSAI: {ngo.registrationNumber}
              </p>
            </div>
            
            {ngo.status === 'VERIFIED' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ✓ Verified Partner
              </span>
            ) : ngo.status === 'PENDING_VERIFICATION' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                ⚠ Pending FSSAI Verification
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800">
                ✕ Account Suspended
              </span>
            )}
          </div>
        </div>

        {/* Verification Alert */}
        {ngo.status !== 'VERIFIED' && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-2">FSSAI Compliance Review</h3>
            <p className="text-sm text-amber-700 dark:text-amber-500 leading-relaxed">
              Your organization account is currently under review by the FoodOps Administrator. In compliance with the FSSAI Surplus Food Recovery Regulations (2019), only fully verified NGOs are permitted to accept and distribute food. You will receive an alert once your registration copy is approved.
            </p>
          </div>
        )}

        {/* Dashboard Grid */}
        {ngo.status === 'VERIFIED' && (
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Nearby Available Donations</h2>

            {availableDonations.length === 0 ? (
              <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 shadow-sm">
                <svg
                  className="mx-auto h-12 w-12 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">No donations nearby</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  There are no active available donations within your {ngo.serviceRadiusKm} km service radius at this moment.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {availableDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
                          {donation.title}
                        </h3>
                        <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono">
                          {donation.distance.toFixed(1)} km away
                        </span>
                      </div>

                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-3">
                        {donation.description}
                      </p>

                      <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 mb-6 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-150 dark:border-zinc-850">
                        <div>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Donor:</span>{' '}
                          {donation.donor.organizationName}
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Pickup Address:</span>{' '}
                          {donation.pickupAddress}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                          <div>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-sans">Qty:</span>{' '}
                            {donation.quantity} {donation.quantityUnit}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Dietary:</span>{' '}
                            {donation.vegNonVegMixed}
                          </div>
                        </div>
                        <div className="pt-1">
                          <a
                            href={buildGoogleMapsSearchUrl(donation.pickupLatitude, donation.pickupLongitude)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            🗺️ View on Google Maps
                          </a>
                        </div>
                        <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Must Collect Before:</span>{' '}
                          <span className="text-red-600 dark:text-red-400 font-semibold font-mono">
                            {new Date(donation.pickupDeadlineAt).toLocaleTimeString()} ({new Date(donation.pickupDeadlineAt).toLocaleDateString()})
                          </span>
                        </div>
                      </div>
                    </div>

                    <AcceptButton donationId={donation.id} acceptDonation={acceptDonation} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
