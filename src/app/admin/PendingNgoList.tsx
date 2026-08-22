'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';

export interface PendingNgoItem {
  id: string;
  organizationName: string;
  registrationNumber: string;
  serviceRadiusKm: number;
  baseLatitude: number;
  baseLongitude: number;
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  contactPerson: string;
  contactPhone: string;
  baseAddress: string;
  acceptedFoodTypes: string;
  user: {
    email: string;
  };
}

interface PendingNgoListProps {
  pendingNgos: PendingNgoItem[];
  verifyNgo: (ngoId: string) => Promise<{ success: boolean; error?: string }>;
  rejectNgo: (ngoId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

export default function PendingNgoList({ pendingNgos, verifyNgo, rejectNgo }: PendingNgoListProps) {
  const router = useRouter();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [activeRejectMap, setActiveRejectMap] = useState<Record<string, boolean>>({});

  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : 10;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' as const },
    },
  };

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
      setActiveRejectMap(prev => ({ ...prev, [ngoId]: false }));
      router.refresh();
    } else {
      setErrorMap(prev => ({ ...prev, [ngoId]: res.error || 'Rejection failed.' }));
    }
  };

  return (
    <div className="space-y-6">
      {pendingNgos.length === 0 ? (
        <div className="text-center bg-surface border border-border rounded-lg p-12 shadow-sm animate-pulse">
          <p className="text-sm text-muted-text font-medium">
            No pending NGO verification requests.
          </p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm"
        >
          <ul role="list" className="divide-y divide-border">
            {pendingNgos.map((ngo) => {
              const error = errorMap[ngo.id];
              const loading = loadingMap[ngo.id];
              const isRejectActive = activeRejectMap[ngo.id];

              return (
                <motion.li 
                  key={ngo.id} 
                  variants={itemVariants}
                  className="p-6"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    {/* Organization details */}
                    <div className="flex-grow space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {ngo.organizationName}
                        </h3>
                        <p className="text-xs text-muted-light font-mono mt-0.5">
                          NGO ID: {ngo.id} | Email: {ngo.user.email}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-surface-muted p-4 rounded-md border border-border font-medium text-muted-text">
                        <div>
                          <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">FSSAI License #</p>
                          <p className="font-semibold text-foreground font-mono mt-1">
                            {ngo.registrationNumber}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Operational Info</p>
                          <p className="font-semibold text-foreground mt-1">
                            Radius: {ngo.serviceRadiusKm} km
                          </p>
                          <p className="text-[10px] text-muted-light font-mono mt-0.5">
                            Coords: {ngo.baseLatitude.toFixed(6)}, {ngo.baseLongitude.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Availability</p>
                          <span className={`inline-block px-2 py-0.5 mt-1 rounded-sm text-[10px] font-bold ${
                            ngo.availability === 'AVAILABLE'
                              ? 'bg-success-bg text-success border border-success-border'
                              : ngo.availability === 'BUSY'
                              ? 'bg-warning-bg text-warning border border-warning-border'
                              : 'bg-danger-bg text-danger border border-danger-border'
                          }`}>
                            {ngo.availability || 'AVAILABLE'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Contact Person</p>
                          <p className="font-semibold text-foreground mt-1">
                            {ngo.contactPerson} ({ngo.contactPhone})
                          </p>
                        </div>
                        <div className="sm:col-span-2 md:col-span-4 pt-2 border-t border-border mt-1">
                          <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Operational Address</p>
                          <p className="text-foreground mt-0.5 leading-relaxed">{ngo.baseAddress}</p>
                        </div>
                        <div className="sm:col-span-2 md:col-span-4 pt-1">
                          <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Accepted Food Types</p>
                          <p className="text-foreground mt-0.5 font-mono text-[11px]">{ngo.acceptedFoodTypes || 'None specified'}</p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isRejectActive && (
                          <motion.div 
                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            className="mt-4 pt-2 overflow-hidden"
                          >
                            <label className="label-premium text-danger">
                              Rejection Reason Notice
                            </label>
                            <input
                              type="text"
                              className="input-premium border-danger/40 focus:ring-danger focus:border-danger"
                              value={rejectionReasons[ngo.id] || ''}
                              onChange={(e) =>
                                setRejectionReasons(prev => ({ ...prev, [ngo.id]: e.target.value }))
                              }
                              placeholder="Enter description why FSSAI validation failed..."
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action buttons */}
                    <div className="flex-shrink-0 flex flex-col justify-center min-w-[200px] border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 gap-2">
                      <AnimatePresence mode="wait">
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-3 rounded-sm bg-danger-bg border border-danger-border text-danger text-xs font-semibold"
                          >
                            {error}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isRejectActive ? (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleApprove(ngo.id)}
                            className="w-full btn-primary py-2.5 hover:scale-[1.01]"
                          >
                            ✓ Approve NGO Partner
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => setActiveRejectMap(prev => ({ ...prev, [ngo.id]: true }))}
                            className="w-full btn-secondary py-2.5 hover:scale-[1.01]"
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
                            className="w-full btn-primary py-2.5 hover:scale-[1.01] bg-danger hover:bg-danger/95 shadow-none"
                          >
                            Confirm Rejection
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => setActiveRejectMap(prev => ({ ...prev, [ngo.id]: false }))}
                            className="w-full btn-secondary py-2.5 hover:scale-[1.01]"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
