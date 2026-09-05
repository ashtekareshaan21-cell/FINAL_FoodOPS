'use client';

import React from 'react';
import Link from 'next/link';

interface VerificationBannerProps {
  status: 'PENDING_VERIFICATION' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  role: 'DONOR' | 'NGO' | 'VOLUNTEER';
  rejectionReason?: string | null;
}

export default function VerificationBanner({
  status,
  role,
  rejectionReason,
}: VerificationBannerProps) {
  if (status === 'VERIFIED') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
            ✓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Account Status
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase">
                Verified {role}
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5 font-medium">
              Your identity and eligibility have been verified. Full operational features are unlocked.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'PENDING_VERIFICATION' || status === 'UNDER_REVIEW') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            ⏳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Verification Pending
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">
                Under Administrative Review
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5 font-medium">
              Your account details have been submitted. Operational features (publishing listings, claiming food, accepting pickups) will unlock once administrative verification is complete.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold text-sm">
            ✕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-900 uppercase tracking-wider">
                Verification Action Required
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-200 text-red-900 uppercase">
                Rejected
              </span>
            </div>
            <p className="text-xs text-red-700 mt-0.5 font-medium">
              Reason: {rejectionReason || 'Uploaded documentation was insufficient or invalid.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'SUSPENDED') {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex items-center justify-between text-white shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-red-400 flex items-center justify-center font-bold text-sm">
            🚫
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              Account Suspended
            </span>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              This account has been administratively suspended from active platform operations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
