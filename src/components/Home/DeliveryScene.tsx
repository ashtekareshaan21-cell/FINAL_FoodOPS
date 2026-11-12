import DemoPanelBanner from '@/components/DemoPanelBanner';
import { IconCheck, IconDonor, IconNgo, IconRider } from '@/components/Icons';

const TRANSIT_STAGES = [
  'Preparing',
  'Sealed & checked',
  'In transit (example)',
  'Delivered to NGO (example)',
];

export default function DeliveryScene() {
  return (
    <section className="relative py-20 border-t border-border bg-surface-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Narrative Text */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <span className="text-[11px] font-bold text-[#0b3c26] uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit block">
              Step 5: Last-Mile Delivery Routing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground leading-[1.1] font-display">
              REDUCE TRANSIT. <br />
              COMPLETE <br />
              <span className="text-emerald-800 font-display">HANDOVER.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              FoodOPS matches local volunteer riders to active NGO claims and records server-timestamped milestones from pickup confirmation through final distribution drop-off.
            </p>
          </div>

          {/* Delivery Showcase Card (F06, F19, F35, F36) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-xl bg-surface border border-border rounded-xl p-6 shadow-md space-y-5">
              <DemoPanelBanner title="Example transit scenario" />

              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Example Transit Flow
                  </h3>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    A hotel kitchen to a shelter, about 4 km in this scenario
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Illustrative Duration
                  </span>
                  <span className="text-sm font-extrabold text-[#0b3c26] font-mono">
                    Example: about 12 minutes in this scenario
                  </span>
                </div>
              </div>

              {/* Clean Text-Backed Route Visual */}
              <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted border border-border px-4 py-5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <span className="w-8 h-8 rounded-lg bg-white border border-border text-[#0b3c26] flex items-center justify-center">
                    <IconDonor className="w-4 h-4" />
                  </span>
                  <span>Donor Kitchen</span>
                </div>

                <div className="flex-1 border-t-2 border-dashed border-emerald-700 relative mx-2">
                  <span className="sr-only">Route between donor kitchen and NGO shelter</span>
                  <div className="w-7 h-7 rounded-full bg-[#0b3c26] text-white flex items-center justify-center mx-auto -mt-3.5 shadow-xs">
                    <IconRider className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <span className="w-8 h-8 rounded-lg bg-white border border-border text-[#0b3c26] flex items-center justify-center">
                    <IconNgo className="w-4 h-4" />
                  </span>
                  <span>NGO Shelter</span>
                </div>
              </div>

              {/* Text Status Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-800">
                {TRANSIT_STAGES.map((stage) => (
                  <div key={stage} className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                      <IconCheck className="w-3 h-3" />
                    </span>
                    <span>{stage}</span>
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
