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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6">
      <div>
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Operational Settings</h2>
          <button
            onClick={() => {
              // Reset values to props before opening
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
            className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/50 transition-colors"
          >
            ✏️ Edit Settings
          </button>
        </div>

        {/* Display Status Info */}
        <div className="space-y-4 text-xs">
          {/* Availability Status */}
          <div>
            <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
              Rescue Availability
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full font-semibold border ${
                  ngo.availability === 'AVAILABLE'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/30'
                    : ngo.availability === 'BUSY'
                    ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-900/30'
                    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/25 dark:text-red-400 dark:border-red-900/30'
                }`}
              >
                {ngo.availability === 'AVAILABLE'
                  ? '🟢 Available'
                  : ngo.availability === 'BUSY'
                  ? '🟡 Busy'
                  : '🔴 Offline'}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                Last updated: {formatTimestamp(ngo.availabilityUpdatedAt)}
              </span>
            </div>
          </div>

          {/* Operational Address */}
          <div>
            <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
              Operational Address
            </span>
            <p className="font-medium text-zinc-800 dark:text-zinc-200 break-words">
              {ngo.baseAddress}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
              Coordinates: {ngo.baseLatitude.toFixed(6)}, {ngo.baseLongitude.toFixed(6)}
            </p>
          </div>

          {/* Service Radius */}
          <div>
            <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
              Active Service Radius
            </span>
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              {ngo.serviceRadiusKm} km
            </p>
          </div>

          {/* Accepted Categories */}
          <div>
            <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
              Accepted Food Categories
            </span>
            {currentAcceptedLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {currentAcceptedLabels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                  >
                    {lbl}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 italic">None selected</p>
            )}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">🛠️ Edit Operational Settings</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
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
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Operational Address Selector */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Operational Address</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                    This is where your NGO usually operates from. Nearby food rescue requests will be calculated from this location.
                  </span>
                </div>

                {baseAddress && baseLat !== null && baseLng !== null ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 break-words">
                          {baseAddress}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {baseLat.toFixed(6)}, {baseLng.toFixed(6)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="flex-shrink-0 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors"
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
                    className="w-full py-2.5 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
                  >
                    Select Location
                  </button>
                )}
              </div>

              {/* Service Radius Predefined Buttons */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
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
                        className={`py-2 px-3 text-center text-sm font-semibold rounded-lg border transition-all ${
                          selected
                            ? 'bg-emerald-600 border-transparent text-white shadow-sm'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {r} km
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability Enum selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Rescue Availability Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'AVAILABLE', label: '🟢 Available for Rescue' },
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
                        className={`py-2.5 px-3 text-center text-sm font-semibold rounded-lg border transition-all ${
                          selected
                            ? status.id === 'AVAILABLE'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400 font-bold'
                              : status.id === 'BUSY'
                              ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400 font-bold'
                              : 'bg-red-50 border-red-300 text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 font-bold'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
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
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Accepted Food Categories (Select at least one)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FOOD_CATEGORIES.map((type) => {
                    const checked = acceptedFoodTypes.includes(type.id);
                    return (
                      <label
                        key={type.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          checked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300 font-bold'
                            : 'bg-white border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-350 hover:bg-zinc-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setAcceptedFoodTypes(acceptedFoodTypes.filter((t) => t !== type.id));
                            } else {
                              setAcceptedFoodTypes([...acceptedFoodTypes, type.id]);
                            }
                          }}
                        />
                        <span className="text-sm">{type.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
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
