'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { IconAlert } from '@/components/Icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled FoodOPS Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center p-6 text-center">
      <main id="main-content" className="bg-white border border-slate-200 rounded-xl p-8 max-w-md shadow-xs">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          <IconAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#0f2942] mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-600 mb-6 font-medium">
          An unexpected error occurred in the FoodOPS platform. Your existing saved data was not modified.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
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
      </main>
    </div>
  );
}
