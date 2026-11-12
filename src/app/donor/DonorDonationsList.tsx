'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { getFoodCategoryImage, getAvatarGradient, getInitials } from '@/lib/ui';
import ShowOtpButton from './ShowOtpButton';
import ClientDateTime from '@/components/ClientDateTime';
import { MOTION } from '@/animations/config';
import { prefersReducedMotion } from '@/animations/accessibility';
import { staggerCards } from '@/animations/cards';

interface DonationItem {
  id: string;
  title: string;
  description: string;
  status: string;
  foodCategory: string;
  vegNonVegMixed: string;
  quantity: string;
  quantityUnit: string;
  pickupDeadlineAt: Date | string;
  cancelReason?: string | null;
  acceptedNgo?: {
    organizationName: string;
  } | null;
  assignment?: {
    id: string;
    volunteer?: {
      name: string;
      phoneNumber: string;
    } | null;
  } | null;
}

interface DonorDonationsListProps {
  donations: DonationItem[];
}

const STATUS_STYLING: Record<string, { bg: string; label: string; dot: string }> = {
  AVAILABLE: { bg: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-600', label: 'Available' },
  ACCEPTED: { bg: 'bg-amber-50 border-amber-200 text-amber-900', dot: 'bg-amber-600', label: 'NGO Claimed' },
  VOLUNTEER_ASSIGNED: { bg: 'bg-amber-50 border-amber-200 text-amber-900', dot: 'bg-amber-600', label: 'Rider Booked' },
  PICKUP_IN_PROGRESS: { bg: 'bg-amber-50 border-amber-200 text-amber-900', dot: 'bg-amber-600 animate-pulse', label: 'Rider En Route' },
  PICKED_UP: { bg: 'bg-amber-50 border-amber-200 text-amber-900', dot: 'bg-amber-600', label: 'Collected' },
  DELIVERY_IN_PROGRESS: { bg: 'bg-amber-50 border-amber-200 text-amber-900', dot: 'bg-amber-600 animate-pulse', label: 'Delivery Transit' },
  DELIVERED: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-600', label: 'Delivered' },
  COMPLETED: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-600', label: 'Rescued' },
  CANCELLED: { bg: 'bg-rose-50 border-rose-200 text-rose-800', dot: 'bg-rose-600', label: 'Cancelled' },
  EXPIRED: { bg: 'bg-amber-50 border-amber-200 text-amber-900', dot: 'bg-amber-600', label: 'SLA Expired — Biogas Recovery' },
  RECOVERY_ESCALATED: { bg: 'bg-sky-50 border-sky-200 text-sky-900', dot: 'bg-sky-600', label: 'Recovery Escalated' },
  ORGANIC_RECOVERY: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-900', dot: 'bg-emerald-600', label: 'Organic Recovery Completed' },
};

const STEP_ORDER = ['AVAILABLE', 'ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_IN_PROGRESS', 'PICKED_UP', 'DELIVERY_IN_PROGRESS', 'COMPLETED'];

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

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const targetWidth = `${(activeStep / 6) * 100}%`;

    if (prefersReducedMotion()) {
      el.style.width = targetWidth;
      return;
    }

    const anim = animate(el, {
      width: targetWidth,
      duration: MOTION.duration.medium,
      ease: MOTION.easing.smooth,
    });

    return () => {
      anim.revert();
    };
  }, [activeStep]);

  return (
    <div className="mt-6 pt-5 border-t border-border">
      <span className="text-[9px] uppercase font-bold text-muted tracking-widest block mb-4">
        Surplus Rescue Progression
      </span>
      <div className="flex items-center justify-between w-full relative">
        {/* Track Line Background */}
        <div className="absolute left-0 right-0 top-5 -translate-y-1/2 h-[2px] bg-border rounded-full -z-10" />
        <div 
          ref={trackRef}
          className="absolute left-0 top-5 -translate-y-1/2 h-[2px] bg-primary rounded-full -z-10"
          style={{ width: '0%' }}
        />
        
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeStep;
          const isActive = idx === activeStep;
          
          return (
            <div key={idx} className="flex flex-col items-center flex-1 relative">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-primary text-white shadow-sm scale-100' 
                    : isActive 
                    ? 'bg-surface border-2 border-primary text-primary shadow-md ring-4 ring-primary/5 scale-[1.08]' 
                    : 'bg-surface border border-border text-muted-light scale-100'
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

export default function DonorDonationsList({ donations }: DonorDonationsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const cards = el.querySelectorAll('.donation-card');
    const anim = staggerCards(cards);
    
    return () => {
      if (anim) anim.revert();
    };
  }, [donations]);

  return (
    <div 
      ref={containerRef}
      className="space-y-6"
    >
      {donations.map((donation) => {
        const style = STATUS_STYLING[donation.status] || { bg: 'bg-surface border-border text-foreground', label: donation.status, dot: 'bg-muted' };
        const foodImg = getFoodCategoryImage(donation.foodCategory);
        const ngoGrad = donation.acceptedNgo ? getAvatarGradient(donation.acceptedNgo.organizationName) : '';
        const ngoInit = donation.acceptedNgo ? getInitials(donation.acceptedNgo.organizationName) : '';

        return (
          <div
            key={donation.id}
            className="donation-card bg-surface border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.005] hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row opacity-100"
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
                          <ClientDateTime date={donation.pickupDeadlineAt} />
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
                  <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] mt-0.5">Notice</span>
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
  );
}
