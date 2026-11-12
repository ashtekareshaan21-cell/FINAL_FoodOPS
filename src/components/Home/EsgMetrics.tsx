import ImpactStats from '@/components/ImpactStats';

export default function EsgMetrics() {
  return (
    <section className="bg-surface-muted border-y border-border py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b3c26] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ESG Audit Registry
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground font-display">
            Real-Time Rescue Balance Sheet
          </h2>
        </div>

        <ImpactStats variant="balance-sheet" />
      </div>
    </section>
  );
}
