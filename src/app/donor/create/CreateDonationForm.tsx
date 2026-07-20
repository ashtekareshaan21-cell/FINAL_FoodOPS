'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDonation } from '@/app/actions/donations';
import LocationPicker, { SelectedLocation } from '@/components/Maps/LocationPicker';
import MapPreview from '@/components/Maps/MapPreview';

export default function CreateDonationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [foodCategory, setFoodCategory] = useState('mixed');
  const [vegNonVegMixed, setVegNonVegMixed] = useState('VEG');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('KG');
  const [estimatedServings, setEstimatedServings] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  
  // Available now
  const now = new Date();
  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };
  const [pickupAvailableAt, setPickupAvailableAt] = useState(formatDateTime(now));
  
  // Deadline defaults to 4 hours from now
  const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const [pickupDeadlineAt, setPickupDeadlineAt] = useState(formatDateTime(fourHoursLater));

  // Location state — managed via LocationPicker
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLatitude, setPickupLatitude] = useState<number | null>(null);
  const [pickupLongitude, setPickupLongitude] = useState<number | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [specialNotes, setSpecialNotes] = useState('');

  const handleLocationSelected = (location: SelectedLocation) => {
    setPickupAddress(location.address);
    setPickupLatitude(location.latitude);
    setPickupLongitude(location.longitude);
    setShowLocationPicker(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate location
    if (!pickupAddress || pickupLatitude === null || pickupLongitude === null) {
      setError('Please select a pickup location before submitting.');
      setLoading(false);
      return;
    }

    const res = await createDonation({
      title,
      description,
      foodCategory,
      vegNonVegMixed,
      quantity,
      quantityUnit,
      estimatedServings,
      preparationTime,
      pickupAvailableAt,
      pickupDeadlineAt,
      pickupAddress,
      pickupLatitude: String(pickupLatitude),
      pickupLongitude: String(pickupLongitude),
      specialNotes,
    });

    setLoading(false);

    if (res.success) {
      router.push('/donor');
      router.refresh();
    } else {
      setError(res.error || 'Failed to create donation.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Donation Title
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 50 Servings of Veg Biryani"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Food Details & Description
          </label>
          <textarea
            required
            rows={3}
            className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe items, list ingredients or allergens (e.g. prepared for wedding, kept refrigerated)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Food Category
            </label>
            <select
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={foodCategory}
              onChange={(e) => setFoodCategory(e.target.value)}
            >
              <option value="mixed">Mixed/Prepared Meals (Biryani, Curry)</option>
              <option value="grains">Grains/Rice (Dry food)</option>
              <option value="vegetables">Vegetables/Salad</option>
              <option value="fruits">Fruits</option>
              <option value="dairy">Dairy Products</option>
              <option value="meat">Meat/Protein</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Dietary Info
            </label>
            <select
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={vegNonVegMixed}
              onChange={(e) => setVegNonVegMixed(e.target.value)}
            >
              <option value="VEG">Vegetarian Only</option>
              <option value="NON_VEG">Non-Vegetarian</option>
              <option value="MIXED">Mixed items (separate packages)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Quantity
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 15"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Unit
            </label>
            <select
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={quantityUnit}
              onChange={(e) => setQuantityUnit(e.target.value)}
            >
              <option value="KG">Kilograms (kg)</option>
              <option value="LITERS">Liters (L)</option>
              <option value="SERVINGS">Servings</option>
              <option value="BOXES">Boxes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Est. Servings (people)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={estimatedServings}
              onChange={(e) => setEstimatedServings(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Food Prepared At
            </label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Available For Pickup
            </label>
            <input
              type="datetime-local"
              required
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={pickupAvailableAt}
              onChange={(e) => setPickupAvailableAt(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Pickup Deadline (expiry)
            </label>
            <input
              type="datetime-local"
              required
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={pickupDeadlineAt}
              onChange={(e) => setPickupDeadlineAt(e.target.value)}
            />
          </div>
        </div>

        {/* Location Selection — Google Maps based */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Pickup Location
            </span>
          </div>

          {pickupAddress && pickupLatitude !== null && pickupLongitude !== null ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
                    {pickupAddress}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {pickupLatitude.toFixed(6)}, {pickupLongitude.toFixed(6)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="flex-shrink-0 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors"
                >
                  Change
                </button>
              </div>
              <MapPreview
                latitude={pickupLatitude}
                longitude={pickupLongitude}
                address={pickupAddress}
                height="160px"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              className="w-full py-3 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Select Pickup Location
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Special Notes & Instructions
          </label>
          <textarea
            rows={2}
            className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="e.g. Park at the back loading dock, call Rahul on arrival"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/donor')}
            className="flex-1 py-3 px-4 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-grow py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating request...' : 'Publish Donation'}
          </button>
        </div>
      </form>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          title="Select Pickup Location"
          initialAddress={pickupAddress || undefined}
          initialLatitude={pickupLatitude ?? undefined}
          initialLongitude={pickupLongitude ?? undefined}
          onLocationSelected={handleLocationSelected}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}
    </>
  );
}
