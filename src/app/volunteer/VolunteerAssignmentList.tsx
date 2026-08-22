'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';
import { generatePickupOtp } from '@/app/actions/donations';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';

export interface VolunteerAssignmentItem {
  id: string;
  status: string;
  donation: {
    id: string;
    title: string;
    description: string;
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

export default function VolunteerAssignmentList({ assignments, updateAssignmentStatus }: VolunteerAssignmentListProps) {
  const router = useRouter();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  // Handover OTP inputs
  const [otpMap, setOtpMap] = useState<Record<string, string>>({});
  const [otpSentMap, setOtpSentMap] = useState<Record<string, string | null>>({});

  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : 12;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  };

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

  const handleVerifyOtp = async (assignmentId: string) => {
    const code = otpMap[assignmentId];
    if (!code || code.length !== 6) {
      setErrorMap(prev => ({ ...prev, [assignmentId]: 'Please enter a 6-digit verification code.' }));
      return;
    }

    setLoadingMap(prev => ({ ...prev, [assignmentId]: true }));
    setErrorMap(prev => ({ ...prev, [assignmentId]: null }));

    try {
      const res = await updateAssignmentStatus(assignmentId, 'PICKED_UP', code);
      if (res.success) {
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

    try {
      const res = await updateAssignmentStatus(assignmentId, nextStatus);
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
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6"
        >
          {assignments.map((task) => {
            const error = errorMap[task.id];
            const loading = loadingMap[task.id];
            const otpSent = otpSentMap[task.id];
            
            const currentIdx = STATUS_FLOW.indexOf(task.status);
            const nextStatus = currentIdx !== -1 && currentIdx < STATUS_FLOW.length - 1 
              ? STATUS_FLOW[currentIdx + 1] 
              : null;

            return (
              <motion.div
                key={task.id}
                variants={cardVariants}
                whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                className="bg-surface border border-border rounded-lg p-6 shadow-sm flex flex-col lg:flex-row justify-between gap-6 hover:shadow-md transition-all"
              >
                {/* Details Section */}
                <div className="flex-grow space-y-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {task.donation.title}
                      </h3>
                      <span className="badge-premium bg-primary/5 text-primary border border-primary/10 tracking-widest text-[9px] uppercase font-extrabold px-2.5 py-1">
                        {STATUS_LABELS[task.status] || task.status}
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
                      <span className="text-primary font-extrabold">{task.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1 w-full">
                      {STATUS_FLOW.map((s, idx) => {
                        const done = STATUS_FLOW.indexOf(task.status) >= idx;
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
                        {new Date(task.donation.pickupDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(task.donation.pickupDeadlineAt).toLocaleDateString()})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Operations Actions Panel */}
                <div className="flex-shrink-0 lg:w-80 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-6">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mb-3 p-3 rounded-sm bg-danger-bg border border-danger-border text-danger text-xs font-semibold"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Secure Handover OTP Form when rider has ARRIVED */}
                  {task.status === 'ARRIVED' ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide">Secure Pickup Handover</p>
                        <span className="badge-premium bg-primary/5 text-primary border border-primary/10 tracking-widest text-[9px] uppercase font-extrabold px-2">
                          OTP CHECK
                        </span>
                      </div>

                      <AnimatePresence mode="wait">
                        {otpSent && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-2.5 bg-success-bg border border-success-border rounded-sm text-success text-[11px] font-semibold leading-normal"
                          >
                            ✓ {otpSent}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-3">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleRequestOtp(task.id)}
                          className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5 font-bold hover:scale-[1.01]"
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

                        <motion.button
                          type="button"
                          disabled={loading || (otpMap[task.id] || '').length !== 6}
                          onClick={() => handleVerifyOtp(task.id)}
                          whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                          whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                          className="w-full btn-primary py-2.5 text-xs font-bold shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Verifying...' : 'Verify Handover Code'}
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide">Operational Transit Action</p>
                      {nextStatus ? (
                        <motion.button
                          type="button"
                          disabled={loading}
                          onClick={() => handleStatusUpdate(task.id, nextStatus)}
                          whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                          whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                          className="w-full btn-primary py-3 shadow-md shadow-primary/10"
                        >
                          {loading ? 'Updating...' : `Set status to ${nextStatus.replace(/_/g, ' ')}`}
                        </motion.button>
                      ) : (
                        <div className="bg-success-bg border border-success-border text-success text-xs font-bold p-4 rounded-md text-center">
                          🎉 Rescue task is fully completed!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
