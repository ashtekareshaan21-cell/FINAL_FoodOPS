export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDonorDonations } from '@/app/actions/donations';
import Navbar from '@/components/Navbar';
import DonorDonationsList from './DonorDonationsList';

const STATUS_STYLING: Record<string, { bg: string; label: string; dot: string }> = {
  AVAILABLE: { 
    bg: 'bg-info-bg border-info-border text-info', 
    dot: 'bg-info', 
    label: 'Available' 
  },
  ACCEPTED: { 
    bg: 'bg-warning-bg border-warning-border text-warning', 
    dot: 'bg-warning', 
    label: 'NGO Claimed' 
  },
  VOLUNTEER_ASSIGNED: { 
    bg: 'bg-warning-bg border-warning-border text-warning', 
    dot: 'bg-warning', 
    label: 'Rider Booked' 
  },
  PICKUP_IN_PROGRESS: { 
    bg: 'bg-warning-bg border-warning-border text-warning', 
    dot: 'bg-warning animate-pulse', 
    label: 'Rider En Route' 
  },
  PICKED_UP: { 
    bg: 'bg-warning-bg border-warning-border text-warning', 
    dot: 'bg-warning', 
    label: 'Collected' 
  },
  DELIVERY_IN_PROGRESS: { 
    bg: 'bg-warning-bg border-warning-border text-warning', 
    dot: 'bg-warning animate-pulse', 
    label: 'Delivery Transit' 
  },
  DELIVERED: { 
    bg: 'bg-success-bg border-success-border text-success', 
    dot: 'bg-success', 
    label: 'Delivered' 
  },
  COMPLETED: { 
    bg: 'bg-success-bg border-success-border text-success', 
    dot: 'bg-success', 
    label: 'Rescued' 
  },
  CANCELLED: { 
    bg: 'bg-danger-bg border-danger-border text-danger', 
    dot: 'bg-danger', 
    label: 'Cancelled' 
  },
  EXPIRED: { 
    bg: 'bg-danger-bg border-danger-border text-danger', 
    dot: 'bg-danger', 
    label: 'Biogas Diverted' 
  },
};

const STEP_ORDER = [
  'AVAILABLE',
  'ACCEPTED',
  'VOLUNTEER_ASSIGNED',
  'PICKUP_IN_PROGRESS',
  'PICKED_UP',
  'DELIVERY_IN_PROGRESS',
  'COMPLETED'
];

const STEPS = [
  { label: 'Published', icon: '📝' },
  { label: 'NGO Claimed', icon: '🤝' },
  { label: 'Rider Booked', icon: '👤' },
  { label: 'Rider Transit', icon: '🚴' },
  { label: 'Collected', icon: '📦' },
  { label: 'Delivering', icon: '🚚' },
  { label: 'Rescued', icon: '🎉' }
];

function DonationProgressStepper({ status }: { status: string }) {
  let activeStep = 0;
  if (status === 'COMPLETED' || status === 'DELIVERED') {
    activeStep = 6;
  } else {
    activeStep = STEP_ORDER.indexOf(status);
    if (activeStep === -1) activeStep = 0;
  }

  return (
    <div className="mt-6 pt-5 border-t border-border">
      <span className="text-[9px] uppercase font-bold text-muted tracking-widest block mb-4">
        Surplus Rescue Progression
      </span>
      <div className="flex items-center justify-between w-full relative">
        {/* Track Line Background */}
        <div className="absolute left-0 right-0 top-5 -translate-y-1/2 h-[2px] bg-border rounded-full -z-10" />
        <div 
          className="absolute left-0 top-5 -translate-y-1/2 h-[2px] bg-primary rounded-full -z-10 transition-all duration-700 ease-out" 
          style={{ width: `${(activeStep / 6) * 100}%` }}
        />
        
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeStep;
          const isActive = idx === activeStep;
          
          return (
            <div key={idx} className="flex flex-col items-center flex-1 relative">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-primary text-white shadow-sm' 
                    : isActive 
                    ? 'bg-surface border-2 border-primary text-primary shadow-md ring-4 ring-primary/5' 
                    : 'bg-surface border border-border text-muted-light'
                }`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-[10px] font-bold tracking-tight whitespace-nowrap hidden sm:block ${
                  isActive ? 'text-foreground font-black' : 'text-muted'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sm:hidden mt-3 flex items-center justify-between text-xs bg-surface-muted p-2 rounded-sm border border-border">
        <span className="text-muted">Current Stage:</span>
        <span className="font-bold text-primary flex items-center gap-1.5">
          <span>{STEPS[activeStep].icon}</span>
          <span>{STEPS[activeStep].label}</span>
        </span>
      </div>
    </div>
  );
}

export default async function DonorDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    redirect('/login');
  }

  const donor = await prisma.donorProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!donor) {
    redirect('/login');
  }

  const donations = await getDonorDonations();

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 pb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
              {donor.organizationName}
            </h1>
            <p className="mt-1 text-sm text-muted-text font-medium">
              Catering Profile Type: <span className="font-semibold text-foreground">{donor.organizationType}</span> &bull; Facility Center
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/donor/create"
              className="btn-primary flex items-center gap-1.5 px-5 py-3 shadow-md shadow-primary/10 hover:scale-[1.01]"
            >
              <span>+</span>
              <span>Publish Surplus Food</span>
            </Link>
          </div>
        </div>

        {/* Donations Grid Layout */}
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
            Surplus Rescue Requests
          </h2>

          {donations.length === 0 ? (
            <div className="text-center bg-surface border border-border rounded-lg p-16 shadow-sm">
              <div className="w-16 h-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                📋
              </div>
              <h3 className="text-lg font-bold text-foreground">No active donations published</h3>
              <p className="mt-1.5 text-sm text-muted-text max-w-sm mx-auto font-medium">
                Clean and list food from banquet halls, catering event reserves, or kitchens.
              </p>
              <div className="mt-8">
                <Link
                  href="/donor/create"
                  className="btn-primary px-5 py-2.5 shadow-sm"
                >
                  List Surplus Now
                </Link>
              </div>
            </div>
          ) : (
            <DonorDonationsList donations={donations} />
          )}
        </div>
      </main>
    </div>
  );
}
