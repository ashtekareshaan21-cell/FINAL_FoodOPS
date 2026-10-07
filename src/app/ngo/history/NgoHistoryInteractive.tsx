'use client';

import { useState, useMemo } from 'react';
import ClientDateTime from '@/components/ClientDateTime';
import { buildGoogleMapsSearchUrl } from '@/lib/googleMapsUrl';

export interface NgoHistoryDonation {
  id: string;
  title: string;
  description: string;
  foodCategory: string;
  vegNonVegMixed: string;
  quantity: string;
  quantityUnit: string;
  estimatedServings?: number | null;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  donor: {
    organizationName: string;
    contactPerson: string;
    address: string;
  };
  assignment?: {
    volunteer?: {
      name: string;
      phoneNumber: string;
    } | null;
  } | null;
  statusHistory?: Array<{
    id: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    changedAt: Date | string;
    reason?: string | null;
  }>;
}

interface NgoHistoryInteractiveProps {
  history: NgoHistoryDonation[];
  impactMap: Record<
    string,
    {
      foodWeightKg: number;
      estimatedServings: number;
      co2EquivalentKg: number;
      waterSavedLiters: number;
      calculationMethod?: string;
      factorsUsed?: string;
    }
  >;
}

export default function NgoHistoryInteractive({ history, impactMap }: NgoHistoryInteractiveProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDonation, setSelectedDonation] = useState<NgoHistoryDonation | null>(null);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.foodCategory.toLowerCase().includes(q) ||
        item.donor.organizationName.toLowerCase().includes(q) ||
        (item.assignment?.volunteer?.name && item.assignment.volunteer.name.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter === 'COMPLETED') matchesStatus = item.status === 'COMPLETED';
      else if (statusFilter === 'CANCELLED') matchesStatus = item.status === 'CANCELLED';
      else if (statusFilter === 'EXPIRED') matchesStatus = item.status === 'EXPIRED';
      else if (statusFilter === 'RECOVERY') matchesStatus = ['RECOVERY_ESCALATED', 'ORGANIC_RECOVERY'].includes(item.status);

      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['ALL', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'RECOVERY'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === st
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-surface-muted text-muted-text hover:bg-surface-hover border border-border'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search rescues by food, donor, rider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium py-2 px-3 pl-9 text-xs"
          />
          <span className="absolute left-3 top-2.5 text-muted-light text-xs">🔍</span>
        </div>
      </div>

      {/* Rescue Cards Grid */}
      {filteredHistory.length === 0 ? (
        <div className="text-center bg-surface border border-border rounded-lg p-12 shadow-sm">
          <p className="text-sm text-muted-text font-medium">No rescue history items match your search filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredHistory.map((donation) => {
            const rescueIdCode = `RESCUE #FO-${donation.id.slice(-6).toUpperCase()}`;
            const impact = impactMap[donation.id];

            return (
              <div
                key={donation.id}
                onClick={() => setSelectedDonation(donation)}
                className="card-premium p-5 shadow-sm hover:shadow-md hover:border-primary/40 cursor-pointer transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
              >
                <div className="space-y-1.5 flex-grow">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-extrabold text-primary tracking-wider">{rescueIdCode}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        donation.status === 'COMPLETED'
                          ? 'bg-success-bg border border-success-border text-success'
                          : donation.status === 'EXPIRED'
                          ? 'bg-danger-bg border border-danger-border text-danger'
                          : 'bg-surface-muted border border-border text-muted-text'
                      }`}
                    >
                      {donation.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {donation.title}
                  </h3>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-text font-medium">
                    <span>🏢 Donor: <strong className="text-foreground">{donation.donor.organizationName}</strong></span>
                    <span>📦 Qty: <strong className="text-foreground">{donation.quantity} {donation.quantityUnit}</strong></span>
                    <span>🚴 Rider: <strong className="text-foreground">{donation.assignment?.volunteer?.name || 'Assigned'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {impact && (
                    <div className="text-right hidden md:block">
                      <p className="text-xs font-extrabold text-success">{impact.foodWeightKg.toFixed(1)} kg Rescued</p>
                      <p className="text-[10px] text-muted-light font-mono">{impact.estimatedServings} Meals Served</p>
                    </div>
                  )}
                  <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                    View Details &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rescue Detail Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-surface border border-border rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <span className="font-mono text-xs font-extrabold text-primary tracking-widest uppercase">
                  RESCUE #FO-{selectedDonation.id.slice(-6).toUpperCase()}
                </span>
                <h2 className="text-xl font-extrabold text-foreground mt-1">{selectedDonation.title}</h2>
              </div>
              <button
                onClick={() => setSelectedDonation(null)}
                className="text-muted-light hover:text-foreground text-xl font-bold p-1 rounded-md hover:bg-surface-hover"
              >
                ✕
              </button>
            </div>

            {/* Food & Donor Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium bg-surface-muted p-4 rounded-lg border border-border">
              <div>
                <p className="font-bold text-foreground uppercase tracking-wider text-[9px] mb-1">Food Category & Quantity</p>
                <p className="text-foreground font-semibold">{selectedDonation.quantity} {selectedDonation.quantityUnit}</p>
                <p className="text-muted-text mt-0.5">Category: <span className="font-mono text-primary font-bold uppercase">{selectedDonation.foodCategory}</span></p>
                {selectedDonation.estimatedServings && (
                  <p className="text-muted-text mt-0.5">Servings: {selectedDonation.estimatedServings} meals</p>
                )}
              </div>

              <div>
                <p className="font-bold text-foreground uppercase tracking-wider text-[9px] mb-1">Donor Information</p>
                <p className="text-foreground font-semibold">{selectedDonation.donor.organizationName}</p>
                <p className="text-muted-text mt-0.5">Contact: {selectedDonation.donor.contactPerson}</p>
                <a
                  href={buildGoogleMapsSearchUrl(selectedDonation.pickupLatitude, selectedDonation.pickupLongitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-primary hover:underline font-bold mt-1 text-[11px]"
                >
                  🗺️ Map Location &rarr;
                </a>
              </div>

              <div>
                <p className="font-bold text-foreground uppercase tracking-wider text-[9px] mb-1">Assigned Volunteer Rider</p>
                <p className="text-foreground font-semibold">{selectedDonation.assignment?.volunteer?.name || 'N/A'}</p>
                <p className="text-muted-text mt-0.5">{selectedDonation.assignment?.volunteer?.phoneNumber || 'No phone'}</p>
              </div>

              <div>
                <p className="font-bold text-foreground uppercase tracking-wider text-[9px] mb-1">Operational Lifecycle Status</p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20 mt-0.5">
                  {selectedDonation.status}
                </span>
              </div>
            </div>

            {/* Impact Record if Available */}
            {impactMap[selectedDonation.id] && (
              <div className="bg-success-bg/20 border border-success-border p-4 rounded-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="font-bold text-success uppercase tracking-wider text-[10px]">
                    Verified Ecological Impact Metrics
                  </p>
                  {impactMap[selectedDonation.id].calculationMethod && (
                    <span className="text-[9px] font-mono font-bold bg-success-bg text-success border border-success-border px-1.5 py-0.5 rounded">
                      {impactMap[selectedDonation.id].calculationMethod}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-lg font-extrabold text-success">{impactMap[selectedDonation.id].foodWeightKg.toFixed(1)} kg</p>
                    <p className="text-[10px] text-muted-text">Food Saved</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-success">{impactMap[selectedDonation.id].estimatedServings}</p>
                    <p className="text-[10px] text-muted-text">Meals Provided</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-success">{impactMap[selectedDonation.id].co2EquivalentKg.toFixed(1)} kg</p>
                    <p className="text-[10px] text-muted-text">CO₂e Prevented</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-success">{impactMap[selectedDonation.id].waterSavedLiters.toFixed(0)} L</p>
                    <p className="text-[10px] text-muted-text">Water Saved</p>
                  </div>
                </div>

                {impactMap[selectedDonation.id].factorsUsed && (
                  <div className="pt-2 border-t border-success-border/40 text-[10px] text-muted-text">
                    <span className="font-bold text-foreground">Live Telemetry & Factors: </span>
                    <span className="font-mono text-[9px]">{impactMap[selectedDonation.id].factorsUsed}</span>
                  </div>
                )}
              </div>
            )}

            {/* Timeline Audit Logs */}
            <div>
              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider mb-3">Rescue Audit Timeline</h4>
              {(!selectedDonation.statusHistory || selectedDonation.statusHistory.length === 0) ? (
                <p className="text-xs text-muted-text italic">No status transition history recorded.</p>
              ) : (
                <div className="space-y-3 relative pl-4 border-l-2 border-border">
                  {selectedDonation.statusHistory.map((step) => (
                    <div key={step.id} className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface" />
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground">{step.previousStatus} &rarr; {step.newStatus}</span>
                        <span className="font-mono text-[10px] text-muted-light"><ClientDateTime date={step.changedAt} /></span>
                      </div>
                      {step.reason && (
                        <p className="text-[11px] text-muted-text mt-0.5">{step.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer close button */}
            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedDonation(null)}
                className="btn-secondary text-xs px-5 py-2 font-bold"
              >
                Close Rescue View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
