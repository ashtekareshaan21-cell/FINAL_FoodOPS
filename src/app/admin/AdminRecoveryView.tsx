'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientDateTime from '@/components/ClientDateTime';

interface RecoveryDonation {
  id: string;
  title: string;
  quantity: string;
  quantityUnit: string;
  status: string;
  cancelReason?: string | null;
  cancelledAt?: Date | string | null;
  pickupDeadlineAt: Date | string;
  donor: {
    organizationName: string;
  };
  acceptedNgo?: {
    organizationName: string;
  } | null;
}

interface AdminRecoveryViewProps {
  recoveryDonations: RecoveryDonation[];
  escalateDonation: (donationId: string) => Promise<{ success: boolean; error?: string }>;
  resolveOrganicDonation: (donationId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function AdminRecoveryView({
  recoveryDonations,
  escalateDonation,
  resolveOrganicDonation,
}: AdminRecoveryViewProps) {
  const router = useRouter();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  const handleEscalate = async (donationId: string) => {
    setLoadingMap(prev => ({ ...prev, [donationId]: true }));
    setErrorMap(prev => ({ ...prev, [donationId]: null }));

    const res = await escalateDonation(donationId);
    setLoadingMap(prev => ({ ...prev, [donationId]: false }));

    if (res.success) {
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [donationId]: res.error || 'Escalation failed.' }));
    }
  };

  const handleResolveOrganic = async (donationId: string) => {
    setLoadingMap(prev => ({ ...prev, [donationId]: true }));
    setErrorMap(prev => ({ ...prev, [donationId]: null }));

    const res = await resolveOrganicDonation(donationId);
    setLoadingMap(prev => ({ ...prev, [donationId]: false }));

    if (res.success) {
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [donationId]: res.error || 'Organic resolution failed.' }));
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Food Recovery & Diversion Pathways</h2>
          <p className="text-xs text-muted-text">Manage expired or un-rescued surplus listings diverted to energy recovery or organic composting.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/ngo/recovery"
            className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1.5"
          >
            <span>♻️ Open Pune Biomethanation Hub</span>
          </Link>
          <span className="badge-premium bg-warning-bg text-warning border border-warning-border tracking-widest text-[10px] uppercase font-extrabold px-2.5 py-1">
            {recoveryDonations.length} Recovery Items
          </span>
        </div>
      </div>

      {recoveryDonations.length === 0 ? (
        <p className="text-xs text-muted-text text-center py-8">No donations currently requiring recovery diversion.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-xs text-left">
            <thead>
              <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                <th className="pb-3 pr-4">Donation Title</th>
                <th className="pb-3 pr-4">Donor Org</th>
                <th className="pb-3 pr-4">Quantity</th>
                <th className="pb-3 pr-4">SLA Expired At</th>
                <th className="pb-3 pr-4">Failure Reason</th>
                <th className="pb-3 pr-4">Recovery Status</th>
                <th className="pb-3">Recovery Pathway Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-muted-text">
              {recoveryDonations.map((item) => {
                const loading = loadingMap[item.id];
                const error = errorMap[item.id];

                return (
                  <tr key={item.id} className="hover:bg-surface-muted transition-colors">
                    <td className="py-3 pr-4 font-bold text-foreground">{item.title}</td>
                    <td className="py-3 pr-4 font-semibold">{item.donor.organizationName}</td>
                    <td className="py-3 pr-4">{item.quantity} {item.quantityUnit}</td>
                    <td className="py-3 pr-4 font-mono text-[11px] text-danger">
                      <ClientDateTime date={item.pickupDeadlineAt} />
                    </td>
                    <td className="py-3 pr-4 text-muted-light text-[11px] max-w-xs truncate">{item.cancelReason || 'SLA Expiration'}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono ${
                        item.status === 'ORGANIC_RECOVERY'
                          ? 'bg-success-bg text-success border border-success-border'
                          : item.status === 'RECOVERY_ESCALATED'
                          ? 'bg-warning-bg text-warning border border-warning-border'
                          : 'bg-danger-bg text-danger border border-danger-border'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {error && <p className="text-[10px] text-danger font-bold mb-1">{error}</p>}
                      <div className="flex gap-2">
                        {item.status === 'EXPIRED' && (
                          <button
                            disabled={loading}
                            onClick={() => handleEscalate(item.id)}
                            className="btn-warning text-[10px] py-1 px-2 font-bold"
                          >
                            {loading ? '...' : 'Escalate Recovery'}
                          </button>
                        )}
                        {item.status === 'RECOVERY_ESCALATED' && (
                          <button
                            disabled={loading}
                            onClick={() => handleResolveOrganic(item.id)}
                            className="btn-success text-[10px] py-1 px-2 font-bold"
                          >
                            {loading ? '...' : 'Mark Composted / Recovered'}
                          </button>
                        )}
                        {item.status === 'ORGANIC_RECOVERY' && (
                          <span className="text-[10px] text-success font-bold font-mono">✓ Diverted</span>
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
