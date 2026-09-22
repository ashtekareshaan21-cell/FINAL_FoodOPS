'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import ClientDateTime from '@/components/ClientDateTime';

export interface DonorItem {
  id: string;
  organizationName: string;
  organizationType: string;
  contactPerson: string;
  address: string;
  city?: string | null;
  latitude: number;
  longitude: number;
  verificationStatus: string;
  rejectionReason?: string | null;
  createdAt: Date | string;
  user: {
    email: string;
    phoneNumber: string;
    isPhoneVerified: boolean;
    accountStatus: string;
  };
  _count?: {
    donations: number;
  };
}

interface DonorVerificationListProps {
  donors: DonorItem[];
  verifyDonor: (donorId: string) => Promise<{ success: boolean; error?: string }>;
  rejectDonor: (donorId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

export default function DonorVerificationList({ donors, verifyDonor, rejectDonor }: DonorVerificationListProps) {
  const router = useRouter();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [activeRejectMap, setActiveRejectMap] = useState<Record<string, boolean>>({});

  const shouldReduceMotion = useReducedMotion();

  const handleApprove = async (donorId: string) => {
    setLoadingMap(prev => ({ ...prev, [donorId]: true }));
    setErrorMap(prev => ({ ...prev, [donorId]: null }));

    const res = await verifyDonor(donorId);
    setLoadingMap(prev => ({ ...prev, [donorId]: false }));

    if (res.success) {
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [donorId]: res.error || 'Approval failed.' }));
    }
  };

  const handleReject = async (donorId: string) => {
    const reason = rejectionReasons[donorId] || 'Donor verification credentials incomplete.';
    setLoadingMap(prev => ({ ...prev, [donorId]: true }));
    setErrorMap(prev => ({ ...prev, [donorId]: null }));

    const res = await rejectDonor(donorId, reason);
    setLoadingMap(prev => ({ ...prev, [donorId]: false }));

    if (res.success) {
      setActiveRejectMap(prev => ({ ...prev, [donorId]: false }));
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [donorId]: res.error || 'Rejection failed.' }));
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Donor Verification Management</h2>
          <p className="text-xs text-muted-text font-medium">Verify organization identities, phone verification status, and listing rights.</p>
        </div>
        <span className="badge-premium bg-primary/5 text-primary border border-primary/10 tracking-widest text-[10px] uppercase font-extrabold px-2.5 py-1">
          {donors.length} Registered Donors
        </span>
      </div>

      {donors.length === 0 ? (
        <p className="text-xs text-muted-text text-center py-8">No donor profiles found in database.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-xs text-left">
            <thead>
              <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                <th className="pb-3 pr-4">Donor Organization</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Contact Person</th>
                <th className="pb-3 pr-4">Phone & OTP Status</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Donations</th>
                <th className="pb-3 pr-4">Verification</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-muted-text">
              {donors.map((d) => {
                const loading = loadingMap[d.id];
                const error = errorMap[d.id];
                const showRejectInput = activeRejectMap[d.id];

                return (
                  <tr key={d.id} className="hover:bg-surface-muted transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-foreground">{d.organizationName}</p>
                      <p className="text-[10px] text-muted-light max-w-[140px] truncate">{d.address}</p>
                    </td>
                    <td className="py-3 pr-4 font-mono uppercase text-[10px]">{d.organizationType}</td>
                    <td className="py-3 pr-4">{d.contactPerson}</td>
                    <td className="py-3 pr-4">
                      <p className="font-mono text-foreground font-semibold">{d.user.phoneNumber}</p>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-sm ${
                        d.user.isPhoneVerified
                          ? 'bg-success-bg text-success border border-success-border'
                          : 'bg-warning-bg text-warning border border-warning-border'
                      }`}>
                        {d.user.isPhoneVerified ? '✓ Phone Verified' : '⚠ OTP Unverified'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-muted-light">{d.user.email}</td>
                    <td className="py-3 pr-4 font-bold text-foreground font-mono">{d._count?.donations ?? 0}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        d.verificationStatus === 'VERIFIED'
                          ? 'bg-success-bg text-success border border-success-border'
                          : d.verificationStatus === 'REJECTED'
                          ? 'bg-danger-bg text-danger border border-danger-border'
                          : 'bg-warning-bg text-warning border border-warning-border'
                      }`}>
                        {d.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      {error && (
                        <p className="text-[10px] text-danger font-semibold mb-1">{error}</p>
                      )}

                      {showRejectInput ? (
                        <div className="space-y-1.5 min-w-[160px]">
                          <input
                            type="text"
                            placeholder="Rejection reason..."
                            className="input-premium text-[11px] py-1 px-2"
                            value={rejectionReasons[d.id] || ''}
                            onChange={(e) => setRejectionReasons(prev => ({ ...prev, [d.id]: e.target.value }))}
                          />
                          <div className="flex gap-1">
                            <button
                              disabled={loading}
                              onClick={() => handleReject(d.id)}
                              className="btn-danger text-[10px] py-1 px-2 font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setActiveRejectMap(prev => ({ ...prev, [d.id]: false }))}
                              className="btn-secondary text-[10px] py-1 px-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          {d.verificationStatus !== 'VERIFIED' && (
                            <button
                              disabled={loading}
                              onClick={() => handleApprove(d.id)}
                              className="btn-primary text-[10px] py-1 px-2.5 font-bold shadow-sm"
                            >
                              {loading ? '...' : 'Approve'}
                            </button>
                          )}
                          {d.verificationStatus !== 'REJECTED' && (
                            <button
                              disabled={loading}
                              onClick={() => setActiveRejectMap(prev => ({ ...prev, [d.id]: true }))}
                              className="btn-danger text-[10px] py-1 px-2 font-bold"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
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
