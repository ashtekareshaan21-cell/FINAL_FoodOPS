'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerDonor, registerNGO, registerVolunteer } from '@/app/actions/auth';
import Link from 'next/link';
import LocationPicker, { SelectedLocation } from '@/components/Maps/LocationPicker';
import MapPreview from '@/components/Maps/MapPreview';

interface RegisterFormProps {
  ngos: Array<{ id: string; organizationName: string }>;
}

export default function RegisterForm({ ngos }: RegisterFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<'DONOR' | 'NGO' | 'VOLUNTEER'>('DONOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Donor fields
  const [donorOrgName, setDonorOrgName] = useState('');
  const [donorOrgType, setDonorOrgType] = useState('RESTAURANT');
  const [donorContactPerson, setDonorContactPerson] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [donorLat, setDonorLat] = useState<number | null>(null);
  const [donorLng, setDonorLng] = useState<number | null>(null);

  // NGO fields
  const [ngoOrgName, setNgoOrgName] = useState('');
  const [ngoRegNum, setNgoRegNum] = useState('');
  const [ngoAddress, setNgoAddress] = useState('');
  const [ngoLat, setNgoLat] = useState<number | null>(null);
  const [ngoLng, setNgoLng] = useState<number | null>(null);
  const [ngoRadius, setNgoRadius] = useState('10');
  const [ngoContactPerson, setNgoContactPerson] = useState('');
  const [ngoContactPhone, setNgoContactPhone] = useState('');
  const [ngoAvailability, setNgoAvailability] = useState<'AVAILABLE' | 'BUSY' | 'OFFLINE'>('AVAILABLE');
  const [ngoAcceptedFoodTypes, setNgoAcceptedFoodTypes] = useState<string[]>([]);

  // Volunteer fields
  const [volName, setVolName] = useState('');
  const [volNgoId, setVolNgoId] = useState(ngos[0]?.id || '');

  // Location Picker modal state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationPickerTarget, setLocationPickerTarget] = useState<'DONOR' | 'NGO'>('DONOR');

  const openLocationPicker = (target: 'DONOR' | 'NGO') => {
    setLocationPickerTarget(target);
    setShowLocationPicker(true);
  };

  const handleLocationSelected = (location: SelectedLocation) => {
    if (locationPickerTarget === 'DONOR') {
      setDonorAddress(location.address);
      setDonorLat(location.latitude);
      setDonorLng(location.longitude);
    } else {
      setNgoAddress(location.address);
      setNgoLat(location.latitude);
      setNgoLng(location.longitude);
    }
    setShowLocationPicker(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate location for Donor and NGO
    if (role === 'DONOR' && (donorLat === null || donorLng === null || !donorAddress)) {
      setError('Please select your organization location on the map.');
      setLoading(false);
      return;
    }
    if (role === 'NGO') {
      if (ngoLat === null || ngoLng === null || !ngoAddress) {
        setError('Please select and confirm your NGO operational address on the map.');
        setLoading(false);
        return;
      }
      if (!ngoRadius) {
        setError('Please select a service radius.');
        setLoading(false);
        return;
      }
      if (ngoAcceptedFoodTypes.length === 0) {
        setError('Please select at least one accepted food category.');
        setLoading(false);
        return;
      }
    }

    const baseData = { email, password, phoneNumber };

    let res;
    if (role === 'DONOR') {
      res = await registerDonor({
        ...baseData,
        organizationName: donorOrgName,
        organizationType: donorOrgType,
        contactPerson: donorContactPerson,
        address: donorAddress,
        latitude: String(donorLat),
        longitude: String(donorLng),
      });
    } else if (role === 'NGO') {
      res = await registerNGO({
        ...baseData,
        organizationName: ngoOrgName,
        registrationNumber: ngoRegNum,
        baseAddress: ngoAddress,
        baseLatitude: String(ngoLat),
        baseLongitude: String(ngoLng),
        serviceRadiusKm: ngoRadius,
        availability: ngoAvailability,
        acceptedFoodTypes: ngoAcceptedFoodTypes,
        contactPerson: ngoContactPerson,
        contactPhone: ngoContactPhone,
      });
    } else {
      res = await registerVolunteer({
        ...baseData,
        name: volName,
        ngoId: volNgoId,
      });
    }

    setLoading(false);

    if (res.success) {
      if (role === 'DONOR') {
        router.push('/donor');
      } else if (role === 'NGO') {
        router.push('/ngo');
      } else {
        router.push('/volunteer');
      }
      router.refresh();
    } else {
      setError(res.error || 'An error occurred during registration.');
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-8">
        <button
          type="button"
          className={`flex-1 py-3 text-center font-medium border-b-2 text-sm transition-all duration-150 ${
            role === 'DONOR'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
          onClick={() => setRole('DONOR')}
        >
          Donor
        </button>
        <button
          type="button"
          className={`flex-1 py-3 text-center font-medium border-b-2 text-sm transition-all duration-150 ${
            role === 'NGO'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
          onClick={() => setRole('NGO')}
        >
          NGO
        </button>
        <button
          type="button"
          className={`flex-1 py-3 text-center font-medium border-b-2 text-sm transition-all duration-150 ${
            role === 'VOLUNTEER'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
          onClick={() => setRole('VOLUNTEER')}
        >
          Volunteer
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Credentials - Common to all roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@domain.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +91 9876543210"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* DONOR Form */}
        {role === 'DONOR' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                  value={donorOrgName}
                  onChange={(e) => setDonorOrgName(e.target.value)}
                  placeholder="e.g. Grand Banquet Hall"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Organization Type
                </label>
                <select
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                  value={donorOrgType}
                  onChange={(e) => setDonorOrgType(e.target.value)}
                >
                  <option value="RESTAURANT">Restaurant</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="CATERER">Caterer</option>
                  <option value="CORPORATE_CANTEEN">Corporate Canteen</option>
                  <option value="INDIVIDUAL">Individual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                value={donorContactPerson}
                onChange={(e) => setDonorContactPerson(e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            {/* Location Selection — Google Maps */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Organization Location</span>
              </div>

              {donorAddress && donorLat !== null && donorLng !== null ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
                        {donorAddress}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {donorLat.toFixed(6)}, {donorLng.toFixed(6)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLocationPicker('DONOR')}
                      className="flex-shrink-0 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors"
                    >
                      Change
                    </button>
                  </div>
                  <MapPreview latitude={donorLat} longitude={donorLng} address={donorAddress} height="140px" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openLocationPicker('DONOR')}
                  className="w-full py-3 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Select Organization Location
                </button>
              )}
            </div>
          </div>
        )}

        {/* NGO Form */}
        {role === 'NGO' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  NGO Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                  value={ngoOrgName}
                  onChange={(e) => setNgoOrgName(e.target.value)}
                  placeholder="e.g. Save Food India"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  FSSAI Registration / License Number
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                  value={ngoRegNum}
                  onChange={(e) => setNgoRegNum(e.target.value)}
                  placeholder="e.g. FSSAI-29623000000000 (Optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                  value={ngoContactPerson}
                  onChange={(e) => setNgoContactPerson(e.target.value)}
                  placeholder="e.g. Preeti Nair"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                  value={ngoContactPhone}
                  onChange={(e) => setNgoContactPhone(e.target.value)}
                  placeholder="e.g. 9876543222"
                />
              </div>
            </div>

            {/* Operational Address Selection */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Operational Address</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                  This is where your NGO usually operates from. Nearby food rescue requests will be calculated from this location.
                </span>
              </div>

              {ngoAddress && ngoLat !== null && ngoLng !== null ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
                        {ngoAddress}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {ngoLat.toFixed(6)}, {ngoLng.toFixed(6)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLocationPicker('NGO')}
                      className="flex-shrink-0 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors"
                    >
                      Change
                    </button>
                  </div>
                  <MapPreview latitude={ngoLat} longitude={ngoLng} address={ngoAddress} height="140px" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openLocationPicker('NGO')}
                  className="w-full py-3 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Select Operational Address
                </button>
              )}
            </div>

            {/* Conditional configurations panel — only shown after location is confirmed */}
            {ngoAddress && ngoLat !== null && ngoLng !== null && (
              <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-fadeIn">
                {/* Predefined radius buttons */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Active Service Radius (km)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['2', '5', '10', '15', '20', '25'].map((r) => {
                      const selected = ngoRadius === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setNgoRadius(r)}
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
                  <p className="text-[11px] text-zinc-400 mt-1">
                    You will receive surplus rescue requests within this radius from your operational address.
                  </p>
                </div>

                {/* Availability status selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Initial Rescue Availability Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'AVAILABLE', label: '🟢 Available for Rescue' },
                        { id: 'BUSY', label: '🟡 Busy / At Capacity' },
                        { id: 'OFFLINE', label: '🔴 Offline' },
                      ] as const
                    ).map((status) => {
                      const selected = ngoAvailability === status.id;
                      return (
                        <button
                          key={status.id}
                          type="button"
                          onClick={() => setNgoAvailability(status.id)}
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

                {/* Accepted Food Categories checkboxes */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Accepted Food Categories (Select at least one)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'COOKED_VEG', label: 'Cooked Vegetarian' },
                      { id: 'COOKED_NON_VEG', label: 'Cooked Non-Vegetarian' },
                      { id: 'PACKAGED_FOOD', label: 'Packaged Food' },
                      { id: 'DRY_RATION', label: 'Dry Ration' },
                      { id: 'BAKERY', label: 'Bakery Items' },
                      { id: 'FRUITS_VEG', label: 'Fruits & Vegetables' },
                    ].map((type) => {
                      const checked = ngoAcceptedFoodTypes.includes(type.id);
                      return (
                        <label
                          key={type.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            checked
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300 font-bold'
                              : 'bg-white border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 hover:bg-zinc-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setNgoAcceptedFoodTypes(ngoAcceptedFoodTypes.filter((t) => t !== type.id));
                              } else {
                                setNgoAcceptedFoodTypes([...ngoAcceptedFoodTypes, type.id]);
                              }
                            }}
                          />
                          <span className="text-sm">{type.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VOLUNTEER Form */}
        {role === 'VOLUNTEER' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Volunteer Full Name
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                value={volName}
                onChange={(e) => setVolName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Affiliated NGO
              </label>
              {ngos.length > 0 ? (
                <select
                  required
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm dark:text-zinc-100"
                  value={volNgoId}
                  onChange={(e) => setVolNgoId(e.target.value)}
                >
                  {ngos.map((ngo) => (
                    <option key={ngo.id} value={ngo.id}>
                      {ngo.organizationName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-md border border-red-200 dark:border-red-900/50">
                  No NGOs are currently registered. An NGO must register first before volunteers can join.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={loading || (role === 'VOLUNTEER' && ngos.length === 0)}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>

        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
            Sign In
          </Link>
        </div>
      </form>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          title={locationPickerTarget === 'DONOR' ? 'Select Organization Location' : 'Select NGO Base Location'}
          initialAddress={locationPickerTarget === 'DONOR' ? donorAddress || undefined : ngoAddress || undefined}
          initialLatitude={locationPickerTarget === 'DONOR' ? donorLat ?? undefined : ngoLat ?? undefined}
          initialLongitude={locationPickerTarget === 'DONOR' ? donorLng ?? undefined : ngoLng ?? undefined}
          onLocationSelected={handleLocationSelected}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}
