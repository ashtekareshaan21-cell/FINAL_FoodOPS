'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';
import MapPreview from '@/components/Maps/MapPreview';

export interface VolunteerAssignmentItem {
  id: string;
  status: string;
  donation: {
    id: string;
    title: string;
    description: string;
    status: string;
    pickupAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    quantity: string;
    quantityUnit: string;
    estimatedServings?: number | null;
    specialNotes?: string | null;
    donor: {
      organizationName: string;
      contactPerson: string;
      user: {
        phoneNumber: string;
      };
    };
  };
}

interface VolunteerAssignmentListProps {
  assignments: VolunteerAssignmentItem[];
  updateAssignmentStatus: (assignmentId: string, action: string) => Promise<{ success: boolean; error?: string; status?: string }>;
}

export default function VolunteerAssignmentList({ assignments, updateAssignmentStatus }: VolunteerAssignmentListProps) {
  const router = useRouter();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  const handleUpdate = async (assignmentId: string, action: string) => {
    setLoadingMap(prev => ({ ...prev, [assignmentId]: true }));
    setErrorMap(prev => ({ ...prev, [assignmentId]: null }));

    const res = await updateAssignmentStatus(assignmentId, action);
    setLoadingMap(prev => ({ ...prev, [assignmentId]: false }));

    if (res.success) {
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [assignmentId]: res.error || 'Failed to update state.' }));
    }
  };

  return (
    <div className="space-y-6">
      {assignments.length === 0 ? (
        <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 shadow-sm">
          <span className="text-3xl block mb-3">🚴</span>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No Active Pickups Assigned
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
            When your NGO registers or assigns you a surplus food rescue, it will display here with location maps.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignments.map((asg) => {
            const error = errorMap[asg.id];
            const loading = loadingMap[asg.id];
            const donation = asg.donation;
            const donor = donation.donor;

            // Determine what button to show based on state
            let actionButton = null;
            if (asg.status === 'ASSIGNED') {
              actionButton = (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdate(asg.id, 'START_PICKUP')}
                  className="w-full py-3 px-4 border border-transparent rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  {loading ? 'Routing pickup...' : '🚴 Start Pickup'}
                </button>
              );
            } else if (asg.status === 'STARTED') {
              actionButton = (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdate(asg.id, 'ARRIVE_AT_DONOR')}
                  className="w-full py-3 px-4 border border-transparent rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-sm shadow-md shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  {loading ? 'Confirming details...' : '📍 Arrived at Donor'}
                </button>
              );
            } else if (asg.status === 'ARRIVED' && donation.status !== 'PICKED_UP' && donation.status !== 'DELIVERY_IN_PROGRESS') {
              actionButton = (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdate(asg.id, 'CONFIRM_PICKUP')}
                  className="w-full py-3 px-4 border border-transparent rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  {loading ? 'Logging collection...' : '📦 Confirm Pickup (Food Collected)'}
                </button>
              );
            } else if (donation.status === 'PICKED_UP') {
              actionButton = (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdate(asg.id, 'START_DELIVERY')}
                  className="w-full py-3 px-4 border border-transparent rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  {loading ? 'Starting route...' : '🚚 Start Delivery Transit'}
                </button>
              );
            } else if (donation.status === 'DELIVERY_IN_PROGRESS') {
              actionButton = (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdate(asg.id, 'CONFIRM_DELIVERY')}
                  className="w-full py-3 px-4 border border-transparent rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  {loading ? 'Completing rescue...' : '🏁 Confirm Delivery & Complete'}
                </button>
              );
            }

            return (
              <div
                key={asg.id}
                className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6"
              >
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{donation.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">{donation.description}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-mono">
                    ID: {asg.id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Address and Contacts */}
                  <div className="space-y-4">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-3">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Donor Venue</span>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{donor.organizationName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-200/50 dark:border-zinc-800/40 pt-2.5">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Contact Person</span>
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{donor.contactPerson}</p>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Call Contact</span>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{donation.donor.user.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="border-t border-zinc-200/50 dark:border-zinc-800/40 pt-2.5">
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Pickup Point</span>
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 leading-relaxed">{donation.pickupAddress}</p>
                      </div>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-805">
                      <MapPreview
                        latitude={donation.pickupLatitude}
                        longitude={donation.pickupLongitude}
                        address={donation.pickupAddress}
                        height="150px"
                      />
                    </div>

                    <a
                      href={buildGoogleMapsSearchUrl(donation.pickupLatitude, donation.pickupLongitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold text-xs shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                    >
                      🗺️ Open Location in Google Maps
                    </a>
                  </div>

                  {/* Status and Action Buttons */}
                  <div className="flex flex-col justify-between space-y-6 md:space-y-0">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-4">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Shipment Status</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-850 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {donation.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <div className="border-t border-zinc-200/50 dark:border-zinc-800/40 pt-3">
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Quantity Details</span>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {donation.quantity} {donation.quantityUnit} &bull; <span className="text-emerald-600 dark:text-emerald-400 font-bold">{donation.estimatedServings || 'N/A'} meals</span>
                        </p>
                      </div>

                      {donation.specialNotes && (
                        <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/40">
                          <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Special Notes from Kitchen</span>
                          <p className="text-xs text-zinc-650 dark:text-zinc-400 italic mt-1 leading-relaxed bg-zinc-100/50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800/45">
                            &quot;{donation.specialNotes}&quot;
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto">
                      {error && (
                        <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-650 text-xs font-semibold dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
                          ⚠ {error}
                        </div>
                      )}

                      {actionButton}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
