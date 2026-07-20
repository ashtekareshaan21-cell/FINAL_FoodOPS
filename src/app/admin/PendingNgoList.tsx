'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PendingNgoListProps {
  pendingNgos: any[];
  verifyNgo: (ngoId: string) => Promise<{ success: boolean; error?: string }>;
  rejectNgo: (ngoId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

export default function PendingNgoList({ pendingNgos, verifyNgo, rejectNgo }: PendingNgoListProps) {
  const router = useRouter();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [activeRejectMap, setActiveRejectMap] = useState<Record<string, boolean>>({});

  const handleApprove = async (ngoId: string) => {
    setLoadingMap(prev => ({ ...prev, [ngoId]: true }));
    setErrorMap(prev => ({ ...prev, [ngoId]: null }));

    const res = await verifyNgo(ngoId);
    setLoadingMap(prev => ({ ...prev, [ngoId]: false }));

    if (res.success) {
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [ngoId]: res.error || 'Approval failed.' }));
    }
  };

  const handleReject = async (ngoId: string) => {
    const reason = rejectionReasons[ngoId] || 'FSSAI credentials did not match public database record.';
    
    setLoadingMap(prev => ({ ...prev, [ngoId]: true }));
    setErrorMap(prev => ({ ...prev, [ngoId]: null }));

    const res = await rejectNgo(ngoId, reason);
    setLoadingMap(prev => ({ ...prev, [ngoId]: false }));

    if (res.success) {
      // Reset state
      setActiveRejectMap(prev => ({ ...prev, [ngoId]: false }));
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [ngoId]: res.error || 'Rejection failed.' }));
    }
  };

  return (
    <div className="space-y-6">
      {pendingNgos.length === 0 ? (
        <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No pending NGO verification requests.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <ul role="list" className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {pendingNgos.map((ngo) => {
              const error = errorMap[ngo.id];
              const loading = loadingMap[ngo.id];
              const isRejectActive = activeRejectMap[ngo.id];

              return (
                <li key={ngo.id} className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    {/* Organization details */}
                    <div className="flex-grow space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                          {ngo.organizationName}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                          NGO ID: {ngo.id} | Email: {ngo.user.email}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-150 dark:border-zinc-850">
                        <div>
                          <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">FSSAI License #</p>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono mt-1">
                            {ngo.registrationNumber}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Base Coordinates</p>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono mt-1">
                            {ngo.baseLatitude.toFixed(6)}, {ngo.baseLongitude.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Contact Person</p>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                            {ngo.contactPerson} ({ngo.contactPhone})
                          </p>
                        </div>
                      </div>

                      {isRejectActive && (
                        <div className="mt-4 pt-2">
                          <label className="block text-xs font-semibold text-red-600 mb-1">
                            Rejection Reason
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 border border-red-300 rounded text-xs focus:ring-red-500 focus:border-red-500 dark:bg-zinc-950 dark:border-red-900 dark:text-zinc-200"
                            value={rejectionReasons[ngo.id] || ''}
                            onChange={(e) =>
                              setRejectionReasons(prev => ({ ...prev, [ngo.id]: e.target.value }))
                            }
                            placeholder="Enter description why FSSAI validation failed..."
                          />
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex-shrink-0 flex flex-col justify-center min-w-[200px] border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 pt-4 lg:pt-0 lg:pl-6 gap-2">
                      {error && (
                        <div className="p-2 rounded bg-red-50 border border-red-200 text-red-600 text-[10px] dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                          {error}
                        </div>
                      )}

                      {!isRejectActive ? (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleApprove(ngo.id)}
                            className="w-full py-2 px-4 border border-transparent rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
                          >
                            ✓ Approve NGO Partner
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => setActiveRejectMap(prev => ({ ...prev, [ngo.id]: true }))}
                            className="w-full py-2 px-4 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded text-sm transition-colors"
                          >
                            ✕ Reject License
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleReject(ngo.id)}
                            className="w-full py-2 px-4 border border-transparent rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
                          >
                            Confirm Rejection
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => setActiveRejectMap(prev => ({ ...prev, [ngo.id]: false }))}
                            className="w-full py-2 px-4 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
