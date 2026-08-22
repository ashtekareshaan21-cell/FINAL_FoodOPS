'use client';

import { useState } from 'react';
import { generatePickupOtp } from '@/app/actions/donations';

export default function ShowOtpButton({ assignmentId }: { assignmentId: string }) {
  const [otp, setOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generatePickupOtp(assignmentId);
      if (res.success && 'otp' in res && res.otp) {
        setOtp(res.otp);
      } else if ('error' in res && res.error) {
        setError(res.error);
      } else {
        setError('Failed to generate OTP.');
      }
    } catch (err) {
      setError('Failed to contact server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2.5 border-t border-border mt-2.5">
      {otp ? (
        <div className="bg-success-bg border border-success-border rounded-md p-3 text-center">
          <span className="block text-[9px] uppercase font-bold text-success tracking-wider">Handover Verification OTP</span>
          <span className="text-lg font-black text-foreground tracking-widest font-mono block mt-1">{otp}</span>
          <span className="text-[9px] text-muted-text block mt-1">Provide this 6-digit code to the rider.</span>
        </div>
      ) : (
        <div className="space-y-1">
          {error && <p className="text-[10px] text-danger font-semibold">⚠ {error}</p>}
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full btn-secondary text-[11px] py-2 px-3 flex items-center justify-center gap-1.5 hover:scale-[1.01]"
          >
            🔑 {loading ? 'Generating...' : 'View Handover OTP'}
          </button>
        </div>
      )}
    </div>
  );
}
