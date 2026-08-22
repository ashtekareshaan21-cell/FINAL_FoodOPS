'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationPicker, { SelectedLocation } from '@/components/Maps/LocationPicker';
import MapPreview from '@/components/Maps/MapPreview';
import { updateNgoSettings } from '@/app/actions/donations';
import { NgoAvailability } from '@prisma/client';

interface NgoProfile {
  id: string;
  organizationName: string;
  registrationNumber: string;
  baseAddress: string;
  baseLatitude: number;
  baseLongitude: number;
  serviceRadiusKm: number;
  availability: NgoAvailability;
  availabilityUpdatedAt: Date | string;
  acceptedFoodTypes: string;
}

interface NgoSettingsProps {
  ngo: NgoProfile;
}

const PREDEFINED_RADIUSES = [2, 5, 10, 15, 20, 25];

const FOOD_CATEGORIES = [
  { id: 'COOKED_VEG', label: 'Cooked Vegetarian' },
  { id: 'COOKED_NON_VEG', label: 'Cooked Non-Vegetarian' },
  { id: 'PACKAGED_FOOD', label: 'Packaged Food' },
  { id: 'DRY_RATION', label: 'Dry Ration' },
  { id: 'BAKERY', label: 'Bakery Items' },
  { id: 'FRUITS_VEG', label: 'Fruits & Vegetables' },
];

