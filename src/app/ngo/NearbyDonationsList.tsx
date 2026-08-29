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
  donor: {
    organizationName: string;
  };
}

interface NearbyDonationsListProps {
  availableDonations: DonationItem[];
  acceptDonation: (donationId: string) => Promise<{ success: boolean; error?: string; donation?: unknown }>;
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
              className={`donation-grid-card bg-surface border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 hover:scale-[1.005] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between ${
                mounted && !prefersReducedMotion() ? 'opacity-0' : 'opacity-100'
              }`}
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
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-black/60 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-widest border border-white/10 font-mono">
                      📍 {donation.distance.toFixed(1)} km away
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground leading-snug">
                      {donation.title}
                    </h3>
                    <p className="text-xs text-muted-text line-clamp-2 leading-relaxed font-medium">
                      {donation.description}
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs text-muted-text bg-surface-muted p-3.5 rounded-md border border-border font-medium">
                    <div>
                      <span className="font-bold text-foreground">Donor:</span>{' '}
                      <span>{donation.donor.organizationName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-foreground">Pickup Address:</span>{' '}
                      <span className="break-words">{donation.pickupAddress}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border mt-2 text-[11px]">
                      <div>
                        <span className="font-bold text-foreground">Qty:</span>{' '}
                        <span>{donation.quantity} {donation.quantityUnit}</span>
                      </div>
                      <div>
                        <span className="font-bold text-foreground">Dietary:</span>{' '}
                        <span className="capitalize">{donation.vegNonVegMixed.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="pt-1.5">
                      <a
                        href={buildGoogleMapsSearchUrl(donation.pickupLatitude, donation.pickupLongitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                      >
                        🗺️ View in Google Maps &rarr;
                      </a>
                    </div>
                    <div className="pt-2 border-t border-border mt-2">
                      <span className="font-bold text-foreground">Must Collect Before:</span>{' '}
                      <span className="text-danger font-bold font-mono">
                        <ClientDateTime date={donation.pickupDeadlineAt} />
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
