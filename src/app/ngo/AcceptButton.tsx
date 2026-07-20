'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AcceptButtonProps {
  donationId: string;
  acceptDonation: (donationId: string) => Promise<{ success: boolean; error?: string; donation?: any }>;
}

export default function AcceptButton({ donationId, acceptDonation }: AcceptButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    const res = await acceptDonation(donationId);
    setLoading(false);

    if (res.success) {
      router.push('/ngo/active');
      router.refresh();
    } else {
      setError(res.error || 'Failed to claim donation.');
    }
  };

  return (
    <div className="mt-4">
      {error && (
        <div className="mb-3 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-xs dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={handleAccept}
        className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none disabled:opacity-50 transition-colors"
      >
        {loading ? 'Claiming rescue...' : 'Claim Surplus Donation'}
      </button>
    </div>
  );
}
