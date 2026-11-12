'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const OrdersScene = dynamic(() => import('./OrdersScene'), {
  loading: () => <SceneSkeleton label="Step 1: Surplus Intake" />,
});
const KitchenScene = dynamic(() => import('./KitchenScene'), {
  loading: () => <SceneSkeleton label="Step 2: Partner Claiming & Staging" />,
});
const InventoryScene = dynamic(() => import('./InventoryScene'), {
  loading: () => <SceneSkeleton label="Step 3: Food Safety & Verification" />,
});
const IntelligenceScene = dynamic(() => import('./IntelligenceScene'), {
  loading: () => <SceneSkeleton label="Step 4: Dispatch Convergence" />,
});
const DeliveryScene = dynamic(() => import('./DeliveryScene'), {
  loading: () => <SceneSkeleton label="Step 5: Last-Mile Delivery Routing" />,
});
const AnalyticsScene = dynamic(() => import('./AnalyticsScene'), {
  loading: () => <SceneSkeleton label="Step 6: Verified Impact & Audit Ledger" />,
});
const FinalScene = dynamic(() => import('./FinalScene'), {
  loading: () => <SceneSkeleton label="FoodOPS Complete Ecosystem" />,
});

function SceneSkeleton({ label }: { label: string }) {
  return (
    <section className="py-16 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-surface p-8 text-xs font-semibold text-slate-700">
          Loading section: {label}...
        </div>
      </div>
    </section>
  );
}

export default function LazyHomeScenes() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={triggerRef}>
      {visible ? (
        <>
          <OrdersScene />
          <KitchenScene />
          <InventoryScene />
          <IntelligenceScene />
          <DeliveryScene />
          <AnalyticsScene />
          <FinalScene />
        </>
      ) : (
        <section className="py-12 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">
                Walkthrough: how FoodOPS coordinates surplus food rescues
              </h2>
              <p className="text-xs text-slate-700 mt-1">
                Scroll to view each step from surplus listing and safety checks to OTP pickup handover and verified counters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVisible(true)}
              className="btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Load workflow walkthrough
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
