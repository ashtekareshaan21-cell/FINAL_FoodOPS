import DemoPanelBanner from '@/components/DemoPanelBanner';
import ImpactStats from '@/components/ImpactStats';
import { IconDonor, IconShield } from '@/components/Icons';

const EXAMPLE_LISTINGS = [
  {
    label: 'Example Listing A',
    title: 'Cooked Vegetarian Meals (~18 kg)',
    category: 'Cooked Veg',
    windowNote: 'Example safe window: 90 min',
  },
  {
    label: 'Example Listing B',
    title: 'Sealed Bakery Trays (~12 kg)',
    category: 'Bakery',
    windowNote: 'Example safe window: 120 min',
  },
  {
    label: 'Example Listing C',
    title: 'Packaged Dry Ration (~15 kg)',
    category: 'Packaged',
    windowNote: 'Example safe window: 180 min',
  },
];

export default function OrdersScene() {
  return (
    <section className="relative py-20 border-t border-border bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Narrative + REAL DATA Summary Card (F05) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-[11px] font-bold text-[#0b3c26] uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit block">
              Step 1: Surplus Intake
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground leading-[1.1] font-display">
              EVERYTHING <br />
              STARTS WITH <br />
              <span className="text-emerald-800 font-display">LISTINGS.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              Surplus food declarations from commercial kitchens, caterers, and dining halls enter the FoodOPS dispatch queue with weight, category, and a fixed pickup deadline.
            </p>

            {/* Real-time balance sheet counters live cleanly outside simulated panels */}
            <ImpactStats variant="summary" />
          </div>

          {/* Static, Non-Looping Example Listings Panel (F04) */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-md space-y-5">
              <DemoPanelBanner title="Example listings" />

              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-[#0b3c26] flex items-center justify-center">
                    <IconShield className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
                      Example listings
                    </h3>
                    <p className="text-xs text-slate-700">
                      How commercial kitchen surplus appears in the intake queue (illustrative sample only)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {EXAMPLE_LISTINGS.map((item) => (
                  <div
                    key={item.label}
                    className="p-4 bg-surface-muted border border-border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-800 font-mono">
                        {item.label}
                      </span>
                      <IconDonor className="w-4 h-4 text-[#0b3c26]" />
                    </div>
                    <p className="text-xs font-bold text-foreground leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 w-fit">
                      {item.category}
                    </p>
                    <p className="text-[11px] text-slate-700 font-medium">
                      {item.windowNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
