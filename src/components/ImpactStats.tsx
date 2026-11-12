'use client';

import { useEffect, useState } from 'react';

export type MetricKind = 'REAL DATA' | 'ESTIMATED IMPACT' | 'SIMULATED';

export interface PlatformStatsPayload {
  rescuesCompleted: number;
  kgRescued: number;
  co2eAbatedKg: number;
  waterPreservedL: number;
  activeRescues: number;
  divertedWeightKg: number;
  asOf: string;
}

interface StatsState {
  status: 'loading' | 'ready' | 'error';
  data: PlatformStatsPayload | null;
}

let cachedPromise: Promise<PlatformStatsPayload> | null = null;

function fetchSharedStats(): Promise<PlatformStatsPayload> {
  if (!cachedPromise) {
    cachedPromise = fetch('/api/stats', { cache: 'no-store' }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Stats request failed with HTTP ${res.status}`);
      }
      const json = (await res.json()) as PlatformStatsPayload;
      if (typeof json.rescuesCompleted !== 'number' || typeof json.kgRescued !== 'number') {
        throw new Error('Malformed stats response');
      }
      return json;
    });
  }
  return cachedPromise;
}

export function resetImpactStatsCacheForTests() {
  cachedPromise = null;
}

export function usePlatformStats(): StatsState {
  const [state, setState] = useState<StatsState>({
    status: 'loading',
    data: null,
  });

  useEffect(() => {
    let active = true;
    fetchSharedStats()
      .then((data) => {
        if (active) {
          setState({ status: 'ready', data });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: 'error', data: null });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}

const KIND_STYLES: Record<MetricKind, string> = {
  'REAL DATA': 'bg-emerald-50 text-emerald-900 border-emerald-300',
  'ESTIMATED IMPACT': 'bg-sky-50 text-sky-900 border-sky-300',
  SIMULATED: 'bg-amber-50 text-amber-950 border-amber-300',
};

export function MetricKindBadge({ kind }: { kind: MetricKind }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${KIND_STYLES[kind]}`}
    >
      {kind}
    </span>
  );
}

interface ImpactStatsProps {
  variant?: 'balance-sheet' | 'summary';
}

