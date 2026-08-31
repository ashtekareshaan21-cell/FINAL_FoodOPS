'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to console (which triggers Vercel/Sentry error aggregation)
    console.error('Unhandled FoodOps Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md shadow-xs">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-[#0f2942] mb-2">Operational System Error</h1>
        <p className="text-sm text-slate-600 mb-6 font-medium">
          An unexpected error occurred in the FoodOPS platform. The transaction state has been preserved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="btn-primary px-4 py-2 text-sm font-semibold"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="btn-secondary px-4 py-2 text-sm font-semibold"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
