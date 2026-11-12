'use client';

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';
import { divertDonationToBiogas, generateDeliveryOtp } from '@/app/actions/donations';
import { autoAllotTasks, advanceRescueStage, seedDemoRescues, getNgoLiveMonitoringFeed } from '@/app/actions/ngo';
import { prefersReducedMotion } from '@/animations/accessibility';
import { staggerCards } from '@/animations/cards';

export interface ActiveRescueItem {
  id: string;
  title: string;
  description: string;
  status: string;
  quantity: string;
  quantityUnit: string;
  estimatedServings?: number | null;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupDeadlineAt?: string | Date;
  donor: {
    organizationName: string;
    contactPerson?: string;
  };
  assignment?: {
    id: string;
    volunteerId?: string;
    status?: string;
    startedAt?: Date | string | null;
    pickupConfirmedAt?: Date | string | null;
    deliveryStartedAt?: Date | string | null;
    volunteer?: {
      id: string;
      name: string;
      phoneNumber: string;
      vehicleInfo?: string | null;
      operatingArea?: string | null;
    } | null;
  } | null;
}

export interface VolunteerItem {
  id: string;
  name: string;
  phoneNumber: string;
  vehicleInfo?: string | null;
  operatingArea?: string | null;
  status?: string;
  isBusy?: boolean;
}

interface ActiveRescuesListProps {
  activeRescues: ActiveRescueItem[];
  volunteers: VolunteerItem[];
  ngo?: {
    organizationName?: string;
  };
  assignVolunteer: (donationId: string, volunteerId: string) => Promise<{ success: boolean; error?: string }>;
}

const RESCUE_STAGES = [
  { key: 'VOLUNTEER_ASSIGNED', label: '1. Assigned', icon: '01' },
  { key: 'PICKUP_IN_PROGRESS', label: '2. To Donor', icon: '02' },
  { key: 'PICKED_UP', label: '3. Collected', icon: '03' },
  { key: 'DELIVERY_IN_PROGRESS', label: '4. To NGO Base', icon: '04' },
  { key: 'COMPLETED', label: '5. Completed', icon: '05' },
];

function getStageIndex(status: string) {
  if (status === 'ACCEPTED') return -1;
  if (status === 'VOLUNTEER_ASSIGNED') return 0;
  if (status === 'PICKUP_IN_PROGRESS') return 1;
  if (status === 'PICKED_UP') return 2;
  if (status === 'DELIVERY_IN_PROGRESS') return 3;
  if (status === 'DELIVERED' || status === 'COMPLETED') return 4;
  return 0;
}

