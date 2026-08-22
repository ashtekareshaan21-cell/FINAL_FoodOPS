'use client';

import { motion, useReducedMotion } from 'motion/react';
import AcceptButton from './AcceptButton';
import { getFoodCategoryImage } from '@/lib/ui';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';

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
  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : 12;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-6 md:grid-cols-2"
    >
      {availableDonations.map((donation) => {
        const foodImg = getFoodCategoryImage(donation.foodCategory);
        return (
          <motion.div
            key={donation.id}
            variants={cardVariants}
            whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
            className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between"
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
                      {new Date(donation.pickupDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(donation.pickupDeadlineAt).toLocaleDateString()})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <AcceptButton donationId={donation.id} acceptDonation={acceptDonation} />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
