export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getNearbyAvailableDonations, acceptDonation, getNearbyDonationsDiagnostics } from '@/app/actions/donations';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';
import Navbar from '@/components/Navbar';
import AcceptButton from './AcceptButton';
import NgoSettings from './NgoSettings';
import { getFoodCategoryImage } from '@/lib/ui';

export default async function NgoDashboard() {
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

  const availableDonations = await getNearbyAvailableDonations();
  let diagnostics: Awaited<ReturnType<typeof getNearbyDonationsDiagnostics>> = [];
  if (availableDonations.length === 0) {
    diagnostics = await getNearbyDonationsDiagnostics();
  }

  return (
    <div className="min-h-screen bg-zinc-55 dark:bg-zinc-950 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-850">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {ngo.organizationName}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                FSSAI License: <span className="font-semibold text-zinc-700 dark:text-zinc-350">{ngo.registrationNumber}</span>
              </p>
            </div>
            
            {ngo.status === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                ✓ Verified Partner
              </span>
            ) : ngo.status === 'PENDING_VERIFICATION' ? (
              <span className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
                ⚠ Review Underway
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
                ✕ Account Suspended
              </span>
            )}
          </div>
        </div>

        {/* Verification Compliance Review Banner */}
        {ngo.status !== 'VERIFIED' && (
          <div className="mb-8 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/85 dark:border-amber-900/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-2">
              <span>📋</span> FSSAI Compliance Review
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-500/90 leading-relaxed">
              Your organization account is currently under review by the FoodOps Administrator. In compliance with the FSSAI Surplus Food Recovery Regulations (2019), only fully verified NGOs are permitted to accept and distribute food. You will receive an alert once your registration copy is approved.
            </p>
          </div>
        )}

        {/* Dashboard Grid */}
        {ngo.status === 'VERIFIED' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Available Rescues list (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Nearby Available Donations</h2>

              {ngo.availability !== 'AVAILABLE' ? (
                <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 shadow-sm">
                  <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    🌙
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Rescue Status is {ngo.availability === 'BUSY' ? 'Busy' : 'Offline'}</h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Please toggle your status to &quot;Available for Rescue&quot; in the Operational Settings sidebar to discover and claim nearby surplus donations.
                  </p>
                </div>
              ) : availableDonations.length === 0 ? (
                <div className="space-y-6">
                  <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 shadow-sm">
                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-550 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                      🛰️
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No matching donations nearby</h3>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      There are no active available donations matching your accepted food types within your {ngo.serviceRadiusKm} km service radius at this moment.
                    </p>
                  </div>

                  {diagnostics.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center gap-2">
                        <span>🔍</span> Donation Matching Diagnostics
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
                        We scanned {diagnostics.length} nearby donations within a {ngo.serviceRadiusKm * 2} km privacy bound. Below is why they did not match your profile settings:
                      </p>
                      <div className="space-y-4">
                        {diagnostics.map((diag, index) => (
                          <div key={index} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl">
                            <div className="flex justify-between items-start gap-4 mb-3">
                              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{diag.title}</h4>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                                {diag.distanceKm.toFixed(1)} km away
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px] mb-3.5 border-b border-zinc-200/50 dark:border-zinc-850 pb-2.5">
                              <span className={`inline-flex items-center gap-1 ${diag.checks.statusPassed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500'}`}>
                                {diag.checks.statusPassed ? '✓' : '✗'} Status: {diag.checks.statusPassed ? 'Available' : 'Unavailable'}
                              </span>
                              <span className={`inline-flex items-center gap-1 ${diag.checks.expiryPassed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500'}`}>
                                {diag.checks.expiryPassed ? '✓' : '✗'} Active (Not Expired)
                              </span>
                              <span className={`inline-flex items-center gap-1 ${diag.checks.distancePassed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500'}`}>
                                {diag.checks.distancePassed ? '✓' : '✗'} Within Radius
                              </span>
                              <span className={`inline-flex items-center gap-1 ${diag.checks.categoryPassed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500'}`}>
                                {diag.checks.categoryPassed ? '✓' : '✗'} Accepted Category
                              </span>
                              <span className={`inline-flex items-center gap-1 ${diag.checks.ngoStatusPassed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500'}`}>
                                {diag.checks.ngoStatusPassed ? '✓' : '✗'} NGO Verified
                              </span>
                              <span className={`inline-flex items-center gap-1 ${diag.checks.ngoAvailabilityPassed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500'}`}>
                                {diag.checks.ngoAvailabilityPassed ? '✓' : '✗'} NGO Available
                              </span>
                            </div>
                            {diag.reasons.length > 0 && (
                              <div className="text-[11px] text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200/50 dark:border-red-900/20">
                                <ul className="list-disc list-inside space-y-1">
                                  {diag.reasons.map((r: string, ri: number) => (
                                    <li key={ri} className="leading-snug">{r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {availableDonations.map((donation) => {
                    const foodImg = getFoodCategoryImage(donation.foodCategory);
                    return (
                      <div
                        key={donation.id}
                        className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-750 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Banner Photo Category Card */}
                          <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-950">
                            <img 
                              src={foodImg} 
                              alt={donation.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                            <div className="absolute top-4 right-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-zinc-100 uppercase tracking-widest border border-white/10 font-mono">
                                📍 {donation.distance.toFixed(1)} km away
                              </span>
                            </div>
                          </div>

                          <div className="p-5 space-y-4">
                            <div className="space-y-1">
                              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
                                {donation.title}
                              </h3>
                              <p className="text-xs text-zinc-550 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                {donation.description}
                              </p>
                            </div>

                            <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850">
                              <div>
                                <span className="font-semibold text-zinc-700 dark:text-zinc-350">Donor:</span>{' '}
                                <span className="font-medium text-zinc-900 dark:text-zinc-200">{donation.donor.organizationName}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-zinc-700 dark:text-zinc-350">Pickup Address:</span>{' '}
                                <span className="font-medium text-zinc-900 dark:text-zinc-200">{donation.pickupAddress}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-zinc-200 dark:border-zinc-800 mt-1.5">
                                <div>
                                  <span className="font-semibold text-zinc-700 dark:text-zinc-350">Qty:</span>{' '}
                                  <span className="font-medium text-zinc-900 dark:text-zinc-200">{donation.quantity} {donation.quantityUnit}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-zinc-700 dark:text-zinc-350">Dietary:</span>{' '}
                                  <span className="font-medium text-zinc-900 dark:text-zinc-200">{donation.vegNonVegMixed}</span>
                                </div>
                              </div>
                              <div className="pt-2">
                                <a
                                  href={buildGoogleMapsSearchUrl(donation.pickupLatitude, donation.pickupLongitude)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                  🗺️ View in Google Maps
                                </a>
                              </div>
                              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-350">Must Collect Before:</span>{' '}
                                <span className="text-red-650 dark:text-red-400 font-semibold font-mono">
                                  {new Date(donation.pickupDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(donation.pickupDeadlineAt).toLocaleDateString()})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 pt-0">
                          <AcceptButton donationId={donation.id} acceptDonation={acceptDonation} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Operational settings sidebar (1/3 width) */}
            <div className="lg:col-span-1">
              <NgoSettings ngo={ngo} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