export default function ActiveRescuesList({
  activeRescues,
  volunteers,
  ngo,
  assignVolunteer,
}: ActiveRescuesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Live Rescues State
  const [rescues, setRescues] = useState<ActiveRescueItem[]>(activeRescues);

  useEffect(() => {
    setRescues(activeRescues);
  }, [activeRescues]);

  // Polling state
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [pollCountdown, setPollCountdown] = useState(4);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [liveEvents, setLiveEvents] = useState<{
    id: string;
    donationTitle: string;
    previousStatus: string;
    newStatus: string;
    reason?: string | null;
    changedAt: Date | string;
  }[]>([]);

  // Action states
  const [selectedVolunteers, setSelectedVolunteers] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  // Divert & OTP states
  const [spoilLoadingMap, setSpoilLoadingMap] = useState<Record<string, boolean>>({});
  const [spoilReasonMap, setSpoilReasonMap] = useState<Record<string, string>>({});
  const [showSpoilConfirm, setShowSpoilConfirm] = useState<Record<string, boolean>>({});
  const [deliveryOtpMap, setDeliveryOtpMap] = useState<Record<string, string>>({});
  const [otpLoadingMap, setOtpLoadingMap] = useState<Record<string, boolean>>({});

  // Auto-allotment modal
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [allotMode, setAllotMode] = useState<'RANDOM' | 'ROUND_ROBIN'>('RANDOM');
  const [allotResult, setAllotResult] = useState<{
    count: number;
    mode: string;
    assignments: { donationTitle: string; volunteerName: string }[];
  } | null>(null);

  // Filter unassigned rescues
  const unassignedRescues = rescues.filter((r) => r.status === 'ACCEPTED');

  // Multi-volunteer concurrent check
  const busyVolunteersInTransit = new Set(
    rescues
      .filter((r) => r.status !== 'ACCEPTED' && r.assignment?.volunteer?.name)
      .map((r) => r.assignment!.volunteer!.name)
  );
  const isConcurrentMultiVolunteer = busyVolunteersInTransit.size >= 2;

  // Stagger animation
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;
    const cards = el.querySelectorAll('.rescue-card');
    const anim = staggerCards(cards);
    return () => {
      if (anim) anim.revert();
    };
  }, [rescues.length]);

  // Live Polling Feed Effect - updates local state cleanly without router.refresh() in polling loop
  const fetchLiveFeed = useCallback(async () => {
    try {
      const feed = await getNgoLiveMonitoringFeed();
      if (feed) {
        if (feed.activeDonations) {
          setRescues(feed.activeDonations as any);
        }
        if (feed.recentEvents) {
          setLiveEvents(feed.recentEvents);
        }
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch {
      // Polling error non-blocking
    }
  }, []);

  // Periodic polling interval
  useEffect(() => {
    if (!isLivePolling) return;

    const interval = setInterval(() => {
      fetchLiveFeed();
    }, 4000);

    return () => clearInterval(interval);
  }, [isLivePolling, fetchLiveFeed]);

  // Pure countdown ticker for UI (no side-effects in state updater)
  useEffect(() => {
    if (!isLivePolling) return;

    const countdownTimer = setInterval(() => {
      setPollCountdown((prev) => (prev <= 1 ? 4 : prev - 1));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [isLivePolling]);

  // Handle Stage Advancement (Dynamic tracking / simulator)
  const handleAdvanceStage = async (donationId: string) => {
    setLoadingMap((prev) => ({ ...prev, [donationId]: true }));
    setErrorMap((prev) => ({ ...prev, [donationId]: null }));

    try {
      const res = await advanceRescueStage(donationId);
      if (res.success) {
        router.refresh();
        await fetchLiveFeed();
      } else {
        setErrorMap((prev) => ({ ...prev, [donationId]: res.error || 'Failed to advance stage.' }));
      }
    } catch {
      setErrorMap((prev) => ({ ...prev, [donationId]: 'Network error while advancing rescue.' }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [donationId]: false }));
    }
  };

  // Handle Assign Single Volunteer
  const handleAssign = async (donationId: string) => {
    const volunteerId = selectedVolunteers[donationId];
    if (!volunteerId) {
      setErrorMap((prev) => ({ ...prev, [donationId]: 'Please select a volunteer.' }));
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [donationId]: true }));
    setErrorMap((prev) => ({ ...prev, [donationId]: null }));

    const res = await assignVolunteer(donationId, volunteerId);
    setLoadingMap((prev) => ({ ...prev, [donationId]: false }));

    if (res.success) {
      router.refresh();
      await fetchLiveFeed();
    } else {
      setErrorMap((prev) => ({ ...prev, [donationId]: res.error || 'Failed to assign volunteer.' }));
    }
  };

  // Handle Auto-Allot Tasks
  const handleAutoAllot = async () => {
    startTransition(async () => {
      const res = await autoAllotTasks({ mode: allotMode });
      if (res.success && res.assignments) {
        setAllotResult({
          count: res.count || 0,
          mode: res.mode || allotMode,
          assignments: res.assignments,
        });
        router.refresh();
        await fetchLiveFeed();
      } else {
        alert(res.error || 'Failed to auto-allot tasks.');
      }
    });
  };

  // Handle Seed Demo Rescues
  const handleSeedDemo = async () => {
    startTransition(async () => {
      const res = await seedDemoRescues();
      if (res.success) {
        router.refresh();
        await fetchLiveFeed();
      } else {
        alert(res.error || 'Failed to seed demo rescues.');
      }
    });
  };

  // Handle OTP generation
  const handleGenOtp = async (assignmentId: string, rescueId: string) => {
    setOtpLoadingMap((prev) => ({ ...prev, [rescueId]: true }));
    setErrorMap((prev) => ({ ...prev, [rescueId]: null }));
    try {
      const res = await generateDeliveryOtp(assignmentId);
      if (res.success && 'otp' in res) {
        setDeliveryOtpMap((prev) => ({ ...prev, [rescueId]: res.otp || '' }));
      } else {
        setErrorMap((prev) => ({
          ...prev,
          [rescueId]: ('error' in res && res.error) || 'Failed to generate delivery OTP.',
        }));
      }
    } catch {
      setErrorMap((prev) => ({ ...prev, [rescueId]: 'Failed to generate OTP.' }));
    } finally {
      setOtpLoadingMap((prev) => ({ ...prev, [rescueId]: false }));
    }
  };

  // Handle Divert to Biogas
  const handleDivert = async (donationId: string) => {
    const reason = spoilReasonMap[donationId] || 'Uncollected / Expired';
    setSpoilLoadingMap((prev) => ({ ...prev, [donationId]: true }));
    setErrorMap((prev) => ({ ...prev, [donationId]: null }));

    const res = await divertDonationToBiogas(donationId, reason);
    setSpoilLoadingMap((prev) => ({ ...prev, [donationId]: false }));

    if (res.success) {
      setShowSpoilConfirm((prev) => ({ ...prev, [donationId]: false }));
      router.refresh();
    } else {
      setErrorMap((prev) => ({ ...prev, [donationId]: res.error || 'Failed to divert donation.' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar & Polling Control */}
      <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isLivePolling ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-bold text-foreground">
              {isLivePolling ? 'Live Operations Stream: Active' : 'Live Sync Paused'}
            </span>
          </div>

          <span className="text-[11px] text-muted-text font-mono">
            {isLivePolling ? `(Syncing in ${pollCountdown}s • Last sync: ${lastSyncTime})` : `(Last sync: ${lastSyncTime})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-surface-muted hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1"
          >
            <span>{isLivePolling ? '⏸️ Pause' : '▶️ Resume'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchLiveFeed()}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-surface-muted hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1"
          >
            <span>🔄 Sync Now</span>
          </button>

          {/* Auto Allot Button (if unassigned exists) */}
          {unassignedRescues.length > 0 && (
            <button
              onClick={() => {
                setAllotResult(null);
                setShowAllotModal(true);
              }}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-accent text-slate-950 hover:bg-emerald-400 shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>🎲 Auto-Allot ({unassignedRescues.length})</span>
            </button>
          )}

          {/* Seed Demo Rescues */}
          <button
            onClick={handleSeedDemo}
            disabled={isPending}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-950 text-emerald-200 hover:bg-emerald-900 border border-emerald-800 transition-all flex items-center gap-1"
          >
            <span>⚡ Seed Test Rescues</span>
          </button>
        </div>
      </div>

      {/* Concurrent Multi-Volunteer High-Impact Highlight */}
      {isConcurrentMultiVolunteer && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-xl p-4.5 text-white shadow-md border border-emerald-500/30 animate-fade-in flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-slate-950 flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 tracking-wider">
                  Live Concurrency Active
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                {busyVolunteersInTransit.size} Fleet Volunteers are handling food rescues concurrently!
              </h3>
              <p className="text-xs text-slate-300">
                Active riders in transit: {Array.from(busyVolunteersInTransit).join(', ')}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
            <span>📡 Parallel Missions: {rescues.filter((r) => r.status !== 'ACCEPTED').length}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {rescues.length === 0 ? (
        <div className="text-center bg-surface border border-border rounded-2xl p-16 shadow-xs space-y-4">
          <span className="text-4xl block animate-bounce">🛰️</span>
          <h3 className="text-lg font-bold text-foreground">No active rescues at the moment</h3>
          <p className="text-xs text-muted-text max-w-md mx-auto leading-relaxed">
            There are currently no active rescue operations claimed by your NGO. You can claim surplus
            from the Marketplace, or click below to generate instant demo rescues to test random
            allotment and concurrent live monitoring.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleSeedDemo}
              disabled={isPending}
              className="btn-primary px-5 py-2.5 text-xs font-bold shadow-xs flex items-center gap-2"
            >
              <span>⚡ Generate 3 Demo Rescues</span>
            </button>
            <Link
              href="/ngo"
              className="px-4 py-2.5 rounded-xl bg-surface-muted hover:bg-slate-200 text-foreground text-xs font-bold border border-border"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      ) : (
        /* Rescue Cards Grid */
        <div ref={containerRef} className="grid gap-6">
          {rescues.map((rescue) => {
            const error = errorMap[rescue.id];
            const loading = loadingMap[rescue.id];
            const isAssigned = rescue.status !== 'ACCEPTED';
            const assignedVol = rescue.assignment?.volunteer;
            const currentStageIdx = getStageIndex(rescue.status);

            return (
              <div
                key={rescue.id}
                className={`rescue-card bg-surface border rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row justify-between gap-6 hover:shadow-md transition-all duration-300 ${
                  rescue.status === 'DELIVERY_IN_PROGRESS'
                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                    : rescue.status === 'PICKUP_IN_PROGRESS'
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : 'border-border'
                }`}
              >
                {/* Left Section: Food Details & Visual Stage Stepper */}
                <div className="flex-grow space-y-4">
                  {/* Title & Badges */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-extrabold text-foreground tracking-tight font-display">
                          🍲 {rescue.title}
                        </h3>

                        <span
                          className={`badge-premium text-[10px] font-mono font-black uppercase px-2.5 py-0.5 ${
                            rescue.status === 'ACCEPTED'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : rescue.status === 'VOLUNTEER_ASSIGNED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : rescue.status === 'PICKUP_IN_PROGRESS'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : rescue.status === 'PICKED_UP'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : rescue.status === 'DELIVERY_IN_PROGRESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {rescue.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-text mt-1 max-w-xl line-clamp-2">
                        {rescue.description}
                      </p>
                    </div>

                    {/* Quantity & Servings Badge */}
                    <div className="text-right">
                      <span className="text-sm font-black text-foreground font-mono">
                        {rescue.quantity} {rescue.quantityUnit}
                      </span>
                      {rescue.estimatedServings && (
                        <p className="text-[11px] text-emerald-700 font-bold">
                          ≈ {rescue.estimatedServings} servings
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Multi-Step Visual Pipeline Stepper */}
                  <div className="bg-surface-muted/70 p-3.5 rounded-xl border border-border">
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-text mb-2">
                      <span className="uppercase tracking-wider text-[10px]">Mission Pipeline Progress:</span>
                      <span className="font-mono text-emerald-800">
                        {currentStageIdx >= 0 ? `Stage ${currentStageIdx + 1} of 5` : 'Awaiting Assignment'}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                      {RESCUE_STAGES.map((stage, idx) => {
                        const isPast = currentStageIdx > idx;
                        const isCurrent = currentStageIdx === idx;
                        const isFuture = currentStageIdx < idx;

                        return (
                          <div
                            key={stage.key}
                            className={`p-2 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 ${
                              isCurrent
                                ? 'bg-primary text-white shadow-xs scale-102 ring-2 ring-emerald-400'
                                : isPast
                                ? 'bg-emerald-100/80 text-emerald-900 font-semibold'
                                : 'bg-surface text-slate-400 border border-border/60'
                            }`}
                          >
                            <span className="text-sm sm:text-base">{stage.icon}</span>
                            <span className="text-[10px] sm:text-[11px] font-bold leading-tight truncate w-full">
                              {stage.label}
                            </span>
                            {isCurrent && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Donor & Pickup Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface-muted/40 p-3.5 rounded-xl border border-border">
                    <div>
                      <p className="font-bold text-muted-text uppercase text-[10px] tracking-wider">
                        Donor Source
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {rescue.donor.organizationName}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-muted-text uppercase text-[10px] tracking-wider">
                        Pickup Location
                      </p>
                      <p className="font-semibold text-foreground mt-0.5 truncate">
                        {rescue.pickupAddress}
                      </p>
                      <a
                        href={buildGoogleMapsSearchUrl(rescue.pickupLatitude, rescue.pickupLongitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-1"
                      >
                        🗺️ View Directions &rarr;
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Section: Assigned Volunteer & Dispatch Controls */}
                <div className="flex-shrink-0 lg:w-88 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-6 space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-danger-bg border border-danger-border text-danger text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  {!isAssigned ? (
                    /* UNASSIGNED RESCUE DISPATCH */
                    <div className="space-y-3 bg-surface-muted/60 p-4 rounded-xl border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-foreground uppercase tracking-wide">
                          Dispatch Rider
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          Unassigned
                        </span>
                      </div>

                      <select
                        className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                        value={selectedVolunteers[rescue.id] || ''}
                        onChange={(e) =>
                          setSelectedVolunteers((prev) => ({ ...prev, [rescue.id]: e.target.value }))
                        }
                      >
                        <option value="">Select volunteer from fleet...</option>
                        {volunteers.map((vol) => (
                          <option key={vol.id} value={vol.id}>
                            {vol.name} ({vol.phoneNumber}) {vol.isBusy ? '• Busy' : '• Available'}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAssign(rescue.id)}
                        className="w-full btn-primary py-2.5 text-xs font-bold shadow-xs disabled:opacity-50"
                      >
                        {loading ? 'Assigning...' : 'Assign Rider Now'}
                      </button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setAllotResult(null);
                            setShowAllotModal(true);
                          }}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          🎲 Or use Auto-Allot for all tasks
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ASSIGNED RESCUE MONITOR & ACTIONS */
                    <div className="space-y-3">
                      {/* Volunteer Profile Badge */}
                      <div className="bg-surface-muted p-3.5 rounded-xl border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-muted-text uppercase tracking-wider">
                            Assigned Fleet Rider
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0b3c26] to-[#10b981] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            {assignedVol?.name.substring(0, 2).toUpperCase() || 'VR'}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-foreground">{assignedVol?.name}</p>
                            <p className="text-xs text-muted-text font-mono font-semibold">
                              📞 {assignedVol?.phoneNumber}
                            </p>
                          </div>
                        </div>

                        {assignedVol?.vehicleInfo && (
                          <div className="text-[11px] text-muted-text font-medium pt-1 border-t border-border/70 flex justify-between">
                            <span>🛵 {assignedVol.vehicleInfo}</span>
                            <span>📍 {assignedVol.operatingArea || 'Metro Base'}</span>
                          </div>
                        )}
                      </div>

                      {/* Dynamic Stage Advance Simulator Button */}
                      {currentStageIdx < 4 && (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleAdvanceStage(rescue.id)}
                            className="w-full px-3 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                          >
                            <span>⚡ Advance Stage:</span>
                            <span className="underline">
                              {RESCUE_STAGES[currentStageIdx + 1]?.label || 'Next'}
                            </span>
                          </button>
                          <p className="text-[10px] text-muted-text text-center italic">
                            Simulate volunteer live progress without phone OTP
                          </p>
                        </div>
                      )}

                      {/* Delivery Handover OTP */}
                      {(rescue.status === 'PICKED_UP' || rescue.status === 'DELIVERY_IN_PROGRESS') &&
                        rescue.assignment?.id && (
                          <div className="pt-2 border-t border-border space-y-2">
                            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">
                              Base Delivery Handover Code
                            </span>

                            {deliveryOtpMap[rescue.id] ? (
                              <div className="bg-success-bg border border-success-border text-success font-mono font-black text-center text-lg p-2.5 rounded-xl animate-fade-in tracking-widest shadow-2xs">
                                OTP: {deliveryOtpMap[rescue.id]}
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={otpLoadingMap[rescue.id]}
                                onClick={() => handleGenOtp(rescue.assignment!.id, rescue.id)}
                                className="w-full btn-secondary py-2 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5"
                              >
                                <span>🔑</span>
                                <span>{otpLoadingMap[rescue.id] ? 'Generating...' : 'Get Handover OTP'}</span>
                              </button>
                            )}
                          </div>
                        )}

                      {/* Reassign Volunteer Dropdown */}
                      <details className="text-xs group">
                        <summary className="font-bold text-muted-text hover:text-foreground cursor-pointer flex items-center gap-1">
                          <span>🔄 Reassign to another rider</span>
                        </summary>
                        <div className="mt-2 space-y-2 pt-2 border-t border-border">
                          <select
                            className="w-full px-2.5 py-1.5 text-xs bg-surface-muted border border-border rounded-lg"
                            value={selectedVolunteers[rescue.id] || ''}
                            onChange={(e) =>
                              setSelectedVolunteers((prev) => ({ ...prev, [rescue.id]: e.target.value }))
                            }
                          >
                            <option value="">Choose new rider...</option>
                            {volunteers.map((vol) => (
                              <option key={vol.id} value={vol.id}>
                                {vol.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleAssign(rescue.id)}
                            className="w-full px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-slate-200 text-foreground font-bold text-xs"
                          >
                            Confirm Reassign
                          </button>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Divert to Biogas Option */}
                  <div className="pt-2 border-t border-dashed border-border">
                    {showSpoilConfirm[rescue.id] ? (
                      <div className="space-y-2 bg-surface-muted p-3 rounded-lg border border-border">
                        <p className="text-[11px] font-bold text-foreground uppercase">Divert Reason</p>
                        <input
                          type="text"
                          placeholder="e.g. Spoiled or Expired"
                          value={spoilReasonMap[rescue.id] || ''}
                          onChange={(e) =>
                            setSpoilReasonMap((prev) => ({ ...prev, [rescue.id]: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={spoilLoadingMap[rescue.id]}
                            onClick={() => handleDivert(rescue.id)}
                            className="btn-danger py-1 px-3 text-xs"
                          >
                            Confirm Divert
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setShowSpoilConfirm((prev) => ({ ...prev, [rescue.id]: false }))
                            }
                            className="btn-secondary py-1 px-3 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setShowSpoilConfirm((prev) => ({ ...prev, [rescue.id]: true }))
                        }
                        className="text-[11px] text-danger font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>♻️ Divert to Biogas / Organic Recovery</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Event Activity Feed / Audit Stream */}
      {liveEvents.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase text-foreground tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations Activity Stream
            </h4>
            <span className="text-[11px] text-muted-text font-mono">
              Auto-updating via telemetry
            </span>
          </div>

          <div className="divide-y divide-border/60 max-h-48 overflow-y-auto pr-1">
            {liveEvents.map((evt) => (
              <div key={evt.id} className="py-2 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(evt.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="font-bold text-foreground truncate max-w-[220px]">
                    {evt.donationTitle}
                  </span>
                  <span className="text-muted-text">➔</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    {evt.newStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                {evt.reason && (
                  <span className="text-[11px] text-muted-text truncate max-w-[200px] hidden md:inline">
                    {evt.reason}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BATCH / RANDOM ALLOTMENT MODAL                          */}
      {/* ======================================================== */}
      {showAllotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-xl w-full p-6 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>🎲</span> Auto-Allot Tasks Across Volunteers
                </h3>
                <p className="text-xs text-muted-text mt-0.5">
                  Batch assign pending food donations to available fleet riders in 1-click.
                </p>
              </div>
              <button
                onClick={() => setShowAllotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {allotResult ? (
              <div className="mt-5 space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-success-bg border border-success-border text-success space-y-1">
                  <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>✓</span> Tasks Allotted Successfully!
                  </h4>
                  <p className="text-xs">
                    Allotted {allotResult.count} food rescue(s) across fleet volunteers using{' '}
                    <span className="font-bold underline">{allotResult.mode}</span> method.
                  </p>
                </div>

                <div className="bg-surface-muted rounded-xl p-4 border border-border space-y-2">
                  <span className="text-[11px] uppercase font-bold text-muted-text tracking-wider block">
                    Dispatched Assignments:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {allotResult.assignments.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-surface p-2.5 rounded-lg border border-border shadow-2xs"
                      >
                        <span className="font-bold text-foreground truncate max-w-[240px]">
                          🍲 {item.donationTitle}
                        </span>
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          ➔ 🛵 {item.volunteerName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    onClick={() => {
                      setShowAllotModal(false);
                      setAllotResult(null);
                    }}
                    className="btn-primary px-5 py-2 text-xs font-bold shadow-xs"
                  >
                    Done & View Rescues
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2">
                    Allotment Algorithm
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAllotMode('RANDOM')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        allotMode === 'RANDOM'
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-muted text-muted-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <span>🎲</span>
                        <span>Random Allotment</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-80">
                        Randomly distributes pending food donations among active verified volunteers.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAllotMode('ROUND_ROBIN')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        allotMode === 'ROUND_ROBIN'
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-muted text-muted-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <span>⚖️</span>
                        <span>Balanced Round-Robin</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-80">
                        Balances workload evenly by giving tasks to riders with least current missions.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Candidate list */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2">
                    Pending Food Donations ({unassignedRescues.length})
                  </label>
                  {unassignedRescues.length === 0 ? (
                    <div className="p-6 bg-surface-muted border border-border rounded-xl text-center">
                      <p className="text-xs text-muted-text">
                        No pending unassigned donations currently.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl divide-y divide-border max-h-48 overflow-y-auto">
                      {unassignedRescues.map((d) => (
                        <div key={d.id} className="p-3 text-xs flex justify-between items-center bg-surface">
                          <div>
                            <span className="font-bold text-foreground block truncate max-w-[280px]">
                              🍲 {d.title}
                            </span>
                            <span className="text-[11px] text-muted-text">
                              {d.quantity} {d.quantityUnit} • {d.donor.organizationName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            Ready
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAllotModal(false)}
                    className="px-4 py-2 rounded-lg bg-surface-muted hover:bg-slate-200 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPending || unassignedRescues.length === 0}
                    onClick={handleAutoAllot}
                    className="btn-primary px-5 py-2 text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    {isPending ? 'Distributing Tasks...' : `🚀 Confirm Allotment (${allotMode})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
