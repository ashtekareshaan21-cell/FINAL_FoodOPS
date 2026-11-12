import {
  IconChart,
  IconDonor,
  IconRider,
  IconShield,
} from '@/components/Icons';

export default function IntelligenceScene() {
  return (
    <section className="relative py-20 border-t border-border bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Narrative Text */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <span className="text-[11px] font-bold text-[#0b3c26] uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit block">
              Step 4: Dispatch Convergence
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground leading-[1.1] font-display">
              COORDINATION <br />
              BUILT FOR <br />
              <span className="text-emerald-800 font-display">VARIABILITY.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              FoodOPS brings donor availability, receiver capacity, safety checks, and volunteer pickup timing into one logged workflow so perishable batches move without handoff confusion.
            </p>
          </div>

          {/* Honest Pilot Convergence Diagram (F09 deleted unverified %, F35 SVG labels) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg border border-border bg-surface-muted flex flex-col items-center text-center gap-2">
                  <span className="w-10 h-10 rounded-lg bg-white border border-border text-[#0b3c26] flex items-center justify-center">
                    <IconDonor className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-bold text-foreground">Listings</span>
                </div>

                <div className="p-4 rounded-lg border border-border bg-surface-muted flex flex-col items-center text-center gap-2">
                  <span className="w-10 h-10 rounded-lg bg-white border border-border text-[#0b3c26] flex items-center justify-center">
                    <IconShield className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-bold text-foreground">Safety Checks</span>
                </div>

                <div className="p-4 rounded-lg border border-border bg-surface-muted flex flex-col items-center text-center gap-2">
                  <span className="w-10 h-10 rounded-lg bg-white border border-border text-[#0b3c26] flex items-center justify-center">
                    <IconRider className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-bold text-foreground">Riders</span>
                </div>

                <div className="p-4 rounded-lg border border-border bg-surface-muted flex flex-col items-center text-center gap-2">
                  <span className="w-10 h-10 rounded-lg bg-white border border-border text-[#0b3c26] flex items-center justify-center">
                    <IconChart className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-bold text-foreground">Ledger</span>
                </div>
              </div>

              {/* Section 6 F09 Interim Statement */}
              <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 space-y-1.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0b3c26]">
                  What We Measure in Pilot
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  Pilot metrics we will measure from day one: food rescued (kg), listing-to-pickup time, and expired listings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
