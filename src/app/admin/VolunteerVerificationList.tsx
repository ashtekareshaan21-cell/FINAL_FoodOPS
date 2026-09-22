'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import ClientDateTime from '@/components/ClientDateTime';

export interface VolunteerItem {
  id: string;
  name: string;
  phoneNumber: string;
  city?: string | null;
  operatingArea?: string | null;
  vehicleInfo?: string | null;
  status: string;
  verificationStatus: string;
  rejectionReason?: string | null;
  createdAt: Date | string;
  ngo: {
    id: string;
    organizationName: string;
    baseAddress: string;
    city?: string | null;
  };
  user: {
    email: string;
    phoneNumber: string;
    isPhoneVerified: boolean;
    accountStatus: string;
  };
}

interface VolunteerVerificationListProps {
  volunteers: VolunteerItem[];
  verifyVolunteer: (volunteerId: string) => Promise<{ success: boolean; error?: string }>;
  rejectVolunteer: (volunteerId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

export default function VolunteerVerificationList({
  volunteers,
  verifyVolunteer,
  rejectVolunteer,
}: VolunteerVerificationListProps) {
  const router = useRouter();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [activeRejectMap, setActiveRejectMap] = useState<Record<string, boolean>>({});

  const shouldReduceMotion = useReducedMotion();

  const handleApprove = async (volunteerId: string) => {
    setLoadingMap((prev) => ({ ...prev, [volunteerId]: true }));
    setErrorMap((prev) => ({ ...prev, [volunteerId]: null }));

    const res = await verifyVolunteer(volunteerId);
    setLoadingMap((prev) => ({ ...prev, [volunteerId]: false }));

    if (res.success) {
      router.refresh();
    } else {
      setErrorMap((prev) => ({ ...prev, [volunteerId]: res.error || 'Approval failed.' }));
    }
  };

  const handleReject = async (volunteerId: string) => {
    const reason = rejectionReasons[volunteerId] || 'Volunteer identity or credentials incomplete.';
    setLoadingMap((prev) => ({ ...prev, [volunteerId]: true }));
    setErrorMap((prev) => ({ ...prev, [volunteerId]: null }));

    const res = await rejectVolunteer(volunteerId, reason);
    setLoadingMap((prev) => ({ ...prev, [volunteerId]: false }));

    if (res.success) {
      setActiveRejectMap((prev) => ({ ...prev, [volunteerId]: false }));
      router.refresh();
    } else {
      setErrorMap((prev) => ({ ...prev, [volunteerId]: res.error || 'Rejection failed.' }));
    }
  };

  const pendingCount = volunteers.filter((v) => v.verificationStatus === 'PENDING_VERIFICATION').length;

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Rescue Riders & Volunteer Verification</h2>
          <p className="text-xs text-muted-text font-medium">
            Review onboarding volunteer riders, affiliated rescue NGOs, vehicle data, and approve platform transit rights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="badge-premium bg-warning-bg text-warning border border-warning-border tracking-widest text-[10px] uppercase font-extrabold px-2 py-1">
              {pendingCount} Pending Review
            </span>
          )}
          <span className="badge-premium bg-primary/5 text-primary border border-primary/10 tracking-widest text-[10px] uppercase font-extrabold px-2.5 py-1">
            {volunteers.length} Total Riders
          </span>
        </div>
      </div>

      {volunteers.length === 0 ? (
        <p className="text-xs text-muted-text text-center py-8">No volunteer riders registered in database.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-xs text-left">
            <thead>
              <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                <th className="pb-3 pr-4">Rider / Volunteer</th>
                <th className="pb-3 pr-4">Affiliated NGO</th>
                <th className="pb-3 pr-4">Contact & Phone</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Vehicle & Area</th>
                <th className="pb-3 pr-4">Verification</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-muted-text">
              {volunteers.map((v) => {
                const loading = loadingMap[v.id];
                const error = errorMap[v.id];
                const showRejectInput = activeRejectMap[v.id];

                return (
                  <tr key={v.id} className="hover:bg-surface-muted transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚴</span>
                        <div>
                          <p className="font-bold text-foreground">{v.name}</p>
                          <p className="text-[10px] text-muted-light">
                            Registered <ClientDateTime date={v.createdAt} />
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-bold text-foreground">{v.ngo.organizationName}</p>
                      <p className="text-[10px] text-muted-light max-w-[140px] truncate">{v.ngo.baseAddress}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-mono text-foreground font-semibold">{v.phoneNumber || v.user.phoneNumber}</p>
                      <span
                        className={`inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-sm ${
                          v.user.isPhoneVerified
                            ? 'bg-success-bg text-success border border-success-border'
                            : 'bg-warning-bg text-warning border border-warning-border'
                        }`}
                      >
                        {v.user.isPhoneVerified ? '✓ Phone Verified' : '⚠ OTP Pending'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-muted-light">{v.user.email}</td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-foreground">{v.vehicleInfo || 'Standard Courier'}</p>
                      <p className="text-[10px] text-muted-light">{v.operatingArea || v.city || 'Bengaluru Metro'}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          v.verificationStatus === 'VERIFIED'
                            ? 'bg-success-bg text-success border border-success-border'
                            : v.verificationStatus === 'REJECTED'
                            ? 'bg-danger-bg text-danger border border-danger-border'
                            : 'bg-warning-bg text-warning border border-warning-border animate-pulse'
                        }`}
                      >
                        {v.verificationStatus}
                      </span>
                      {v.rejectionReason && (
                        <p className="text-[10px] text-danger mt-1 italic max-w-[140px] truncate">
                          {v.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1.5">
                        {error && <p className="text-[10px] text-danger font-semibold mb-1">{error}</p>}

                        <div className="flex items-center gap-2">
                          {v.verificationStatus !== 'VERIFIED' ? (
                            <motion.button
                              type="button"
                              onClick={() => handleApprove(v.id)}
                              disabled={loading}
                              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                              className="px-2.5 py-1 bg-primary text-primary-foreground font-bold rounded hover:opacity-90 transition-opacity disabled:opacity-50 text-[11px] cursor-pointer"
                            >
                              {loading ? 'Processing...' : 'Verify Rider'}
                            </motion.button>
                          ) : (
                            <span className="text-[11px] text-success font-bold flex items-center gap-1">
                              <span>✓</span> Active Rider
                            </span>
                          )}

                          {v.verificationStatus !== 'REJECTED' && !showRejectInput && (
                            <button
                              type="button"
                              onClick={() => setActiveRejectMap((prev) => ({ ...prev, [v.id]: true }))}
                              disabled={loading}
                              className="px-2 py-1 bg-surface border border-border text-muted-text hover:text-danger hover:border-danger/30 font-semibold rounded transition-colors text-[11px] cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </div>

                        {showRejectInput && (
                          <div className="mt-2 flex flex-col gap-1.5 p-2 bg-surface-muted border border-border rounded">
                            <input
                              type="text"
                              placeholder="Rejection reason..."
                              value={rejectionReasons[v.id] || ''}
                              onChange={(e) =>
                                setRejectionReasons((prev) => ({ ...prev, [v.id]: e.target.value }))
                              }
                              className="w-full text-xs p-1.5 border border-border rounded bg-surface text-foreground"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleReject(v.id)}
                                disabled={loading}
                                className="px-2 py-1 bg-danger text-white rounded text-[10px] font-bold hover:opacity-90 cursor-pointer"
                              >
                                Confirm Rejection
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveRejectMap((prev) => ({ ...prev, [v.id]: false }))}
                                className="px-2 py-1 border border-border text-muted text-[10px] rounded hover:text-foreground cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
