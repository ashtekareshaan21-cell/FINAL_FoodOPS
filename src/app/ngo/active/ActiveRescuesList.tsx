'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';
import { divertDonationToBiogas, generateDeliveryOtp } from '@/app/actions/donations';
import { prefersReducedMotion } from '@/animations/accessibility';
import { staggerCards } from '@/animations/cards';
import { DeliveryRouteTracker } from '@/animations/delivery';

export interface ActiveRescueItem {
  id: string;
  title: string;
  description: string;
  status: string;
  assignment?: {
    id: string;
    volunteer?: {
      name: string;
      phoneNumber: string;
    } | null;
  } | null;
  donor: {
    organizationName: string;
  };
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  quantity: string;
  quantityUnit: string;
  estimatedServings?: number | null;
}

export interface VolunteerItem {
  id: string;
  name: string;
  phoneNumber: string;
}

interface ActiveRescuesListProps {
  activeRescues: ActiveRescueItem[];
  volunteers: VolunteerItem[];
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

  const [spoilLoadingMap, setSpoilLoadingMap] = useState<Record<string, boolean>>({});
  const [spoilReasonMap, setSpoilReasonMap] = useState<Record<string, string>>({});
  const [showSpoilConfirm, setShowSpoilConfirm] = useState<Record<string, boolean>>({});

  const [deliveryOtpMap, setDeliveryOtpMap] = useState<Record<string, string>>({});
  const [otpLoadingMap, setOtpLoadingMap] = useState<Record<string, boolean>>({});

  const handleGenOtp = async (assignmentId: string, rescueId: string) => {
    setOtpLoadingMap(prev => ({ ...prev, [rescueId]: true }));
    setErrorMap(prev => ({ ...prev, [rescueId]: null }));
    try {
      const res = await generateDeliveryOtp(assignmentId);
      if (res.success && 'otp' in res) {
        setDeliveryOtpMap(prev => ({ ...prev, [rescueId]: res.otp || '' }));
      } else {
        setErrorMap(prev => ({ ...prev, [rescueId]: ('error' in res && res.error) || 'Failed to generate delivery OTP.' }));
      }
    } catch (err) {
      setErrorMap(prev => ({ ...prev, [rescueId]: 'Failed to generate OTP.' }));
    } finally {
      setOtpLoadingMap(prev => ({ ...prev, [rescueId]: false }));
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const cards = el.querySelectorAll('.rescue-card');
    const anim = staggerCards(cards);
    return () => {
      if (anim) anim.revert();
    };
  }, [activeRescues]);

