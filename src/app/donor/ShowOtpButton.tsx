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
    <div className="pt-3 border-t-2 border-dashed border-primary/30 mt-3">
      {otp ? (
        <div className="bg-success-bg border-2 border-success-border rounded-lg p-4 text-center animate-fade-in">
          <span className="block text-[9px] uppercase font-bold text-success tracking-wider mb-1">🔑 Secure Pickup Handover OTP</span>
          <span className="text-2xl font-black text-foreground tracking-[0.4em] font-mono block py-2 bg-white/60 rounded-md border border-success-border/50">{otp}</span>
          <span className="text-[10px] text-success font-semibold block mt-2">Share this 6-digit code with the volunteer rider to confirm pickup.</span>
          <span className="text-[9px] text-muted-text block mt-0.5">Valid for 10 minutes.</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-text font-medium text-center">Rider has arrived? Generate a secure handover OTP.</p>
          {error && <p className="text-[10px] text-danger font-semibold text-center">⚠ {error}</p>}
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full btn-primary text-xs py-2.5 px-3 flex items-center justify-center gap-1.5 hover:scale-[1.01] shadow-sm"
          >
            🔑 {loading ? 'Generating OTP...' : 'Generate & Show Handover OTP'}
          </button>
        </div>
      )}
    </div>
  );
}
