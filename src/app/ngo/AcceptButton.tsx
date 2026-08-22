'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AcceptButtonProps {
  donationId: string;
  acceptDonation: (donationId: string) => Promise<{ success: boolean; error?: string; donation?: unknown }>;
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
        <div className="mb-3 p-3 rounded-sm bg-danger-bg border border-danger-border text-danger text-xs font-semibold">
          {error}
        </div>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={handleAccept}
        className="w-full btn-primary py-2.5 hover:scale-[1.01]"
      >
        {loading ? 'Claiming rescue...' : 'Claim Surplus Donation'}
      </button>
    </div>
  );
}
