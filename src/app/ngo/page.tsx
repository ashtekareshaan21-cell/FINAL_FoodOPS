export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getNearbyAvailableDonations, acceptDonation, getNearbyDonationsDiagnostics } from '@/app/actions/donations';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';
import Navbar from '@/components/Navbar';
import AcceptButton from './AcceptButton';
import NgoSettings from './NgoSettings';
import NearbyDonationsList from './NearbyDonationsList';

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
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
                {ngo.organizationName}
              </h1>
              <p className="mt-1.5 text-sm text-muted-text font-medium">
                FSSAI License registration: <span className="font-semibold text-foreground">{ngo.registrationNumber}</span>
              </p>
            </div>
            
            {ngo.status === 'VERIFIED' ? (
              <span className="badge-premium bg-success-bg text-success border border-success-border font-bold text-xs px-4 py-2">
                ✓ Verified Partner
              </span>
            ) : ngo.status === 'PENDING_VERIFICATION' ? (
              <span className="badge-premium bg-warning-bg text-warning border border-warning-border font-bold text-xs px-4 py-2">
                ⏳ Review Underway
              </span>
            ) : (
              <span className="badge-premium bg-danger-bg text-danger border border-danger-border font-bold text-xs px-4 py-2">
                ✕ Account Suspended
              </span>
            )}
          </div>
        </div>

        {/* Verification Compliance Review Banner */}
        {ngo.status !== 'VERIFIED' && (
          <div className="mb-10 bg-warning-bg border border-warning-border rounded-md p-6 animate-fade-in text-warning">
            <h3 className="text-base font-bold mb-1.5 flex items-center gap-2">
              <span>📋</span> FSSAI Compliance Review Notice
            </h3>
            <p className="text-xs leading-relaxed font-semibold">
              Your organization account is currently under review by the FoodOps Administrator. In compliance with the FSSAI Surplus Food Recovery Regulations (2019), only fully verified NGOs are permitted to accept and distribute food. You will receive an alert once your registration copy is approved.
            </p>
          </div>
        )}

        {/* Dashboard Grid */}
        {ngo.status === 'VERIFIED' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Available Rescues list (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">Nearby Available Donations</h2>

              {ngo.availability !== 'AVAILABLE' ? (
                <div className="text-center bg-surface border border-border rounded-lg p-16 shadow-sm">
                  <div className="w-16 h-16 bg-surface-muted text-muted rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    🌙
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Rescue status is offline</h3>
                  <p className="mt-1.5 text-sm text-muted-text max-w-sm mx-auto leading-relaxed font-medium">
                    Please toggle your status to &quot;Available for Rescue&quot; in the Operational Settings sidebar to discover and claim nearby surplus donations.
                  </p>
                </div>
              ) : availableDonations.length === 0 ? (
                <div className="space-y-6">
                  <div className="text-center bg-surface border border-border rounded-lg p-16 shadow-sm">
                    <div className="w-16 h-16 bg-surface-muted text-muted rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                      🛰️
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No matching donations nearby</h3>
                    <p className="mt-1.5 text-sm text-muted-text max-w-sm mx-auto leading-relaxed font-medium">
                      There are no active available donations matching your accepted food types within your {ngo.serviceRadiusKm} km service radius at this moment.
                    </p>
                  </div>

                  {diagnostics.length > 0 && (
                    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm animate-fade-in">
                      <h3 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                        <span>🔍</span> Donation Matching Diagnostics
                      </h3>
                      <p className="text-xs text-muted-text mb-4 leading-relaxed font-medium">
                        We scanned {diagnostics.length} nearby donations within a {ngo.serviceRadiusKm * 2} km privacy bound. Below is why they did not match your profile settings:
                      </p>
                      <div className="space-y-4">
                        {diagnostics.map((diag, index) => (
                          <div key={index} className="p-4 bg-surface-muted border border-border rounded-sm">
                            <div className="flex justify-between items-start gap-4 mb-3">
                              <h4 className="text-xs font-bold text-foreground">{diag.title}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-surface border border-border text-foreground font-mono">
                                {diag.distanceKm.toFixed(1)} km away
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-[10px] mb-3 pb-2.5 border-b border-border">
                              <span className={`inline-flex items-center gap-1 font-semibold ${diag.checks.statusPassed ? 'text-success' : 'text-danger'}`}>
                                {diag.checks.statusPassed ? '✓' : '✗'} Status: {diag.checks.statusPassed ? 'Available' : 'Unavailable'}
                              </span>
                              <span className={`inline-flex items-center gap-1 font-semibold ${diag.checks.expiryPassed ? 'text-success' : 'text-danger'}`}>
                                {diag.checks.expiryPassed ? '✓' : '✗'} Active (Not Expired)
                              </span>
                              <span className={`inline-flex items-center gap-1 font-semibold ${diag.checks.distancePassed ? 'text-success' : 'text-danger'}`}>
                                {diag.checks.distancePassed ? '✓' : '✗'} Within Radius
                              </span>
                              <span className={`inline-flex items-center gap-1 font-semibold ${diag.checks.categoryPassed ? 'text-success' : 'text-danger'}`}>
                                {diag.checks.categoryPassed ? '✓' : '✗'} Accepted Category
                              </span>
                              <span className={`inline-flex items-center gap-1 font-semibold ${diag.checks.ngoStatusPassed ? 'text-success' : 'text-danger'}`}>
                                {diag.checks.ngoStatusPassed ? '✓' : '✗'} NGO Verified
                              </span>
                              <span className={`inline-flex items-center gap-1 font-semibold ${diag.checks.ngoAvailabilityPassed ? 'text-success' : 'text-danger'}`}>
                                {diag.checks.ngoAvailabilityPassed ? '✓' : '✗'} NGO Available
                              </span>
                            </div>
                            {diag.reasons.length > 0 && (
                              <div className="text-[10px] text-danger bg-danger-bg border border-danger-border p-2.5 rounded-sm">
                                <ul className="list-disc list-inside space-y-0.5 font-semibold leading-relaxed">
                                  {diag.reasons.map((r: string, ri: number) => (
                                    <li key={ri}>{r}</li>
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
                <NearbyDonationsList 
                  availableDonations={availableDonations} 
                  acceptDonation={acceptDonation} 
                />
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