export default function ImpactStats({ variant = 'balance-sheet' }: ImpactStatsProps) {
  const { status, data } = usePlatformStats();

  const formattedAsOf =
    data?.asOf
      ? new Date(data.asOf).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null;

  if (variant === 'summary') {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4"
        aria-live="polite"
      >
        {status === 'loading' && (
          <p className="text-xs font-semibold text-slate-700">Loading platform counters...</p>
        )}

        {status === 'error' && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <span className="text-xs font-bold text-red-900">Data unavailable</span>
            <MetricKindBadge kind="REAL DATA" />
          </div>
        )}

        {status === 'ready' && data && (
          <>
            {data.rescuesCompleted === 0 ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-foreground">
                    Pilot stage - real numbers, starting from zero
                  </h3>
                  <MetricKindBadge kind="REAL DATA" />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  FoodOPS is onboarding its first donor and NGO partners in Pune. Completed rescues: 0. Food rescued: 0 kg. These counters update from live platform data the moment the first rescue completes - they are not projections.
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Rescues completed
                  </span>
                  <MetricKindBadge kind="REAL DATA" />
                </div>
                <p className="text-2xl font-black text-foreground font-mono">
                  {data.rescuesCompleted}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Food rescued
                  </span>
                  <MetricKindBadge kind="REAL DATA" />
                </div>
                <p className="text-2xl font-black text-foreground font-mono">
                  {Number(data.kgRescued.toFixed(1))} kg
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Active rescues now
                  </span>
                  <MetricKindBadge kind="REAL DATA" />
                </div>
                <p className="text-2xl font-black text-foreground font-mono">
                  {data.activeRescues}
                </p>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-700">
              Pilot metrics we will measure from day one: food rescued (kg), listing-to-pickup time, and expired listings.
              {formattedAsOf ? ` As of ${formattedAsOf}.` : ''}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8" aria-live="polite">
      {status === 'loading' && (
        <div className="p-6 bg-surface rounded-lg border border-border text-sm font-semibold text-slate-700 text-center">
          Loading verified platform ledger from `/api/stats`...
        </div>
      )}

      {status === 'error' && (
        <div className="p-6 bg-red-50 rounded-lg border border-red-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-extrabold text-red-900">Data unavailable</p>
            <p className="text-xs text-red-800 mt-1">
              Live database counters could not be loaded right now. Try refreshing shortly.
            </p>
          </div>
          <MetricKindBadge kind="REAL DATA" />
        </div>
      )}

      {status === 'ready' && data && (
        <>
          {data.rescuesCompleted === 0 && (
            <div className="p-5 bg-surface rounded-lg border border-border shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <h3 className="text-base font-extrabold text-foreground">
                  Pilot stage - real numbers, starting from zero
                </h3>
                <MetricKindBadge kind="REAL DATA" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                FoodOPS is onboarding its first donor and NGO partners in Pune. Completed rescues: 0. Food rescued: 0 kg. These counters update from live platform data the moment the first rescue completes - they are not projections.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-surface rounded-lg border border-border flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Weight Rescued
                </span>
                <MetricKindBadge kind="REAL DATA" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground tracking-tight font-mono">
                  {Number(data.kgRescued.toFixed(1))} kg
                </p>
                <p className="mt-1.5 text-xs text-slate-700 leading-normal">
                  Verified food weight delivered to NGO partners (never merged with compost or biogas diversion).
                </p>
              </div>
            </div>

            <div className="p-6 bg-surface rounded-lg border border-border flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Rescues completed
                </span>
                <MetricKindBadge kind="REAL DATA" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground tracking-tight font-mono">
                  {data.rescuesCompleted}
                </p>
                <p className="mt-1.5 text-xs text-slate-700 leading-normal">
                  Completed handovers confirmed by receiving NGOs ({data.activeRescues} active rescues in progress).
                </p>
              </div>
            </div>

            <div className="p-6 bg-surface rounded-lg border border-border flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  CO₂e Abated
                </span>
                <MetricKindBadge kind="ESTIMATED IMPACT" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground tracking-tight font-mono">
                  {Math.round(data.co2eAbatedKg)} kg
                </p>
                <p className="mt-1.5 text-xs text-slate-700 leading-normal">
                  Estimated methane emissions avoided based on completed rescued weight.
                </p>
              </div>
            </div>

            <div className="p-6 bg-surface rounded-lg border border-border flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Water Footprint
                </span>
                <MetricKindBadge kind="ESTIMATED IMPACT" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground tracking-tight font-mono">
                  {Math.round(data.waterPreservedL)} L
                </p>
                <p className="mt-1.5 text-xs text-slate-700 leading-normal">
                  Estimated agricultural water preserved from completed food rescues.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-700">
            <span>
              Organic recovery diverted (expired food routed to compost/biogas):{' '}
              <strong className="font-mono text-foreground">
                {Number(data.divertedWeightKg.toFixed(1))} kg
              </strong>{' '}
              <span className="inline-block ml-1">
                <MetricKindBadge kind="REAL DATA" />
              </span>
            </span>
            {formattedAsOf ? (
              <span>
                Source: <code className="font-mono">GET /api/stats</code> · As of {formattedAsOf}
              </span>
            ) : null}
          </div>
        </>
      )}

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium">
        <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1">
          Environmental Impact Calculation Methodology Disclosure
        </p>
        <p className="leading-relaxed">
          CO₂e abatement estimates are calculated using standard IPCC / WRI food waste GHG coefficients (2.5 kg CO₂e avoided per kg of surplus food rescued; 1.9 kg CO₂e avoided per kg diverted to biogas/composting organic recovery). Water footprint savings are estimated at 250 liters of agricultural water per kg of food saved.
        </p>
      </div>
    </div>
  );
}
