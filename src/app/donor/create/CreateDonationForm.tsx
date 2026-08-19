'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDonation, analyzeListingAction } from '@/app/actions/donations';
import LocationPicker, { SelectedLocation } from '@/components/Maps/LocationPicker';
import MapPreview from '@/components/Maps/MapPreview';

export default function CreateDonationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Listing Audit States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous audit states
    setAuditId(null);
    setAuditResult(null);
    setAuditError(null);

    // Client-side size check (4MB)
    if (file.size > 4 * 1024 * 1024) {
      setAuditError('Image size exceeds 4MB limit.');
      return;
    }

    // Client-side MIME check
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAuditError('Only JPG, PNG, and WebP images are supported.');
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const base64Data = result.split(',')[1];
      setBase64Image(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!base64Image || !mimeType) {
      setAuditError('Please select a valid image first.');
      return;
    }

    setAnalyzing(true);
    setAuditError(null);
    setAuditResult(null);

    try {
      const res = await analyzeListingAction(base64Image, mimeType);
      if (res.success) {
        setAuditId(res.auditId);
        setAuditResult(res.audit);
      } else {
        setAuditError(res.error || 'AI analysis failed.');
      }
    } catch (err) {
      console.error(err);
      setAuditError('An unexpected error occurred during analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

    // Convert datetime-local values (which are local to browser) to proper UTC ISO strings
    const isoPreparationTime = preparationTime ? new Date(preparationTime).toISOString() : '';
    const isoPickupAvailableAt = new Date(pickupAvailableAt).toISOString();
    const isoPickupDeadlineAt = new Date(pickupDeadlineAt).toISOString();

    const res = await createDonation({
      title,
      description,
      foodCategory,
      vegNonVegMixed,
      quantity,
      quantityUnit,
      estimatedServings,
      preparationTime: isoPreparationTime,
      pickupAvailableAt: isoPickupAvailableAt,
      pickupDeadlineAt: isoPickupDeadlineAt,
      pickupAddress,
      pickupLatitude: String(pickupLatitude),
      pickupLongitude: String(pickupLongitude),
      specialNotes,
      auditId,
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

        {/* AI Listing Audit Section */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
          <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Food Photo (Optional AI Audit)
          </label>
          <div className="flex gap-4 items-start">
            <div className="flex-grow">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="block w-full text-xs text-zinc-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-xs file:font-semibold
                  file:bg-emerald-50 file:text-emerald-700
                  hover:file:bg-emerald-100
                  dark:file:bg-emerald-950/30 dark:file:text-emerald-400 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Supports JPG, PNG, WebP up to 4MB.</p>
            </div>
            {imagePreview && (
              <div className="relative w-16 h-16 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          
          {base64Image && !auditResult && !analyzing && (
            <button
              type="button"
              onClick={handleAnalyzeImage}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analyze Listing with AI
            </button>
          )}

          {analyzing && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing image with Gemini AI...
            </div>
          )}

          {auditError && (
            <div className="p-3 rounded bg-red-50 border border-red-100 text-xs text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 font-medium">
              {auditError}
            </div>
          )}

          {auditResult && (
            <div className="border border-emerald-500/25 bg-emerald-50/10 dark:border-emerald-500/20 dark:bg-emerald-950/5 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">AI Visual Listing Audit</h4>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono">Status: {auditResult.status}</span>
                </div>
              </div>

              {auditResult.status === 'COMPLETED' ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Category Suggestion */}
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase">Category Suggestion</p>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize mt-0.5">{auditResult.foodCategory}</p>
                      </div>
                      {foodCategory !== auditResult.foodCategory && (
                        <button
                          type="button"
                          onClick={() => setFoodCategory(auditResult.foodCategory)}
                          className="px-2 py-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50 cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                    </div>

                    {/* Servings Suggestion */}
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase">Servings Suggestion</p>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{auditResult.estimatedServings} servings</p>
                      </div>
                      {String(estimatedServings) !== String(auditResult.estimatedServings) && (
                        <button
                          type="button"
                          onClick={() => setEstimatedServings(String(auditResult.estimatedServings))}
                          className="px-2 py-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50 cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                    </div>

                    {/* Quantity Suggestion */}
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase">Quantity Suggestion</p>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{auditResult.estimatedQuantityKg} kg</p>
                      </div>
                      {(quantity !== String(auditResult.estimatedQuantityKg) || quantityUnit !== 'KG') && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuantity(String(auditResult.estimatedQuantityKg));
                            setQuantityUnit('KG');
                          }}
                          className="px-2 py-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50 cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                    </div>

                    {/* Packaging Observation */}
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 col-span-1 md:col-span-2">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Packaging style</p>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">{auditResult.packagingObservation || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Visual Observations list */}
                  {auditResult.visualObservations && auditResult.visualObservations.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">Visual Observations</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 dark:text-zinc-400">
                        {auditResult.visualObservations.map((obs: string, idx: number) => (
                          <li key={idx}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings list */}
                  {auditResult.warnings && auditResult.warnings.length > 0 && (
                    <div className="p-2.5 bg-yellow-50 border border-yellow-100 dark:bg-yellow-950/10 dark:border-yellow-900/20 rounded">
                      <p className="text-[11px] font-bold text-yellow-800 dark:text-yellow-400 mb-1.5 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Safety Warning Notice
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-yellow-700 dark:text-yellow-400">
                        {auditResult.warnings.map((warn: string, idx: number) => (
                          <li key={idx}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Visual-Analysis Confidence meter */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center text-zinc-500 font-medium mb-1">
                      <span>Visual Analysis Confidence</span>
                      <span>{auditResult.confidence}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${auditResult.confidence}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-0.5 italic leading-none">
                      This confidence score represents the visual characteristics analysis only. It does not reflect food-safety certification.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                  {auditResult.status === 'AI_UNAVAILABLE' 
                    ? 'AI listing audit is currently unavailable. Please proceed with manual donation details.'
                    : 'AI listing audit failed or returned invalid data. Please proceed with manual donation details.'}
                </div>
              )}
            </div>
          )}

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
              <option value="bakery">Bakery Items (Bread, Cakes, Pastries)</option>
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

        {/* Strict AI Safety Disclaimer */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-md text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">AI Safety Disclaimer:</span>
          AI estimates visual characteristics and quantity. It does not detect pathogens or certify food as safe for consumption. Food safety remains subject to donor declarations, handling practices, time limits, and applicable food-safety requirements.
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
