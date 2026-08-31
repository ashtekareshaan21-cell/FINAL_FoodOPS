'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forceExpireDonation } from '@/app/actions/admin';
import { escalateDonation, resolveOrganicDonation } from '@/app/actions/donations';

interface ForceExpireButtonProps {
  donationId: string;
  status: string;
}

export default function ForceExpireButton({ donationId, status }: ForceExpireButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleForceExpire = async () => {
    if (!confirm('Are you sure you want to force-expire this donation and divert it to biogas recovery?')) {
      return;
    }
    setLoading(true);
    const res = await forceExpireDonation(donationId);
    setLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Failed to force expire donation.');
    }
  };

  const handleEscalate = async () => {
    if (!confirm('Are you sure you want to escalate this expired donation to organic recovery verification?')) {
      return;
    }
    setLoading(true);
    const res = await escalateDonation(donationId);
    setLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Failed to escalate donation.');
    }
  };

  const handleResolve = async () => {
    if (!confirm('Are you sure you want to mark this recovery as completed?')) {
      return;
    }
    setLoading(true);
    const res = await resolveOrganicDonation(donationId);
    setLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Failed to resolve donation.');
    }
  };

  if (status === 'EXPIRED') {
    return (
      <button
        onClick={handleEscalate}
        disabled={loading}
        className="px-2 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 dark:text-sky-400 dark:bg-sky-950/20 dark:hover:bg-sky-900/40 border border-sky-200 dark:border-sky-800 rounded transition-colors disabled:opacity-50 animate-fade-in"
      >
        {loading ? 'Escalating...' : '📈 Escalate Recovery'}
      </button>
    );
  }

  if (status === 'RECOVERY_ESCALATED') {
    return (
      <button
        onClick={handleResolve}
        disabled={loading}
        className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded transition-colors disabled:opacity-50 animate-fade-in"
      >
        {loading ? 'Resolving...' : '✓ Resolve Recovery'}
      </button>
    );
  }

  return (
    <button
      onClick={handleForceExpire}
      disabled={loading}
      className="px-2 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-950/20 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded transition-colors disabled:opacity-50"
    >
      {loading ? 'Diverting...' : '⚡ Biogas Divert'}
    </button>
  );
}