  const handleDivert = async (donationId: string) => {
    const reason = spoilReasonMap[donationId] || 'Uncollected / Expired';
    setSpoilLoadingMap(prev => ({ ...prev, [donationId]: true }));
    setErrorMap(prev => ({ ...prev, [donationId]: null }));

    const res = await divertDonationToBiogas(donationId, reason);
    setSpoilLoadingMap(prev => ({ ...prev, [donationId]: false }));

    if (res.success) {
      setShowSpoilConfirm(prev => ({ ...prev, [donationId]: false }));
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [donationId]: res.error || 'Failed to divert donation.' }));
    }
  };

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
        <div className="text-center bg-surface border border-border rounded-lg p-16 shadow-sm">
          <span className="text-3xl block mb-3 animate-pulse">🛰️</span>
          <p className="text-sm text-muted-text font-medium">
            No active rescues at the moment. Claim a donation from the dashboard first.
          </p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="grid gap-6"
        >
          {activeRescues.map((rescue) => {
            const error = errorMap[rescue.id];
            const loading = loadingMap[rescue.id];
            const isAssigned = rescue.status !== 'ACCEPTED';
            const assignedVol = rescue.assignment?.volunteer;

            return (
              <div
                key={rescue.id}
                className="rescue-card bg-surface border border-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md hover:scale-[1.005] hover:-translate-y-0.5 transition-all duration-300 opacity-100"
              >
                {/* Details Section */}
                <div className="flex-grow space-y-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {rescue.title}
                      </h3>
                      <span className="badge-premium bg-primary/5 text-primary border border-primary/10 tracking-widest text-[9px] uppercase font-extrabold px-2.5 py-1">
                        {rescue.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-text max-w-xl font-medium">{rescue.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface-muted p-4 rounded-md border border-border font-medium text-muted-text">
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Donor</p>
                      <p className="font-semibold text-foreground mt-0.5">{rescue.donor.organizationName}</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Pickup Location</p>
                      <p className="font-semibold text-foreground mt-0.5">{rescue.pickupAddress}</p>
                      <a
                        href={buildGoogleMapsSearchUrl(rescue.pickupLatitude, rescue.pickupLongitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-1.5"
                      >
                        🗺️ Open in Google Maps &rarr;
                      </a>
                    </div>
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Quantity</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {rescue.quantity} {rescue.quantityUnit} &bull; <span className="text-primary font-bold">{rescue.estimatedServings || 'N/A'} meals</span>
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Status Update</p>
                      <p className="font-semibold text-primary font-mono mt-0.5">
                        {STATUS_DESCRIPTION[rescue.status] || 'Processing...'}
                      </p>
                    </div>
                  </div>

                  {/* SVG Route Rider tracking animation */}
                  <DeliveryRouteTracker status={rescue.status} className="mt-4" />
                </div>

                {/* Assignment Controls */}
                <div className="flex-shrink-0 md:w-80 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6">
                  {error && (
                    <div className="mb-3 p-3 rounded-sm bg-danger-bg border border-danger-border text-danger text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  {!isAssigned ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide">Assign Volunteer Rider</p>
                      {volunteers.length > 0 ? (
                        <>
                          <select
                            className="input-premium py-2 px-3 text-xs"
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
                            className="w-full btn-primary py-2.5 hover:scale-[1.01]"
                          >
                            {loading ? 'Assigning...' : 'Assign Rider'}
                          </button>
                        </>
                      ) : (
                        <p className="text-xs text-danger italic bg-danger-bg border border-danger-border p-3 rounded-sm font-semibold">
                          No active volunteers registered under your NGO. Volunteers must sign up under your NGO name to be selectable.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Assigned Volunteer</p>
                      <div className="bg-surface-muted p-4 rounded-md border border-border">
                        <p className="text-sm font-bold text-foreground">{assignedVol?.name}</p>
                        <p className="text-xs text-muted-text mt-0.5 font-semibold font-mono">{assignedVol?.phoneNumber}</p>
                      </div>
                      
                      {rescue.status === 'VOLUNTEER_ASSIGNED' && (
                        <div className="pt-2">
                          <select
                            className="input-premium py-2 px-3 text-xs mb-2"
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
                            className="w-full btn-secondary py-2 text-xs hover:scale-[1.01]"
                          >
                            Reassign Rider
                          </button>
                        </div>
                      )}

                      {(rescue.status === 'PICKED_UP' || rescue.status === 'DELIVERY_IN_PROGRESS') && rescue.assignment?.id && (
                        <div className="pt-4 border-t border-border mt-3 space-y-3">
                          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Secure Handover Code</p>
                          {deliveryOtpMap[rescue.id] ? (
                            <div className="bg-success-bg border border-success-border text-success font-mono font-bold text-center text-lg p-3 rounded-md animate-fade-in tracking-wider">
                              Delivery OTP: {deliveryOtpMap[rescue.id]}
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={otpLoadingMap[rescue.id]}
                              onClick={() => handleGenOtp(rescue.assignment!.id, rescue.id)}
                              className="w-full btn-primary py-2.5 text-xs hover:scale-[1.01]"
                            >
                              {otpLoadingMap[rescue.id] ? 'Generating...' : '🔑 Generate Handover OTP'}
                            </button>
                          )}
                          <p className="text-[10px] text-muted-text italic">
                            Share this 6-digit code with the volunteer rider once they arrive at your base to complete delivery.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Divert to Biogas Section */}
                  <div className="mt-6 pt-4 border-t border-dashed border-border">
                    {showSpoilConfirm[rescue.id] ? (
                      <div 
                        className="space-y-3 bg-surface-muted p-4 rounded-md border border-border transition-all duration-300"
                      >
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                          Divert Reason
                        </p>
                        <select
                          className="input-premium py-2 px-3 text-xs"
                          value={spoilReasonMap[rescue.id] || ''}
                          onChange={(e) => setSpoilReasonMap(prev => ({ ...prev, [rescue.id]: e.target.value }))}
                        >
                          <option value="">Select a reason...</option>
                          <option value="Food spoiled / bad odor">Food spoiled / bad odor</option>
                          <option value="Packaging damaged or leaking">Packaging damaged or leaking</option>
                          <option value="Deadline expired and rider delayed">Deadline expired and rider delayed</option>
                          <option value="Other organic waste / leftovers">Other organic waste / leftovers</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={spoilLoadingMap[rescue.id]}
                            onClick={() => handleDivert(rescue.id)}
                            className="flex-grow btn-primary py-2 text-xs hover:scale-[1.01] bg-warning hover:bg-warning/90"
                          >
                            {spoilLoadingMap[rescue.id] ? 'Diverting...' : 'Confirm Biogas Divert'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSpoilConfirm(prev => ({ ...prev, [rescue.id]: false }))}
                            className="btn-secondary py-2 px-3 text-xs hover:scale-[1.01]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSpoilConfirm(prev => ({ ...prev, [rescue.id]: true }))}
                        className="w-full btn-secondary hover:scale-[1.01] border-warning/30 hover:border-warning text-warning hover:bg-warning-bg py-2 text-xs flex items-center justify-center gap-1.5"
                      >
                        🗑️ Mark Spoiled / Divert to Biogas
                      </button>
                    )}
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
