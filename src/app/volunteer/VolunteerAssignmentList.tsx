'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';
import { generatePickupOtp } from '@/app/actions/donations';
import ClientDateTime from '@/components/ClientDateTime';
import { prefersReducedMotion } from '@/animations/accessibility';
import { staggerCards } from '@/animations/cards';
import { DeliveryRouteTracker } from '@/animations/delivery';

export interface VolunteerAssignmentItem {
  id: string;
  status: string;
  donation: {
    id: string;
    title: string;
    description: string;
    status: string;
    foodCategory: string;
    vegNonVegMixed: string;
    quantity: string;
    quantityUnit: string;
    pickupAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    pickupDeadlineAt: Date | string;
    donor: {
      organizationName: string;
      user: {
        phoneNumber: string;
      };
    };
  };
}

interface VolunteerAssignmentListProps {
  assignments: VolunteerAssignmentItem[];
  updateAssignmentStatus: (assignmentId: string, action: string, otp?: string) => Promise<{ success: boolean; error?: string; status?: string }>;
}

const STATUS_FLOW = ['ASSIGNED', 'TRAVELING', 'ARRIVED', 'PICKED_UP', 'DELIVERING', 'COMPLETED'];

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: '📍 Assigned',
  TRAVELING: '🚴 Traveling',
  ARRIVED: '🏁 Arrived at Donor',
  PICKED_UP: '📦 Picked Up',
  DELIVERING: '🚛 Delivering to NGO',
  COMPLETED: '✓ Completed',
};

