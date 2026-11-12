import DemoPanelBanner from '@/components/DemoPanelBanner';
import { IconClock } from '@/components/Icons';

export default function KitchenScene() {
  return (
    <section className="relative py-20 border-t border-border bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Narrative Text */}
          <div className="lg:col-span-5 space-y-6 text-left lg:order-last">
            <span className="text-[11px] font-bold text-[#0b3c26] uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit block">
              Step 2: Partner Claiming &amp; Staging
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground leading-[1.1] font-display">
              FROM LISTING <br />
              TO <br />
              <span className="text-emerald-800 font-display">PICKUP.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              Once an NGO claims a surplus batch using first-accept locking, no other NGO can double-claim it. Kitchen staff prepare sealed containers while pickup status advances with server timestamps.
            </p>

            <div className="flex items-center gap-3 border-l-2 border-[#0b3c26] pl-4 py-1">
              <IconClock className="w-5 h-5 text-[#0b3c26] shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Server-Enforced Pickup Windows
                </p>
                <p className="text-xs font-semibold text-foreground">
                  Unclaimed or lapsed batches automatically route to compost or biogas partners
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Example Panel (F06) */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-md space-y-5">
              <DemoPanelBanner title="Example workflow" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface-muted p-4 rounded-lg border border-border space-y-3">
                  <div className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                    1. PENDING (Example)
                  </div>
                  <div className="p-3 bg-surface border border-border rounded-md shadow-xs space-y-1">
                    <p className="text-xs font-bold text-foreground">Example order A</p>
                    <p className="text-[11px] font-semibold text-sky-900">Vegetable Biryani (~18 kg)</p>
                    <p className="text-[11px] text-slate-700">Status: Awaiting NGO claim</p>
                  </div>
                </div>

                <div className="bg-surface-muted p-4 rounded-lg border border-border space-y-3">
                  <div className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                    2. CLAIMED (Example)
                  </div>
                  <div className="p-3 bg-surface border border-border rounded-md shadow-xs space-y-1">
                    <p className="text-xs font-bold text-foreground">Example order B</p>
                    <p className="text-[11px] font-semibold text-amber-900">Packed Meal Trays (~14 kg)</p>
                    <p className="text-[11px] text-slate-700">Status: Claim locked, packing</p>
                  </div>
                </div>

                <div className="bg-surface-muted p-4 rounded-lg border border-border space-y-3">
                  <div className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                    3. READY FOR OTP
                  </div>
                  <div className="p-3 bg-surface border border-dashed border-slate-300 rounded-md space-y-1">
                    <p className="text-xs font-bold text-foreground">Handover stage</p>
                    <p className="text-[11px] text-slate-700">
                      Receiver checks food temperature and enters private one-time OTP.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
