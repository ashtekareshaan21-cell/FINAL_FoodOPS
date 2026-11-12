import Link from 'next/link';
import DemoPanelBanner from '@/components/DemoPanelBanner';
import { IconCheck, IconShield } from '@/components/Icons';

export default function InventoryScene() {
  return (
    <section className="relative py-20 border-t border-border bg-surface-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Narrative Text */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <span className="text-[11px] font-bold text-[#0b3c26] uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit block">
              Step 3: Food Safety &amp; Verification
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground leading-[1.1] font-display">
              SAFETY <br />
              CHECKS <br />
              <span className="text-emerald-800 font-display">FIRST.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              Food safety first: donors confirm the food was stored safely and is within its safe window; receivers check temperature and condition at pickup.{' '}
              <Link href="/food-safety" className="text-emerald-900 font-bold underline">
                See how our checks work
              </Link>
              .
            </p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              On the roadmap: photo-assisted listing checks to estimate quantity and flag damaged packaging.
            </p>
          </div>

          {/* Example Verification Panel (F10, F11, F12) */}
          <div className="lg:col-span-7">
            <div className="bg-surface border border-border p-6 rounded-xl shadow-sm space-y-5">
              <DemoPanelBanner title="Example checks" />

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border bg-surface-muted space-y-1.5">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="text-xs font-extrabold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <IconShield className="w-4 h-4 text-[#0b3c26]" />
                      Safe Storage &amp; Handling Declaration
                    </span>
                    <Link
                      href="/compliance"
                      className="text-xs font-bold text-emerald-900 underline"
                    >
                      View operating process
                    </Link>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Every donor confirms sealed storage and remaining safe window before publishing. Receiver NGOs inspect condition at pickup. FoodOPS does not issue regulatory certifications.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-surface-muted space-y-1">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="text-xs font-extrabold text-foreground uppercase tracking-wide">
                      Visual Photo Check (Example)
                    </span>
                    <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                      EXAMPLE AUDIT
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Example audit: photo check matched the listing description in this scenario.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-surface-muted space-y-1">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="text-xs font-extrabold text-foreground uppercase tracking-wide">
                      Hot Holding Temperature Check (Example)
                    </span>
                    <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                      EXAMPLE READING
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Example check: hot food held at 64 degrees C in this scenario. At a real pickup, the receiver records the actual reading.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-950 text-xs font-semibold flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-emerald-900 shrink-0" />
                <span>
                  See full donor and NGO safety steps on{' '}
                  <Link href="/food-safety" className="underline font-bold">
                    Food Safety and FSSAI Guidance
                  </Link>
                  .
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
