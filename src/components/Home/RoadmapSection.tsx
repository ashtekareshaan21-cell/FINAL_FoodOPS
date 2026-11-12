export default function RoadmapSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12 space-y-3">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
          Network Development Plan
        </span>
        <h2 className="text-3xl font-extrabold text-foreground font-display">
          FoodOPS is evolving.
        </h2>
        <p className="max-w-2xl mx-auto text-sm text-slate-700 leading-relaxed font-medium">
          Core rescue flows are built and entering pilot in Pune. LIVE status is reserved for steps real pilot partners have completed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BUILT / IN PILOT */}
        <div className="bg-surface p-6 rounded-lg border border-border space-y-4 shadow-sm">
          <div className="flex justify-between items-center gap-2">
            <span className="inline-flex items-center rounded border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
              IN PILOT
            </span>
            <span className="inline-flex items-center rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
              BUILT
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-foreground">
            Core rescue flow - BUILT, entering pilot.
          </h3>
          <ul className="space-y-2 text-xs text-slate-700 font-medium">
            <li>Radius-based NGO matching (Built)</li>
            <li>Atomic first-accept claim locking (Built)</li>
            <li>Server-verified pickup and delivery OTP handover (Built)</li>
            <li>ESG CO₂e and water ledger starting from 0 (Built)</li>
          </ul>
        </div>

        {/* IN DEVELOPMENT */}
        <div className="bg-surface p-6 rounded-lg border border-border space-y-4 shadow-sm">
          <div className="flex justify-between items-center gap-2">
            <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-950">
              IN DEVELOPMENT
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-foreground">
            Operational Pilot Hardening
          </h3>
          <ul className="space-y-2 text-xs text-slate-700 font-medium">
            <li>Automated server-clock expiry timers and re-matching</li>
            <li>Partner verification workflow across Pune &amp; Pimpri-Chinchwad</li>
            <li>On the roadmap: photo-assisted listing checks to estimate quantity and flag damaged packaging</li>
          </ul>
        </div>

        {/* PLANNED */}
        <div className="bg-surface p-6 rounded-lg border border-border space-y-4 shadow-sm">
          <div className="flex justify-between items-center gap-2">
            <span className="inline-flex items-center rounded border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              PLANNED
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-foreground">
            Circular Recovery &amp; Pilot Reporting
          </h3>
          <ul className="space-y-2 text-xs text-slate-700 font-medium">
            <li>Verified compost and biogas fallback intake confirmation</li>
            <li>Published 20-rescue measured pickup-window study</li>
            <li>District audit exports for institutional partners</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
