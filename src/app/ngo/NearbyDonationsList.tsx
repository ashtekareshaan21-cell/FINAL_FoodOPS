'use client';

import { useEffect, useRef, useState } from 'react';
import AcceptButton from './AcceptButton';
import { getFoodCategoryImage } from '@/lib/ui';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';
import ClientDateTime from '@/components/ClientDateTime';
import { prefersReducedMotion } from '@/animations/accessibility';
import { staggerCards } from '@/animations/cards';
import AlertNotification from '@/components/visual/AlertNotification';

interface DonationItem {
  id: string;
  title: string;
  description: string;
  foodCategory: string;
  vegNonVegMixed: string;
  quantity: string;
  quantityUnit: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupDeadlineAt: Date | string;
  distance: number;
  score: number;
  donor: {
    organizationName: string;
  };
}

interface NearbyDonationsListProps {
  availableDonations: DonationItem[];
  acceptDonation: (donationId: string) => Promise<{ success: boolean; error?: string; donation?: unknown }>;
}

function RescueWindowCountdown({ deadline }: { deadline: Date | string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        setIsUrgent(true);
        return;
      }
      const mins = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      setIsUrgent(mins < 60);

      if (hours > 0) {
        setTimeLeft(`${hours}H ${remMins}M REMAINING`);
      } else {
        setTimeLeft(`${mins} MIN REMAINING`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) return null;

  return (
    <span className={`status-badge text-[10px] font-extrabold font-mono ${
      isUrgent ? 'bg-red-50 text-red-800 border-red-200 animate-pulse' : 'bg-amber-50 text-amber-800 border-amber-200'
    }`}>
      ⏱️ {timeLeft}
    </span>
  );
}

export default function NearbyDonationsList({ availableDonations, acceptDonation }: NearbyDonationsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (availableDonations.length > 0) {
      // Trigger notification pop up slightly after mounting
      const t = setTimeout(() => {
        setShowAlert(true);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [availableDonations]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const cards = el.querySelectorAll('.donation-grid-card');
    const anim = staggerCards(cards);
    return () => {
      if (anim) anim.revert();
    };
  }, [availableDonations]);

  return (
    <>
      {showAlert && availableDonations.length > 0 && (
        <AlertNotification
          title="New Surplus Match"
          message={`New ${availableDonations[0].foodCategory} surplus match listed: "${availableDonations[0].title}" by ${availableDonations[0].donor.organizationName}`}
          onClose={() => setShowAlert(false)}
        />
      )}

      <div 
        ref={containerRef}
        className="grid gap-6 md:grid-cols-2"
      >
        {availableDonations.map((donation) => {
          const foodImg = getFoodCategoryImage(donation.foodCategory);
          return (
            <div
              key={donation.id}
              className="donation-grid-card bg-surface border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 hover:scale-[1.005] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between opacity-100"
            >
              <div>
                {/* Banner Photo */}
                <div className="relative h-44 w-full bg-surface-muted">
                  <img 
                    src={foodImg} 
                    alt={donation.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-[#0b3c26] backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-widest border border-emerald-400/20 font-mono shadow-sm">
                      🔥 Match: {donation.score}%
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <RescueWindowCountdown deadline={donation.pickupDeadlineAt} />
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        📍 {donation.distance.toFixed(1)} km away
                      </span>
                      <span className="status-badge status-badge-active text-[10px]">
                        {donation.vegNonVegMixed}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-[#0b3c26] leading-snug font-display">
                      {donation.title}
                    </h3>
                    <p className="text-xs text-muted-text line-clamp-2 leading-relaxed font-medium">
                      {donation.description}
                    </p>
                  </div>

                  {/* Explainable Match Factors */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-900 space-y-1">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-emerald-800">Match Explainability Reason</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold">
                      <span>✓ Nearby ({donation.distance.toFixed(1)} km)</span>
                      <span>✓ Accepts Category</span>
                      <span>✓ Capacity Available</span>
                      <span>✓ Active Rescue Window</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200 font-medium">
                    <div>
                      <span className="font-bold text-slate-800">Donor Facility:</span>{' '}
                      <span className="font-semibold text-slate-900">{donation.donor.organizationName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Pickup Address:</span>{' '}
                      <span className="break-words">{donation.pickupAddress}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 mt-2 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-800">Quantity:</span>{' '}
                        <span className="font-bold text-[#0b3c26]">{donation.quantity} {donation.quantityUnit}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">Category:</span>{' '}
                        <span className="capitalize font-semibold">{donation.foodCategory}</span>
                      </div>
                    </div>
                    <div className="pt-1.5 flex justify-between items-center border-t border-slate-200 mt-2">
                      <a
                        href={buildGoogleMapsSearchUrl(donation.pickupLatitude, donation.pickupLongitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0b3c26] hover:underline"
                      >
                        🗺️ View in Google Maps &rarr;
                      </a>
                      <span className="text-[11px] font-mono text-slate-500">
                        Deadline: <ClientDateTime date={donation.pickupDeadlineAt} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <AcceptButton donationId={donation.id} acceptDonation={acceptDonation} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
