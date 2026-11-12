import React from 'react';

interface DemoPanelBannerProps {
  title?: string;
}

export default function DemoPanelBanner({ title }: DemoPanelBannerProps) {
  return (
    <div
      role="note"
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950"
    >
      <span className="text-[11px] font-bold tracking-wide">
        Demo scenario - no live rescue in progress. Illustrative data only.
      </span>
      <div className="flex items-center gap-2">
        {title ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
            {title}
          </span>
        ) : null}
        <span className="inline-flex items-center rounded border border-amber-400 bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-950">
          DEMO
        </span>
      </div>
    </div>
  );
}