export default function NgoSettings({ ngo }: NgoSettingsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [baseAddress, setBaseAddress] = useState(ngo.baseAddress);
  const [baseLat, setBaseLat] = useState(ngo.baseLatitude);
  const [baseLng, setBaseLng] = useState(ngo.baseLongitude);
  const [serviceRadius, setServiceRadius] = useState(ngo.serviceRadiusKm);
  const [availability, setAvailability] = useState(ngo.availability);
  const [acceptedFoodTypes, setAcceptedFoodTypes] = useState<string[]>(
    ngo.acceptedFoodTypes ? ngo.acceptedFoodTypes.split(',').map((t) => t.trim()) : []
  );

  // Location Picker modal inside edit modal
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleLocationSelected = (location: SelectedLocation) => {
    setBaseAddress(location.address);
    setBaseLat(location.latitude);
    setBaseLng(location.longitude);
    setShowMapPicker(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!baseAddress || baseLat === null || baseLng === null) {
      setError('Please select an operational address.');
      setLoading(false);
      return;
    }

    if (acceptedFoodTypes.length === 0) {
      setError('Please select at least one accepted food category.');
      setLoading(false);
      return;
    }

    const res = await updateNgoSettings({
      baseAddress,
      baseLatitude: baseLat,
      baseLongitude: baseLng,
      serviceRadiusKm: serviceRadius,
      availability,
      acceptedFoodTypes,
    });

    setLoading(false);

    if (res.success) {
      setIsEditing(false);
      router.refresh();
    } else {
      setError(res.error || 'Failed to update settings.');
    }
  };

  const currentAcceptedLabels = FOOD_CATEGORIES.filter((c) =>
    acceptedFoodTypes.includes(c.id)
  ).map((c) => c.label);

  const formatTimestamp = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between space-y-6">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <h2 className="text-lg font-bold text-foreground">Operational Settings</h2>
          <button
            onClick={() => {
              setBaseAddress(ngo.baseAddress);
              setBaseLat(ngo.baseLatitude);
              setBaseLng(ngo.baseLongitude);
              setServiceRadius(ngo.serviceRadiusKm);
              setAvailability(ngo.availability);
              setAcceptedFoodTypes(
                ngo.acceptedFoodTypes ? ngo.acceptedFoodTypes.split(',').map((t) => t.trim()) : []
              );
              setIsEditing(true);
            }}
            className="btn-secondary text-[11px] font-bold px-3 py-1.5 hover:scale-[1.01]"
          >
            ✏️ Edit Settings
          </button>
        </div>

        {/* Display Status Info */}
        <div className="space-y-4 text-xs">
          {/* Availability Status */}
          <div>
            <span className="font-bold text-muted uppercase tracking-wider block text-[10px] mb-1">
              Rescue Availability
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full font-semibold border ${
                  ngo.availability === 'AVAILABLE'
                    ? 'bg-success-bg border-success-border text-success'
                    : ngo.availability === 'BUSY'
                    ? 'bg-warning-bg border-warning-border text-warning'
                    : 'bg-danger-bg border-danger-border text-danger'
                }`}
              >
                {ngo.availability === 'AVAILABLE'
                  ? '🟢 Available'
                  : ngo.availability === 'BUSY'
                  ? '🟡 Busy'
                  : '🔴 Offline'}
              </span>
              <span className="text-[10px] text-muted-light font-mono">
                Last updated: {formatTimestamp(ngo.availabilityUpdatedAt)}
              </span>
            </div>
          </div>

          {/* Operational Address */}
          <div>
            <span className="font-bold text-muted uppercase tracking-wider block text-[10px] mb-1">
              Operational Address
            </span>
            <p className="font-medium text-foreground break-words">
              {ngo.baseAddress}
            </p>
            <p className="text-[10px] text-muted-light font-mono mt-0.5">
              Coordinates: {ngo.baseLatitude.toFixed(6)}, {ngo.baseLongitude.toFixed(6)}
            </p>
          </div>

          {/* Service Radius */}
          <div>
            <span className="font-bold text-muted uppercase tracking-wider block text-[10px] mb-1">
              Active Service Radius
            </span>
            <p className="font-medium text-foreground">
              {ngo.serviceRadiusKm} km
            </p>
          </div>

          {/* Accepted Categories */}
          <div>
            <span className="font-bold text-muted uppercase tracking-wider block text-[10px] mb-1">
              Accepted Food Categories
            </span>
            {currentAcceptedLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {currentAcceptedLabels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-semibold bg-surface-muted text-foreground border border-border"
                  >
                    {lbl}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-light italic">None selected</p>
            )}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface rounded-lg shadow-2xl w-full max-w-2xl border border-border overflow-hidden flex flex-col my-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-bold text-foreground">🛠️ Edit Operational Settings</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-muted hover:text-foreground transition-colors p-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {error && (
                <div className="p-3 rounded-sm bg-danger-bg border border-danger-border text-xs text-danger font-semibold">
                  {error}
                </div>
              )}

              {/* Operational Address Selector */}
              <div className="bg-surface-muted p-4 rounded-md border border-border space-y-3">
                <div>
                  <span className="text-xs font-bold text-foreground block">Operational Address</span>
                  <span className="text-[10px] text-muted-text mt-0.5 block">
                    Nearby food rescue requests will be calculated relative to this address coordinates baseline.
                  </span>
                </div>

                {baseAddress && baseLat !== null && baseLng !== null ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground break-words">
                          {baseAddress}
                        </p>
                        <p className="text-[10px] text-muted-light font-mono mt-0.5">
                          {baseLat.toFixed(6)}, {baseLng.toFixed(6)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="flex-shrink-0 text-xs text-primary font-bold hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <MapPreview latitude={baseLat} longitude={baseLng} address={baseAddress} height="120px" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="w-full py-3 px-4 border-2 border-dashed border-border rounded-md text-xs font-semibold text-muted hover:border-primary/45 hover:text-primary transition-colors flex items-center justify-center gap-2 bg-surface cursor-pointer"
                  >
                    Select Location
                  </button>
                )}
              </div>

              {/* Service Radius Predefined Buttons */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-2">
                  Active Service Radius (km)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PREDEFINED_RADIUSES.map((r) => {
                    const selected = serviceRadius === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setServiceRadius(r)}
                        className={`py-2 px-3 text-center text-xs font-semibold rounded-sm border transition-all cursor-pointer ${
                          selected
                            ? 'bg-primary border-transparent text-primary-foreground shadow-sm font-bold'
                            : 'bg-surface border-border text-foreground hover:bg-surface-muted'
                        }`}
                      >
                        {r} km
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability Status */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-2">
                  Rescue Availability Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'AVAILABLE', label: '🟢 Available' },
                      { id: 'BUSY', label: '🟡 Busy / At Capacity' },
                      { id: 'OFFLINE', label: '🔴 Offline' },
                    ] as const
                  ).map((status) => {
                    const selected = availability === status.id;
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setAvailability(status.id)}
                        className={`py-2.5 px-3 text-center text-xs sm:text-sm font-semibold rounded-sm border transition-all cursor-pointer ${
                          selected
                            ? status.id === 'AVAILABLE'
                              ? 'bg-success-bg border-success-border text-success font-bold'
                              : status.id === 'BUSY'
                              ? 'bg-warning-bg border-warning-border text-warning font-bold'
                              : 'bg-danger-bg border-danger-border text-danger font-bold'
                            : 'bg-surface border-border text-foreground hover:bg-surface-muted'
                        }`}
                      >
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accepted Food Categories */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-2">
                  Accepted Food Categories
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FOOD_CATEGORIES.map((type) => {
                    const checked = acceptedFoodTypes.includes(type.id);
                    return (
                      <label
                        key={type.id}
                        className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                          checked
                            ? 'bg-success-bg border-success-border text-success font-bold'
                            : 'bg-surface border-border text-foreground hover:bg-surface-muted'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary accent-primary"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setAcceptedFoodTypes(acceptedFoodTypes.filter((t) => t !== type.id));
                            } else {
                              setAcceptedFoodTypes([...acceptedFoodTypes, type.id]);
                            }
                          }}
                        />
                        <span className="text-xs font-semibold">{type.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-border flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="flex-1 btn-secondary py-3 hover:scale-[1.01]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-3 hover:scale-[1.01]"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Location Picker Map Modal */}
      {showMapPicker && (
        <LocationPicker
          title="Select Operational Address"
          initialAddress={baseAddress || undefined}
          initialLatitude={baseLat ?? undefined}
          initialLongitude={baseLng ?? undefined}
          onLocationSelected={handleLocationSelected}
          onCancel={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}
