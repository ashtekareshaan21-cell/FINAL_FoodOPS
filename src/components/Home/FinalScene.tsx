import Link from 'next/link';
import {
  IconArrowRight,
  IconChart,
  IconDonor,
  IconNgo,
  IconRider,
  IconShield,
} from '@/components/Icons';

const SYSTEM_NODES = [
  { label: 'LISTINGS', Icon: IconDonor },
  { label: 'VERIFICATION', Icon: IconShield },
  { label: 'NGO CLAIM', Icon: IconNgo },
  { label: 'TRANSIT', Icon: IconRider },
  { label: 'LEDGER', Icon: IconChart },
];

export default function FinalScene() {
  return (
    <section className="relative py-20 border-t border-border bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Narrative & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="space-y-4">
              <span className="text-[11px] font-bold text-[#0b3c26] uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit block">
                FoodOPS Complete Ecosystem
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-foreground leading-[1.05] font-display">
                ONE SYSTEM. <br />
                EVERY <br />
                <span className="text-emerald-800 font-display">HANDOVER LOGGED.</span>
              </h2>
              <p className="max-w-lg text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                FoodOPS orchestrates the full rescue journey in Pune and Pimpri-Chinchwad. Join verified donor establishments, NGO redistribution centers, and volunteer riders with timestamped accountability from listing to receipt.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <Link
                href="/register"
                className="btn-primary w-full sm:w-auto px-7 py-3.5 shadow-md inline-flex items-center justify-center gap-2 text-sm font-bold"
              >
                <span>Register Organisation</span>
                <IconArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="btn-secondary w-full sm:w-auto px-7 py-3.5 text-center text-sm font-bold"
              >
                Sign In to Console
              </Link>
            </div>
          </div>

          {/* Text-Backed Architecture Flow */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0b3c26]">
                  FoodOPS Core State Machine
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  Server-Enforced Flow
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {SYSTEM_NODES.map(({ label, Icon }, index) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border bg-surface-muted p-3 flex flex-col items-center text-center gap-2"
                  >
                    <span className="text-[10px] font-bold text-slate-700">
                      Step {index + 1}
                    </span>
                    <span className="w-9 h-9 rounded-full bg-white border border-border text-[#0b3c26] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-extrabold text-foreground tracking-wide">
                      {label}
                    </span>
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
