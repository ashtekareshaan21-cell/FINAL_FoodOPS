export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDonorDonations } from '@/app/actions/donations';
import Navbar from '@/components/Navbar';
import { getFoodCategoryImage, getAvatarGradient, getInitials } from '@/lib/ui';
import ShowOtpButton from './ShowOtpButton';

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
            <div className="space-y-6">
              {donations.map((donation) => {
                const style = STATUS_STYLING[donation.status] || { bg: 'bg-surface border-border text-foreground', label: donation.status, dot: 'bg-muted' };
                const foodImg = getFoodCategoryImage(donation.foodCategory);
                const ngoGrad = donation.acceptedNgo ? getAvatarGradient(donation.acceptedNgo.organizationName) : '';
                const ngoInit = donation.acceptedNgo ? getInitials(donation.acceptedNgo.organizationName) : '';

                return (
                  <div 
                    key={donation.id} 
                    className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-premium flex flex-col md:flex-row"
                  >
                    {/* Food image */}
                    <div className="relative w-full md:w-56 h-48 md:h-auto flex-shrink-0 bg-surface-muted">
                      <img 
                        src={foodImg} 
                        alt={donation.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${style.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      </div>
                    </div>

                    {/* Details section */}
                    <div className="flex-grow p-6 flex flex-col justify-between space-y-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-foreground leading-tight">
                            {donation.title}
                          </h3>
                          <p className="text-xs text-muted-text max-w-xl font-medium">
                            {donation.description}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs text-muted">
                            <div className="flex items-center gap-1.5">
                              <span>⚖️</span>
                              <div>
                                <span className="block text-[9px] uppercase font-bold text-muted-light">Weight</span>
                                <span className="font-semibold text-foreground">{donation.quantity} {donation.quantityUnit}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>🥗</span>
                              <div>
                                <span className="block text-[9px] uppercase font-bold text-muted-light">Type</span>
                                <span className="font-semibold text-foreground capitalize">{donation.foodCategory}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2">
                              <span>⏱️</span>
                              <div>
                                <span className="block text-[9px] uppercase font-bold text-muted-light">Deadline</span>
                                <span className="font-semibold text-foreground font-mono">
                                  {new Date(donation.pickupDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(donation.pickupDeadlineAt).toLocaleDateString()})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NGO panel */}
                        <div className="flex-shrink-0 bg-surface-muted p-4 rounded-md border border-border min-w-[220px]">
                          {donation.acceptedNgo ? (
                            <div className="space-y-3">
                              <span className="block text-[9px] uppercase font-bold text-muted tracking-wider">Assigned Partner NGO</span>
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${ngoGrad} text-white font-bold text-xs flex items-center justify-center shadow-inner`}>
                                  {ngoInit}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                                    {donation.acceptedNgo.organizationName}
                                    <span className="text-[10px] text-primary">✓</span>
                                  </p>
                                  <p className="text-[9px] text-muted-light font-mono">Verified NGO</p>
                                </div>
                              </div>
                              {donation.assignment?.volunteer && (
                                <div className="pt-2.5 border-t border-border">
                                  <span className="block text-[9px] uppercase font-bold text-muted tracking-wider mb-1">Rider Assigned</span>
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-foreground">🚴 {donation.assignment.volunteer.name}</span>
                                    <span className="text-muted-text font-mono">{donation.assignment.volunteer.phoneNumber}</span>
                                  </div>
                                </div>
                              )}
                              {donation.assignment && donation.status !== 'COMPLETED' && donation.status !== 'DELIVERED' && (
                                <ShowOtpButton assignmentId={donation.assignment.id} />
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                              <span className="text-xl animate-pulse">🛰️</span>
                              <p className="text-xs font-bold text-muted mt-2">Awaiting Match</p>
                              <p className="text-[9px] text-muted-light mt-0.5">Alerts dispatched to nearby NGOs</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progression stepper */}
                      {['CANCELLED', 'EXPIRED'].includes(donation.status) ? (
                        <div className="mt-4 p-4 bg-surface-muted border border-border rounded-md text-xs text-muted-text flex items-start gap-3">
                          <span className="text-lg">⚠️</span>
                          <div>
                            <p className="font-bold text-foreground">
                              Surplus Request Inactive ({donation.status === 'CANCELLED' ? 'Cancelled' : 'Expired / Spoiled'})
                            </p>
                            <p className="mt-0.5 text-muted-light">
                              {donation.status === 'CANCELLED' 
                                ? `This surplus listing was cancelled. Reason: "${donation.cancelReason || 'Not specified'}"` 
                                : 'Listing exceeded deadline without collection and has been diverted to Biogas Energy Recovery.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <DonationProgressStepper status={donation.status} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
