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
        <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You do not have any active pickups assigned at this moment.
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
                  className="w-full py-3 px-4 border border-transparent rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  {loading ? 'Processing...' : '🚴 Start Pickup'}
                </button>
              );
            } else if (asg.status === 'STARTED') {
              actionButton = (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdate(asg.id, 'ARRIVE_AT_DONOR')}
                  className="w-full py-3 px-4 border border-transparent rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  {loading ? 'Processing...' : '📍 Arrived at Donor'}
                </button>
              );
            } else if (asg.status === 'ARRIVED' && donation.status !== 'PICKED_UP' && donation.status !== 'DELIVERY_IN_PROGRESS') {
              actionButton = (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdate(asg.id, 'CONFIRM_PICKUP')}
                  className="w-full py-3 px-4 border border-transparent rounded bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  {loading ? 'Processing...' : '📦 Confirm Pickup (Food Collected)'}
                </button>
              );
            } else if (donation.status === 'PICKED_UP') {
              actionButton = (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdate(asg.id, 'START_DELIVERY')}
                  className="w-full py-3 px-4 border border-transparent rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  {loading ? 'Processing...' : '🚚 Start Delivery Transit'}
                </button>
              );
            } else if (donation.status === 'DELIVERY_IN_PROGRESS') {
              actionButton = (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdate(asg.id, 'CONFIRM_DELIVERY')}
                  className="w-full py-3 px-4 border border-transparent rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  {loading ? 'Processing...' : '🏁 Confirm Delivery & Complete'}
                </button>
              );
            }

            return (
              <div
                key={asg.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col gap-6"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{donation.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{donation.description}</p>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Shipment ID: {asg.id.slice(-6).toUpperCase()}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Address and Contacts */}
                  <div className="space-y-4">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Donor Venue</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{donor.organizationName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Contact Person</p>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                          {donor.contactPerson} ({donation.donor.user.phoneNumber})
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Pickup Point</p>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{donation.pickupAddress}</p>
                      </div>
                    </div>

                    <MapPreview
                      latitude={donation.pickupLatitude}
                      longitude={donation.pickupLongitude}
                      address={donation.pickupAddress}
                      height="140px"
                    />

                    <a
                      href={buildGoogleMapsSearchUrl(donation.pickupLatitude, donation.pickupLongitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded font-semibold text-xs transition-colors"
                    >
                      🗺️ Open Location in Google Maps
                    </a>
                  </div>

                  {/* Status and Action Buttons */}
                  <div className="flex flex-col justify-between">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Shipment Status</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {donation.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Quantity Details</span>
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                          {donation.quantity} {donation.quantityUnit} ({donation.estimatedServings || 'N/A'} meals)
                        </span>
                      </div>
                      {donation.specialNotes && (
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Notes</span>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 italic">&quot;{donation.specialNotes}&quot;</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 md:mt-0">
                      {error && (
                        <div className="mb-3 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-xs dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                          {error}
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
