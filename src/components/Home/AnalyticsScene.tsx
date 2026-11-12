import ImpactStats from '@/components/ImpactStats';

export default function AnalyticsScene() {
  return (
    <section className="relative py-20 border-t border-border bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Narrative Text */}
          <div className="lg:col-span-5 space-y-5 text-left lg:order-last">
            <span className="text-[11px] font-bold text-[#0b3c26] uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit block">
              Step 6: Verified Impact &amp; Audit Ledger
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground leading-[1.1] font-display">
              RECORD <br />
              EVERY <br />
              <span className="text-emerald-800 font-display">RESCUE.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              Public FoodOPS counters come strictly from verified completed database records returned by{' '}
              <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">GET /api/stats</code>. Completed rescues update counters only after the receiving NGO confirms delivery.
            </p>
          </div>

          {/* Single Shared Stats Source (F01) */}
          <div className="lg:col-span-7">
            <ImpactStats variant="summary" />
          </div>
        </div>
      </div>
    </section>
  );
}
