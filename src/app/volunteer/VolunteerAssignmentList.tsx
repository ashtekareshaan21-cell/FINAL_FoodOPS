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
  ngo?: {
    organizationName: string;
    baseAddress: string;
    baseLatitude: number;
    baseLongitude: number;
  };
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
  ASSIGNED: 'Assigned',
  TRAVELING: 'Traveling to Donor',
  ARRIVED: 'Arrived at Donor',
  PICKED_UP: 'Picked Up',
  DELIVERING: 'Delivering to NGO',
  COMPLETED: 'Completed',
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

  const handleStatusUpdate = async (task: VolunteerAssignmentItem, nextStatus: string) => {
    setLoadingMap(prev => ({ ...prev, [task.id]: true }));
    setErrorMap(prev => ({ ...prev, [task.id]: null }));

    let mappedAction = nextStatus;
    if (nextStatus === 'TRAVELING') mappedAction = 'START_PICKUP';
    else if (nextStatus === 'ARRIVED') mappedAction = 'ARRIVE_AT_DONOR';
    else if (nextStatus === 'DELIVERING') mappedAction = 'START_DELIVERY';

    try {
      const res = await updateAssignmentStatus(task.id, mappedAction);
      if (res.success) {
        // Trigger external Google Maps navigation window per requirement 7
        if (mappedAction === 'START_PICKUP') {
          const url = buildGoogleMapsSearchUrl(task.donation.pickupLatitude, task.donation.pickupLongitude);
          window.open(url, '_blank', 'noopener,noreferrer');
        } else if (mappedAction === 'START_DELIVERY' && task.ngo?.baseLatitude && task.ngo?.baseLongitude) {
          const url = buildGoogleMapsSearchUrl(task.ngo.baseLatitude, task.ngo.baseLongitude);
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        router.refresh();
      } else {
        setErrorMap(prev => ({ ...prev, [task.id]: res.error || 'Failed to update status.' }));
      }
    } catch (err) {
      setErrorMap(prev => ({ ...prev, [task.id]: 'Failed to update assignment status.' }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [task.id]: false }));
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
                className="volunteer-card bg-surface border border-border rounded-lg p-6 shadow-sm flex flex-col lg:flex-row justify-between gap-6 hover:shadow-md hover:scale-[1.005] hover:-translate-y-0.5 transition-all duration-300 opacity-100"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#f0f4f1] p-4 rounded-xl border border-emerald-200/80 font-medium text-slate-700">
                    <div>
                      <p className="font-bold text-[#0b3c26] uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <span>🏨</span> Donor Facility Location
                      </p>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">{task.donation.donor.organizationName}</p>
                      <p className="text-slate-600 font-mono mt-0.5">{task.donation.pickupAddress}</p>
                      <p className="text-slate-500 font-semibold mt-0.5">📞 {task.donation.donor.user?.phoneNumber || 'Phone on file'}</p>
                    </div>

                    <div>
                      <p className="font-bold text-[#0b3c26] uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <span>🏛️</span> Receiver NGO Location
                      </p>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">{task.ngo?.organizationName || 'Receiver NGO'}</p>
                      <p className="text-slate-600 font-mono mt-0.5">{task.ngo?.baseAddress || 'Base address on record'}</p>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-emerald-200/60 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">Item:</span>
                        <span className="font-bold text-[#0b3c26] bg-emerald-100 px-2 py-0.5 rounded">{task.donation.quantity} {task.donation.quantityUnit} &bull; {task.donation.title}</span>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Deadline: <ClientDateTime date={task.donation.pickupDeadlineAt} />
                      </div>
                    </div>
                  </div>

                  {/* SVG Route Rider tracking animation */}
                  <DeliveryRouteTracker status={MAPPED_STATUS[uiStatus] || 'ACCEPTED'} className="mt-4" />
                </div>

                {/* Operations Actions Panel */}
                <div className="flex-shrink-0 lg:w-80 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
                  {error && (
                    <div 
                      className="mb-3 p-3 rounded-md bg-danger-bg border border-danger-border text-danger text-xs font-semibold animate-fade-in"
                    >
                      {error}
                    </div>
                  )}

                  {/* Secure Handover OTP Form when rider has ARRIVED */}
                  {uiStatus === 'ARRIVED' ? (
                    <div className="space-y-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-extrabold text-[#0b3c26] uppercase tracking-wide">Donor Pickup Handover</p>
                        <span className="status-badge status-badge-active text-[10px]">
                          OTP VERIFICATION
                        </span>
                      </div>

                      {otpSent && (
                        <div 
                          className="p-2.5 bg-success-bg border border-success-border rounded-md text-success text-[11px] font-semibold leading-normal animate-fade-in"
                        >
                          ✓ {otpSent}
                        </div>
                      )}

                      <div className="space-y-3">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleRequestOtp(task.id)}
                          className="w-full btn-secondary text-xs py-3 min-h-[44px] flex items-center justify-center gap-1.5 font-bold hover:bg-white"
                        >
                          ✉️ Request OTP Code from Donor
                        </button>

                        <div className="relative">
                          <input
                            type="text"
                            maxLength={6}
                            disabled={loading}
                            className="input-premium py-3 px-3 text-center text-base font-mono tracking-widest font-bold uppercase placeholder:tracking-normal placeholder:font-sans min-h-[44px]"
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
                          className="w-full btn-primary py-3.5 text-sm font-extrabold min-h-[44px] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Verifying Code...' : 'Verify Pickup Handover ✓'}
                        </button>
                      </div>
                    </div>
                  ) : uiStatus === 'DELIVERING' ? (
                    <div className="space-y-4 bg-teal-50/50 p-4 rounded-xl border border-teal-200">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-extrabold text-teal-900 uppercase tracking-wide">NGO Delivery Handover</p>
                        <span className="status-badge bg-teal-100 text-teal-800 border-teal-300 text-[10px]">
                          FINAL HANDOVER
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white p-3 rounded-lg border border-teal-100">
                        Ask NGO coordinator to generate a Delivery Handover OTP from their dashboard and enter it below.
                      </p>

                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={6}
                            disabled={loading}
                            className="input-premium py-3 px-3 text-center text-base font-mono tracking-widest font-bold uppercase placeholder:tracking-normal placeholder:font-sans min-h-[44px]"
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
                          className="w-full btn-primary py-3.5 text-sm font-extrabold min-h-[44px] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Verifying...' : 'Verify Delivery & Complete 🏁'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs font-extrabold text-[#0b3c26] uppercase tracking-wide">Operational Transit Action</p>
                      {nextStatus ? (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleStatusUpdate(task, nextStatus)}
                          className="w-full btn-primary py-3.5 text-sm font-extrabold min-h-[48px] shadow-md hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150 flex items-center justify-center gap-2"
                        >
                          {loading ? 'Updating...' : `Set Status to ${nextStatus.replace(/_/g, ' ')} 🚀`}
                        </button>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 text-[#0b3c26] text-xs font-bold p-4 rounded-xl text-center animate-fade-in">
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
