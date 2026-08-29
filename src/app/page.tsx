export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getAdminStats } from '@/app/actions/admin';
import HeroSection from '@/components/Home/HeroSection';
import OrdersScene from '@/components/Home/OrdersScene';
import KitchenScene from '@/components/Home/KitchenScene';
import InventoryScene from '@/components/Home/InventoryScene';
import IntelligenceScene from '@/components/Home/IntelligenceScene';
import DeliveryScene from '@/components/Home/DeliveryScene';
import AnalyticsScene from '@/components/Home/AnalyticsScene';
import FinalScene from '@/components/Home/FinalScene';
import EsgMetrics from '@/components/Home/EsgMetrics';
import RoadmapSection from '@/components/Home/RoadmapSection';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';

export default async function Home() {
  let stats = {
    foodWeightKg: 0,
    completedRescues: 0,
    co2SavedKg: 0,
    waterSavedLiters: 0,
    verifiedNgos: 0,
    totalNgos: 0,
  };

  try {
    stats = await getAdminStats();
  } catch (error) {
    console.error('Failed to load homepage admin stats:', error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-foreground transition-colors duration-300 relative">
      <FoodOpsBackground variant="hero" />
      <Navbar />

      <main className="flex-grow">
        {/* Animated Hero Section */}
        <HeroSection />

        {/* Scene 1: Orders */}
        <OrdersScene />

        {/* Scene 2: Kitchen */}
        <KitchenScene />

        {/* Scene 3: Inventory */}
        <InventoryScene />

        {/* Scene 4: Intelligence */}
        <IntelligenceScene />

        {/* Scene 5: Delivery */}
        <DeliveryScene />

        {/* Scene 6: Analytics & command-center */}
        <AnalyticsScene />

        {/* Live ESG Balance Sheet (Impact Statistics) */}
        <EsgMetrics stats={stats} />

        {/* Scene 7: Climax system diagram & CTA */}
        <FinalScene />

        {/* Roadmap section: "FoodOps is evolving" */}
        <RoadmapSection />

        {/* How It Works Process Sections */}
        <section id="how-it-works" className="bg-surface border-t border-border py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-3">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Verification & Logistics Timeline</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display">
                Rescue Operations
              </h2>
              <p className="max-w-2xl mx-auto text-sm text-muted-text leading-relaxed font-medium">
                FoodOps coordinates donors, NGOs, and riders to ensure safe, transparent collections.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Donor */}
              <div className="group bg-surface p-8 rounded-lg border border-border hover:border-primary/20 hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
                    🏨
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">1. List Surplus</h3>
                  <p className="text-muted-text text-xs leading-relaxed mb-6 font-medium">
                    Commercial kitchens list surplus items. Gemini AI scans photos, reviews packaging styles, estimates weight, and flags spillage warnings.
                  </p>
                </div>
                <Link href="/register" className="text-primary font-bold text-xs hover:underline inline-flex items-center gap-1">
                  Onboard Facility &rarr;
                </Link>
              </div>

              {/* NGO */}
              <div className="group bg-surface p-8 rounded-lg border border-border hover:border-primary/20 hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
                    🌍
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">2. Match & Claim</h3>
                  <p className="text-muted-text text-xs leading-relaxed mb-6 font-medium">
                    Verified NGOs are matched by service radius and accepted categories. Atomic database locks prevent concurrent claims.
                  </p>
                </div>
                <Link href="/register" className="text-primary font-bold text-xs hover:underline inline-flex items-center gap-1">
                  Onboard NGO Org &rarr;
                </Link>
              </div>

              {/* Volunteer */}
              <div className="group bg-surface p-8 rounded-lg border border-border hover:border-primary/20 hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
                    🚴
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">3. Transit & Handover</h3>
                  <p className="text-muted-text text-xs leading-relaxed mb-6 font-medium">
                    Rescue riders confirm pickup via a secure, time-bound digital OTP check. Carbon abatement impact metrics are instantly calculated and registered.
                  </p>
                </div>
                <Link href="/register" className="text-primary font-bold text-xs hover:underline inline-flex items-center gap-1">
                  Join Rider Team &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface border-t border-border py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-muted text-xs font-semibold">
          <p>&copy; {new Date().getFullYear()} FoodOps. Developed for the Climate Tech & Sustainability Hackathon.</p>
          <div className="flex gap-4 font-bold">
            <a href="#" className="hover:text-foreground">Compliance</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-foreground">FSSAI Rules</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
