export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDonorDonations } from '@/app/actions/donations';
import Navbar from '@/components/Navbar';
import { getFoodCategoryImage, getAvatarGradient, getInitials } from '@/lib/ui';

const STATUS_STYLING: Record<string, { bg: string; label: string; dot: string }> = {
  AVAILABLE: { 
    bg: 'bg-blue-50/50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400', 
    dot: 'bg-blue-500', 
    label: 'Available' 
  },
  ACCEPTED: { 
    bg: 'bg-purple-50/50 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900/50 dark:text-purple-400', 
    dot: 'bg-purple-500', 
    label: 'NGO Claimed' 
  },
  VOLUNTEER_ASSIGNED: { 
    bg: 'bg-indigo-50/50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400', 
    dot: 'bg-indigo-500', 
    label: 'Rider Booked' 
  },
  PICKUP_IN_PROGRESS: { 
    bg: 'bg-amber-50/50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400', 
    dot: 'bg-amber-500 animate-pulse', 
    label: 'Rider En Route' 
  },
  PICKED_UP: { 
    bg: 'bg-orange-50/50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-400', 
    dot: 'bg-orange-500', 
    label: 'Collected' 
  },
  DELIVERY_IN_PROGRESS: { 
    bg: 'bg-pink-50/50 border-pink-200 text-pink-700 dark:bg-pink-950/20 dark:border-pink-900/50 dark:text-pink-400', 
    dot: 'bg-pink-500 animate-pulse', 
    label: 'Delivery Transit' 
  },
  DELIVERED: { 
    bg: 'bg-teal-50/50 border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/50 dark:text-teal-400', 
    dot: 'bg-teal-500', 
    label: 'Delivered' 
  },
  COMPLETED: { 
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400', 
    dot: 'bg-emerald-500', 
    label: 'Rescued' 
  },
  CANCELLED: { 
    bg: 'bg-red-50/55 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/55 dark:text-red-400', 
    dot: 'bg-red-500', 
    label: 'Cancelled' 
  },
  EXPIRED: { 
    bg: 'bg-zinc-100 border-zinc-200 text-zinc-650 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400', 
    dot: 'bg-zinc-500', 
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
    <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
      <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-widest block mb-5">
        Surplus Rescue Progression
      </span>
      <div className="flex items-center justify-between w-full relative">
        {/* Track Line Background */}
        <div className="absolute left-0 right-0 top-5 -translate-y-1/2 h-[3px] bg-zinc-100 dark:bg-zinc-800/60 rounded-full -z-10" />
        <div 
          className="absolute left-0 top-5 -translate-y-1/2 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full -z-10 transition-all duration-700 ease-out" 
          style={{ width: `${(activeStep / 6) * 100}%` }}
        />
        
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeStep;
          const isActive = idx === activeStep;
          
          return (
            <div key={idx} className="flex flex-col items-center flex-1 relative">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-550 ${
                  isCompleted 
                    ? 'bg-emerald-500 text-white dark:bg-emerald-600 shadow-md shadow-emerald-500/20' 
                    : isActive 
                    ? 'bg-white border-2 border-emerald-500 text-emerald-600 dark:bg-zinc-900 shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-50 dark:ring-emerald-950/30' 
                    : 'bg-zinc-50 border border-zinc-200 text-zinc-400 dark:bg-zinc-950 dark:border-zinc-800'
                }`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-[10px] font-bold tracking-tight whitespace-nowrap hidden sm:block ${
                  isActive ? 'text-zinc-900 dark:text-zinc-50 font-extrabold' : 'text-zinc-400 dark:text-zinc-500'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sm:hidden mt-3 flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-150 dark:border-zinc-850">
        <span className="text-zinc-500 dark:text-zinc-400">Current Stage:</span>
        <span className="font-bold text-emerald-650 dark:text-emerald-450 flex items-center gap-1.5">
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
    throw new Error('Donor profile not found');
  }

  const donations = await getDonorDonations();

  return (
    <div className="min-h-screen bg-zinc-55 dark:bg-zinc-950 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-850 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {donor.organizationName}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Catering Profile Type: <span className="font-semibold text-zinc-700 dark:text-zinc-350">{donor.organizationType}</span> &bull; Bengaluru Facility
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/donor/create"
              className="inline-flex items-center gap-1.5 px-5 py-3 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-emerald-500/10 transition-all duration-200 hover:scale-[1.01]"
            >
              <span>+</span>
              <span>Publish Surplus Food</span>
            </Link>
          </div>
        </div>

        {/* Donations Grid Layout */}
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Surplus Rescue Requests
          </h2>

          {donations.length === 0 ? (
            <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-full flex items-center justify-center mx-auto mb-4">
                📋
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No active donations published</h3>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Clean and list food from banquet halls, catering event reserves, or kitchens.
              </p>
              <div className="mt-8">
                <Link
                  href="/donor/create"
                  className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  List Surplus Now
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {donations.map((donation) => {
                const style = STATUS_STYLING[donation.status] || { bg: 'bg-zinc-100 text-zinc-850', label: donation.status, dot: 'bg-zinc-500' };
                const foodImg = getFoodCategoryImage(donation.foodCategory);
                const ngoGrad = donation.acceptedNgo ? getAvatarGradient(donation.acceptedNgo.organizationName) : '';
                const ngoInit = donation.acceptedNgo ? getInitials(donation.acceptedNgo.organizationName) : '';

                return (
                  <div 
                    key={donation.id} 
                    className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-750 transition-all duration-300 flex flex-col md:flex-row"
                  >
                    {/* Food category photo card banner */}
                    <div className="relative w-full md:w-56 h-48 md:h-auto flex-shrink-0 bg-zinc-100 dark:bg-zinc-950">
                      <img 
                        src={foodImg} 
                        alt={donation.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent md:hidden" />
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${style.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      </div>
                    </div>

                    {/* Details content section */}
                    <div className="flex-grow p-6 flex flex-col justify-between space-y-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                            {donation.title}
                          </h3>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
                            {donation.description}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs text-zinc-400 dark:text-zinc-550">
                            <div className="flex items-center gap-1.5">
                              <span>⚖️</span>
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Weight</span>
                                <span className="font-semibold text-zinc-700 dark:text-zinc-200">{donation.quantity} {donation.quantityUnit}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>🥗</span>
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Type</span>
                                <span className="font-semibold text-zinc-700 dark:text-zinc-200 capitalize">{donation.foodCategory}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2">
                              <span>⏱️</span>
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Deadline</span>
                                <span className="font-semibold text-zinc-750 dark:text-zinc-200 font-mono">
                                  {new Date(donation.pickupDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(donation.pickupDeadlineAt).toLocaleDateString()})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NGO assignment summary panel */}
                        <div className="flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 min-w-[220px]">
                          {donation.acceptedNgo ? (
                            <div className="space-y-3">
                              <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Assigned Recovery Partner</span>
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${ngoGrad} text-white font-bold text-xs flex items-center justify-center shadow-inner`}>
                                  {ngoInit}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-1">
                                    {donation.acceptedNgo.organizationName}
                                    <span className="text-[10px] text-emerald-500">✓</span>
                                  </p>
                                  <p className="text-[10px] text-zinc-400 font-mono">Verified NGO</p>
                                </div>
                              </div>
                              {donation.assignment?.volunteer && (
                                <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-850/50">
                                  <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Rider Assigned</span>
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">🚴 {donation.assignment.volunteer.name}</span>
                                    <span className="text-zinc-400 dark:text-zinc-550 font-mono">{donation.assignment.volunteer.phoneNumber}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                              <span className="text-xl animate-pulse">🛰️</span>
                              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-2">Awaiting Matching</p>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-550 mt-0.5">Alerts sent to nearby active NGOs</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progression stepper */}
                      {['CANCELLED', 'EXPIRED'].includes(donation.status) ? (
                        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-3">
                          <span className="text-lg">⚠️</span>
                          <div>
                            <p className="font-bold text-zinc-750 dark:text-zinc-300">
                              Surplus Request Inactive ({donation.status === 'CANCELLED' ? 'Cancelled' : 'Expired / Spoiled'})
                            </p>
                            <p className="mt-0.5 text-zinc-400 dark:text-zinc-550">
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