// Map Volunteer status names to Delivery tracker status names
const MAPPED_STATUS: Record<string, string> = {
  ASSIGNED: 'VOLUNTEER_ASSIGNED',
  TRAVELING: 'PICKUP_IN_PROGRESS',
  ARRIVED: 'ARRIVED',
  PICKED_UP: 'PICKED_UP',
  DELIVERING: 'DELIVERY_IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

function getUIStatus(assignmentStatus: string, donationStatus: string): string {
  if (assignmentStatus === 'COMPLETED') return 'COMPLETED';
  if (donationStatus === 'DELIVERY_IN_PROGRESS') return 'DELIVERING';
  if (donationStatus === 'PICKED_UP') return 'PICKED_UP';
  if (assignmentStatus === 'ARRIVED') return 'ARRIVED';
  if (assignmentStatus === 'STARTED') return 'TRAVELING';
  return 'ASSIGNED';
}

export default function VolunteerAssignmentList({ assignments, updateAssignmentStatus }: VolunteerAssignmentListProps) {
  const router = useRouter();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  // Handover OTP inputs
  const [otpMap, setOtpMap] = useState<Record<string, string>>({});
  const [otpSentMap, setOtpSentMap] = useState<Record<string, string | null>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const cards = el.querySelectorAll('.volunteer-card');
    const anim = staggerCards(cards);
    return () => {
      if (anim) anim.revert();
    };
  }, [assignments]);

  const handleRequestOtp = async (assignmentId: string) => {
    setLoadingMap(prev => ({ ...prev, [assignmentId]: true }));
    setErrorMap(prev => ({ ...prev, [assignmentId]: null }));
    setOtpSentMap(prev => ({ ...prev, [assignmentId]: null }));

    try {
      const res = await generatePickupOtp(assignmentId);
      if (res.success && 'message' in res) {
        setOtpSentMap(prev => ({ ...prev, [assignmentId]: res.message || 'OTP requested successfully!' }));
      } else if ('error' in res && res.error) {
        setErrorMap(prev => ({ ...prev, [assignmentId]: res.error }));
      } else {
        setErrorMap(prev => ({ ...prev, [assignmentId]: 'Failed to request OTP.' }));
      }
    } catch (err) {
      setErrorMap(prev => ({ ...prev, [assignmentId]: 'Failed to contact server.' }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleVerifyOtp = async (assignmentId: string, actionType: 'CONFIRM_PICKUP' | 'CONFIRM_DELIVERY') => {
    const code = otpMap[assignmentId];
    if (!code || code.length !== 6) {
      setErrorMap(prev => ({ ...prev, [assignmentId]: 'Please enter a 6-digit verification code.' }));
      return;
    }

    setLoadingMap(prev => ({ ...prev, [assignmentId]: true }));
    setErrorMap(prev => ({ ...prev, [assignmentId]: null }));

    try {
      const res = await updateAssignmentStatus(assignmentId, actionType, code);
      if (res.success) {
        setOtpMap(prev => ({ ...prev, [assignmentId]: '' }));
        router.refresh();
      } else {
        setErrorMap(prev => ({ ...prev, [assignmentId]: res.error || 'Invalid OTP code.' }));
      }
    } catch (err) {
      setErrorMap(prev => ({ ...prev, [assignmentId]: 'OTP verification failed.' }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleStatusUpdate = async (assignmentId: string, nextStatus: string) => {
    setLoadingMap(prev => ({ ...prev, [assignmentId]: true }));
    setErrorMap(prev => ({ ...prev, [assignmentId]: null }));

    let mappedAction = nextStatus;
    if (nextStatus === 'TRAVELING') mappedAction = 'START_PICKUP';
    else if (nextStatus === 'ARRIVED') mappedAction = 'ARRIVE_AT_DONOR';
    else if (nextStatus === 'DELIVERING') mappedAction = 'START_DELIVERY';

    try {
      const res = await updateAssignmentStatus(assignmentId, mappedAction);
      if (res.success) {
        router.refresh();
      } else {
        setErrorMap(prev => ({ ...prev, [assignmentId]: res.error || 'Failed to update status.' }));
      }
    } catch (err) {
      setErrorMap(prev => ({ ...prev, [assignmentId]: 'Failed to update assignment status.' }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {assignments.length === 0 ? (
        <div className="text-center bg-surface border border-border rounded-lg p-16 shadow-sm">
          <span className="text-3xl block mb-3 animate-pulse">🛰️</span>
          <p className="text-sm text-muted-text font-medium">
            No active assignment tasks routed to your user at the moment.
          </p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="grid gap-6"
        >
          {assignments.map((task) => {
            const error = errorMap[task.id];
            const loading = loadingMap[task.id];
            const otpSent = otpSentMap[task.id];
            
            const uiStatus = getUIStatus(task.status, task.donation.status);
            const currentIdx = STATUS_FLOW.indexOf(uiStatus);
            const nextStatus = currentIdx !== -1 && currentIdx < STATUS_FLOW.length - 1 
              ? STATUS_FLOW[currentIdx + 1] 
              : null;

            return (
              <div
                key={task.id}
                className={`volunteer-card bg-surface border border-border rounded-lg p-6 shadow-sm flex flex-col lg:flex-row justify-between gap-6 hover:shadow-md hover:scale-[1.005] hover:-translate-y-0.5 transition-all duration-300 ${
                  mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {/* Details Section */}
                <div className="flex-grow space-y-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {task.donation.title}
                      </h3>
                      <span className="badge-premium bg-primary/5 text-primary border border-primary/10 tracking-widest text-[9px] uppercase font-extrabold px-2.5 py-1">
                        {STATUS_LABELS[uiStatus] || uiStatus}
                      </span>
                    </div>
                    <p className="text-xs text-muted-text max-w-xl font-medium leading-relaxed">
                      {task.donation.description}
                    </p>
                  </div>

                  {/* Horizontal visual progress tracker */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[9px] font-bold text-muted-light mb-1.5 uppercase tracking-wider">
                      <span>Assignment Progress</span>
                      <span className="text-primary font-extrabold">{uiStatus.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1 w-full">
                      {STATUS_FLOW.map((s, idx) => {
                        const done = STATUS_FLOW.indexOf(uiStatus) >= idx;
                        return (
                          <div 
                            key={s} 
                            className={`h-1.5 rounded-full transition-colors duration-500 ${
                              done ? 'bg-primary' : 'bg-border'
                            }`}
                            title={STATUS_LABELS[s]}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface-muted p-4 rounded-md border border-border font-medium text-muted-text">
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Donor Facility</p>
                      <p className="font-semibold text-foreground mt-0.5">{task.donation.donor.organizationName}</p>
                      <p className="text-muted-light mt-0.5">{task.donation.donor.user?.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Pickup Address</p>
                      <p className="font-semibold text-foreground mt-0.5">{task.donation.pickupAddress}</p>
                      <a
                        href={buildGoogleMapsSearchUrl(task.donation.pickupLatitude, task.donation.pickupLongitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-1.5"
                      >
                        🗺️ View Map Routing &rarr;
                      </a>
                    </div>
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Food Metrics</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {task.donation.quantity} {task.donation.quantityUnit} &bull; <span className="text-primary font-bold">Category: {task.donation.foodCategory}</span>
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Expiry Deadline</p>
                      <p className="font-semibold text-danger font-mono mt-0.5">
                        <ClientDateTime date={task.donation.pickupDeadlineAt} />
                      </p>
                    </div>
                  </div>

                  {/* SVG Route Rider tracking animation */}
                  <DeliveryRouteTracker status={MAPPED_STATUS[uiStatus] || 'ACCEPTED'} className="mt-4" />
                </div>

                {/* Operations Actions Panel */}
                <div className="flex-shrink-0 lg:w-80 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-6">
                  {error && (
                    <div 
                      className="mb-3 p-3 rounded-sm bg-danger-bg border border-danger-border text-danger text-xs font-semibold animate-fade-in"
                    >
                      {error}
                    </div>
                  )}

                  {/* Secure Handover OTP Form when rider has ARRIVED */}
                  {uiStatus === 'ARRIVED' ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide">Secure Pickup Handover</p>
                        <span className="badge-premium bg-primary/5 text-primary border border-primary/10 tracking-widest text-[9px] uppercase font-extrabold px-2">
                          OTP CHECK
                        </span>
                      </div>

                      {otpSent && (
                        <div 
                          className="p-2.5 bg-success-bg border border-success-border rounded-sm text-success text-[11px] font-semibold leading-normal animate-fade-in"
                        >
                          ✓ {otpSent}
                        </div>
                      )}

                      <div className="space-y-3">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleRequestOtp(task.id)}
                          className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5 font-bold hover:scale-[1.01] transition-transform duration-150"
                        >
                          ✉️ Request OTP Code from Donor
                        </button>

                        <div className="relative">
                          <input
                            type="text"
                            maxLength={6}
                            disabled={loading}
                            className="input-premium py-2.5 px-3 text-center text-sm font-mono tracking-widest font-bold uppercase placeholder:tracking-normal placeholder:font-sans"
                            placeholder="Enter 6-Digit OTP"
                            value={otpMap[task.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setOtpMap(prev => ({ ...prev, [task.id]: val }));
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          disabled={loading || (otpMap[task.id] || '').length !== 6}
                          onClick={() => handleVerifyOtp(task.id, 'CONFIRM_PICKUP')}
                          className="w-full btn-primary py-2.5 text-xs font-bold shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                          {loading ? 'Verifying...' : 'Verify Handover Code'}
                        </button>
                      </div>
                    </div>
                  ) : uiStatus === 'DELIVERING' ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide">Secure Delivery Handover</p>
                        <span className="badge-premium bg-primary/5 text-primary border border-primary/10 tracking-widest text-[9px] uppercase font-extrabold px-2">
                          OTP CHECK
                        </span>
                      </div>

                      <p className="text-[10px] text-muted-text font-medium leading-relaxed bg-surface-muted p-2.5 rounded-sm border border-border">
                        Ask NGO coordinator to generate a Delivery Handover OTP from their dashboard and enter it below.
                      </p>

                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={6}
                            disabled={loading}
                            className="input-premium py-2.5 px-3 text-center text-sm font-mono tracking-widest font-bold uppercase placeholder:tracking-normal placeholder:font-sans"
                            placeholder="Enter 6-Digit OTP"
                            value={otpMap[task.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setOtpMap(prev => ({ ...prev, [task.id]: val }));
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          disabled={loading || (otpMap[task.id] || '').length !== 6}
                          onClick={() => handleVerifyOtp(task.id, 'CONFIRM_DELIVERY')}
                          className="w-full btn-primary py-2.5 text-xs font-bold shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                          {loading ? 'Verifying...' : 'Verify Delivery Handover'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide">Operational Transit Action</p>
                      {nextStatus ? (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleStatusUpdate(task.id, nextStatus)}
                          className="w-full btn-primary py-3 shadow-md shadow-primary/10 hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150"
                        >
                          {loading ? 'Updating...' : `Set status to ${nextStatus.replace(/_/g, ' ')}`}
                        </button>
                      ) : (
                        <div className="bg-success-bg border border-success-border text-success text-xs font-bold p-4 rounded-md text-center animate-fade-in">
                          🎉 Rescue task is fully completed!
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
