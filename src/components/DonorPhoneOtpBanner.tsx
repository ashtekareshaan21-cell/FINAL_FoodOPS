'use client';

import { useState } from 'react';
import { sendDonorPhoneOtpAction, verifyDonorPhoneOtpAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

interface DonorPhoneOtpBannerProps {
  isPhoneVerified: boolean;
  phoneNumber: string;
}

export default function DonorPhoneOtpBanner({ isPhoneVerified, phoneNumber }: DonorPhoneOtpBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isPhoneVerified) {
    return null;
  }

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await sendDonorPhoneOtpAction();
    setLoading(false);

    if (res.success && 'message' in res) {
      setOtpSent(true);
      setMessage(res.message || 'OTP code sent successfully!');
      if ('devOtp' in res && res.devOtp) {
        setDevOtp(res.devOtp);
      }
    } else if ('error' in res && res.error) {
      setError(res.error);
    } else {
      setError('Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifyDonorPhoneOtpAction(otpCode);
    setLoading(false);

    if (res.success) {
      setMessage('Phone verified successfully!');
      router.refresh();
    } else if ('error' in res && res.error) {
      setError(res.error);
    } else {
      setError('Verification failed.');
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 shadow-sm mb-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
            📱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                Donor Phone OTP Verification Required
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">
                {phoneNumber}
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
              To publish surplus food listings, verify your contact phone number via SMS OTP code.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-100 border border-red-200 text-red-800 rounded text-xs font-bold">
          Warning: {error}
        </div>
      )}

      {message && (
        <div className="p-2.5 bg-emerald-100 border border-emerald-200 text-emerald-900 rounded text-xs font-bold">
          ✓ {message} {devOtp && <span className="font-mono bg-emerald-200 px-2 py-0.5 rounded ml-2 text-black">Dev OTP: {devOtp}</span>}
        </div>
      )}

      {!otpSent ? (
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={handleSendOtp}
            className="btn-primary text-xs py-2 px-4 font-bold shadow-sm"
          >
            {loading ? 'Sending OTP...' : 'Send Verification OTP'}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            className="input-premium py-2 px-3 text-center text-xs font-mono font-bold uppercase w-44 tracking-widest"
          />
          <button
            type="button"
            disabled={loading || otpCode.length !== 6}
            onClick={handleVerifyOtp}
            className="btn-primary text-xs py-2 px-4 font-bold shadow-sm"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSendOtp}
            className="btn-secondary text-xs py-2 px-3 text-muted-text font-semibold"
          >
            Resend OTP
          </button>
        </div>
      )}
    </div>
  );
}
