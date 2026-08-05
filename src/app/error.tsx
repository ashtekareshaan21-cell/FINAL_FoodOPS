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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 max-w-md shadow-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Something went wrong</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          An unexpected error occurred in the FoodOps coordination platform. Sentry error monitoring has been notified.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-semibold transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
