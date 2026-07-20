'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';

interface ActiveRescuesListProps {
  activeRescues: any[];
  volunteers: any[];
  assignVolunteer: (donationId: string, volunteerId: string) => Promise<{ success: boolean; error?: string }>;
}

const STATUS_DESCRIPTION: Record<string, string> = {
  ACCEPTED: 'Claimed by your NGO. Please assign a volunteer rider to start pickup.',
  VOLUNTEER_ASSIGNED: 'Rider assigned. Waiting for volunteer to start the task.',
  PICKUP_IN_PROGRESS: 'Volunteer is currently traveling to the donor location.',
  PICKED_UP: 'Food collected from donor. Waiting for rider to start delivery transit.',
  DELIVERY_IN_PROGRESS: 'Volunteer is en route to the NGO distribution base.',
  DELIVERED: 'Food has arrived at base. Rescue cycle completing.',
};

export default function ActiveRescuesList({ activeRescues, volunteers, assignVolunteer }: ActiveRescuesListProps) {
  const router = useRouter();
  const [selectedVolunteers, setSelectedVolunteers] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  const handleAssign = async (donationId: string) => {
    const volunteerId = selectedVolunteers[donationId];
    if (!volunteerId) {
      setErrorMap(prev => ({ ...prev, [donationId]: 'Please select a volunteer.' }));
      return;
    }

    setLoadingMap(prev => ({ ...prev, [donationId]: true }));
    setErrorMap(prev => ({ ...prev, [donationId]: null }));

    const res = await assignVolunteer(donationId, volunteerId);
    setLoadingMap(prev => ({ ...prev, [donationId]: false }));

    if (res.success) {
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [donationId]: res.error || 'Failed to assign volunteer.' }));
    }
  };

  return (
    <div className="space-y-6">
      {activeRescues.length === 0 ? (
        <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No active rescues at the moment. Claim a donation from the dashboard first.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {activeRescues.map((rescue) => {
            const error = errorMap[rescue.id];
            const loading = loadingMap[rescue.id];
            const isAssigned = rescue.status !== 'ACCEPTED';
            const assignedVol = rescue.assignment?.volunteer;

            return (
              <div
                key={rescue.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Details Section */}
                <div className="flex-grow space-y-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        {rescue.title}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {rescue.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{rescue.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-150 dark:border-zinc-850">
                    <div>
                      <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Donor</p>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{rescue.donor.organizationName}</p>
                    </div>
                    <div>
                      <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Pickup Location</p>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{rescue.pickupAddress}</p>
                      <a
                        href={buildGoogleMapsSearchUrl(rescue.pickupLatitude, rescue.pickupLongitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
                      >
                        🗺️ Open in Google Maps
                      </a>
                    </div>
                    <div>
                      <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Quantity</p>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {rescue.quantity} {rescue.quantityUnit} ({rescue.estimatedServings || 'N/A'} servings)
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Status Update</p>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                        {STATUS_DESCRIPTION[rescue.status] || 'Processing...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assignment Controls */}
                <div className="flex-shrink-0 md:w-80 flex flex-col justify-center border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 pt-6 md:pt-0 md:pl-6">
                  {error && (
                    <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-red-600 text-xs dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  {!isAssigned ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Assign Volunteer Rider</p>
                      {volunteers.length > 0 ? (
                        <>
                          <select
                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                            value={selectedVolunteers[rescue.id] || ''}
                            onChange={(e) =>
                              setSelectedVolunteers(prev => ({ ...prev, [rescue.id]: e.target.value }))
                            }
                          >
                            <option value="">Select a volunteer...</option>
                            {volunteers.map((vol) => (
                              <option key={vol.id} value={vol.id}>
                                {vol.name} ({vol.phoneNumber})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleAssign(rescue.id)}
                            className="w-full py-2 px-4 border border-transparent rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
                          >
                            {loading ? 'Assigning...' : 'Assign Rider'}
                          </button>
                        </>
                      ) : (
                        <p className="text-xs text-red-500 italic bg-red-50 dark:bg-red-950/20 p-3 rounded">
                          No active volunteers registered under your NGO. Volunteers must sign up under your NGO name to be selectable.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Assigned Volunteer</p>
                      <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{assignedVol?.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{assignedVol?.phoneNumber}</p>
                      </div>
                      
                      {rescue.status === 'VOLUNTEER_ASSIGNED' && (
                        <div className="pt-2">
                          <select
                            className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded text-xs dark:text-zinc-100 mb-2"
                            value={selectedVolunteers[rescue.id] || ''}
                            onChange={(e) =>
                              setSelectedVolunteers(prev => ({ ...prev, [rescue.id]: e.target.value }))
                            }
                          >
                            <option value="">Choose new rider...</option>
                            {volunteers.map((vol) => (
                              <option key={vol.id} value={vol.id}>
                                {vol.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleAssign(rescue.id)}
                            className="w-full py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded text-xs transition-colors"
                          >
                            Reassign Rider
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
