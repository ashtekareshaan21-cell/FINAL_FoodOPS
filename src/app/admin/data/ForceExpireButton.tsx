'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forceExpireDonation } from '@/app/actions/admin';

interface ForceExpireButtonProps {
  donationId: string;
}

export default function ForceExpireButton({ donationId }: ForceExpireButtonProps) {
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
