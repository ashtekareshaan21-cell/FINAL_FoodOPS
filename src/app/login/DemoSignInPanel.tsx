'use client';

interface DemoSignInPanelProps {
  loading: boolean;
  onDemoLogin: (email: string, password?: string) => void;
}

export default function DemoSignInPanel({ loading, onDemoLogin }: DemoSignInPanelProps) {
  return (
    <div className="pt-4 border-t border-border space-y-3">
      <div
        role="note"
        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950"
      >
        FoodOPS Demo - sample data only.
      </div>

      <div className="flex justify-between items-center text-[11px] font-bold text-muted uppercase tracking-wider">
        <span>Sample Walkthrough Accounts</span>
        <span className="text-[10px] font-medium text-muted">Demo Environment</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <button
          type="button"
          disabled={loading}
          onClick={() => onDemoLogin('donor@foodops.org')}
          className="p-2.5 rounded border border-border bg-surface hover:bg-surface-muted hover:border-primary/40 font-semibold text-foreground flex items-center gap-2 cursor-pointer transition-colors text-left"
        >
          <svg aria-hidden="true" className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M13 21V3l6 4v14" />
          </svg>
          <div className="min-w-0">
            <div className="truncate font-bold">Donor</div>
            <div className="text-[10px] text-muted truncate">Sample Donor</div>
          </div>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => onDemoLogin('ngo1@foodops.org')}
          className="p-2.5 rounded border border-border bg-surface hover:bg-surface-muted hover:border-primary/40 font-semibold text-foreground flex items-center gap-2 cursor-pointer transition-colors text-left"
        >
          <svg aria-hidden="true" className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z" />
          </svg>
          <div className="min-w-0">
            <div className="truncate font-bold">NGO Partner</div>
            <div className="text-[10px] text-muted truncate">Sample NGO</div>
          </div>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => onDemoLogin('volunteer@foodops.org')}
          className="p-2.5 rounded border border-border bg-surface hover:bg-surface-muted hover:border-primary/40 font-semibold text-foreground flex items-center gap-2 cursor-pointer transition-colors text-left"
        >
          <svg aria-hidden="true" className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5.5" cy="17.5" r="3" />
            <circle cx="18.5" cy="17.5" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6h3l2 5h-5l-3-5H8l-2.5 5" />
          </svg>
          <div className="min-w-0">
            <div className="truncate font-bold">Volunteer Rider</div>
            <div className="text-[10px] text-muted truncate">Sample Rider</div>
          </div>
        </button>
      </div>
    </div>
  );
}
