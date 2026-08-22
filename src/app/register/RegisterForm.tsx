'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerDonor, registerNGO, registerVolunteer } from '@/app/actions/auth';
import Link from 'next/link';
import LocationPicker, { SelectedLocation } from '@/components/Maps/LocationPicker';
import MapPreview from '@/components/Maps/MapPreview';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';

interface RegisterFormProps {
  ngos: Array<{ id: string; organizationName: string }>;
}

export default function RegisterForm({ ngos }: RegisterFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  const itemVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' as const },
    },
  };

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

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phoneNumber || !password) {
      setError('Please fill in all setup credentials.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleRoleSelect = (selectedRole: 'DONOR' | 'NGO' | 'VOLUNTEER') => {
    setRole(selectedRole);
    setStep(3);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate location for Donor and NGO
    if (role === 'DONOR' && (donorLat === null || donorLng === null || !donorAddress)) {
      setError('Please select and confirm your organization address on the map.');
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
    try {
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
    } catch (err) {
      console.error(err);
      setError('A connection error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Onboarding Steps Indicators */}
      <div className="flex items-center justify-between mb-8 max-w-xs mx-auto text-[10px] font-bold uppercase tracking-widest text-muted-light">
        <span className={`pb-1.5 border-b-2 transition-colors duration-300 ${step >= 1 ? 'border-primary text-primary font-black' : 'border-transparent'}`}>Account</span>
        <span className="text-border">──</span>
        <span className={`pb-1.5 border-b-2 transition-colors duration-300 ${step >= 2 ? 'border-primary text-primary font-black' : 'border-transparent'}`}>Role</span>
        <span className="text-border">──</span>
        <span className={`pb-1.5 border-b-2 transition-colors duration-300 ${step === 3 ? 'border-primary text-primary font-black' : 'border-transparent'}`}>Details</span>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="p-4 rounded-sm bg-danger-bg border border-danger-border text-danger text-xs font-semibold"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* STEP 1: Account Credentials */}
        {step === 1 && (
          <motion.form 
            key="step1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -yOffset }}
            onSubmit={handleStep1Submit} 
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div variants={itemVariants}>
                <label className="label-premium">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="input-premium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@domain.com"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="label-premium">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  className="input-premium"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <label className="label-premium">
                Create Password
              </label>
              <input
                type="password"
                required
                className="input-premium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 characters)"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                className="btn-primary w-full py-3.5 shadow-md shadow-primary/10"
              >
                Continue to Role Selection &rarr;
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center text-sm text-muted-text">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </Link>
            </motion.div>
          </motion.form>
        )}

        {/* STEP 2: Role Selection Card Grid */}
        {step === 2 && (
          <motion.div 
            key="step2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -yOffset }}
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center mb-4">
              <h3 className="text-lg font-bold text-foreground">Select Platform Role</h3>
              <p className="text-xs text-muted-text mt-1">Select the operational profile that describes your rescue purpose.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Donor */}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() => handleRoleSelect('DONOR')}
                whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                className="card-premium p-6 text-left hover:border-primary/50 transition-colors flex flex-col justify-between min-h-[160px] cursor-pointer group"
              >
                <div className="text-2xl group-hover:scale-105 transition-transform duration-300">🏨</div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mt-3">Surplus Donor</h4>
                  <p className="text-[11px] text-muted-text mt-1 leading-relaxed font-medium">
                    Share surplus food with nearby verified organizations.
                  </p>
                </div>
              </motion.button>

              {/* NGO */}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() => handleRoleSelect('NGO')}
                whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                className="card-premium p-6 text-left hover:border-primary/50 transition-colors flex flex-col justify-between min-h-[160px] cursor-pointer group"
              >
                <div className="text-2xl group-hover:scale-105 transition-transform duration-300">🌍</div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mt-3">Verified NGO</h4>
                  <p className="text-[11px] text-muted-text mt-1 leading-relaxed font-medium">
                    Discover, verify, and rescue available surplus food.
                  </p>
                </div>
              </motion.button>

              {/* Volunteer */}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() => handleRoleSelect('VOLUNTEER')}
                whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                className="card-premium p-6 text-left hover:border-primary/50 transition-colors flex flex-col justify-between min-h-[160px] cursor-pointer group"
              >
                <div className="text-2xl group-hover:scale-105 transition-transform duration-300">🚴</div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mt-3">Rescue Rider</h4>
                  <p className="text-[11px] text-muted-text mt-1 leading-relaxed font-medium">
                    Coordinate pickups and delivery transit.
                  </p>
                </div>
              </motion.button>
            </div>

            <motion.button
              variants={itemVariants}
              type="button"
              onClick={() => setStep(1)}
              whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
              className="btn-secondary w-full py-3.5"
            >
              &larr; Back to Account Details
            </motion.button>
          </motion.div>
        )}

        {/* STEP 3: Profile Configuration Details */}
        {step === 3 && (
          <motion.form 
            key="step3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -yOffset }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center mb-2">
              <span className="badge-premium bg-primary/5 text-primary border border-primary/10 uppercase">
                Role Profile: {role}
              </span>
            </motion.div>

            {/* DONOR Form */}
            {role === 'DONOR' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div variants={itemVariants}>
                    <label className="label-premium">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      required
                      className="input-premium"
                      value={donorOrgName}
                      onChange={(e) => setDonorOrgName(e.target.value)}
                      placeholder="e.g. Grand Banquet Hall"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <label className="label-premium">
                      Organization Type
                    </label>
                    <select
                      className="input-premium"
                      value={donorOrgType}
                      onChange={(e) => setDonorOrgType(e.target.value)}
                    >
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="HOTEL">Hotel</option>
                      <option value="CATERER">Caterer</option>
                      <option value="CORPORATE_CANTEEN">Corporate Canteen</option>
                      <option value="INDIVIDUAL">Individual</option>
                    </select>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants}>
                  <label className="label-premium">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input-premium"
                    value={donorContactPerson}
                    onChange={(e) => setDonorContactPerson(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                  />
                </motion.div>

                {/* Location Picker Map */}
                <motion.div variants={itemVariants} className="bg-surface-muted p-4 rounded-md border border-border space-y-4">
                  <span className="text-xs font-bold text-foreground block">Organization Location</span>
                  {donorAddress && donorLat !== null && donorLng !== null ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground break-words">{donorAddress}</p>
                          <p className="text-[11px] text-muted-light font-mono mt-0.5">{donorLat.toFixed(6)}, {donorLng.toFixed(6)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openLocationPicker('DONOR')}
                          className="flex-shrink-0 text-xs text-primary hover:underline font-semibold"
                        >
                          Change
                        </button>
                      </div>
                      <MapPreview latitude={donorLat} longitude={donorLng} address={donorAddress} height="150px" />
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openLocationPicker('DONOR')}
                      className="w-full py-4 px-4 border-2 border-dashed border-border hover:border-primary/45 rounded-md text-xs font-semibold text-muted-text hover:text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer bg-surface"
                    >
                      📍 Select Organization Location
                    </button>
                  )}
                </motion.div>
              </div>
            )}

            {/* NGO Form */}
            {role === 'NGO' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div variants={itemVariants}>
                    <label className="label-premium">
                      NGO Name
                    </label>
                    <input
                      type="text"
                      required
                      className="input-premium"
                      value={ngoOrgName}
                      onChange={(e) => setNgoOrgName(e.target.value)}
                      placeholder="e.g. Save Food Foundation"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <label className="label-premium">
                      FSSAI License / Registration
                    </label>
                    <input
                      type="text"
                      className="input-premium"
                      value={ngoRegNum}
                      onChange={(e) => setNgoRegNum(e.target.value)}
                      placeholder="e.g. FSSAI-29623000000001"
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div variants={itemVariants}>
                    <label className="label-premium">
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      required
                      className="input-premium"
                      value={ngoContactPerson}
                      onChange={(e) => setNgoContactPerson(e.target.value)}
                      placeholder="e.g. Preeti Nair"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <label className="label-premium">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      className="input-premium"
                      value={ngoContactPhone}
                      onChange={(e) => setNgoContactPhone(e.target.value)}
                      placeholder="e.g. +91 9876543221"
                    />
                  </motion.div>
                </div>

                {/* NGO Base Location Picker */}
                <motion.div variants={itemVariants} className="bg-surface-muted p-4 rounded-md border border-border space-y-4">
                  <div>
                    <span className="text-xs font-bold text-foreground block">NGO Base Address</span>
                    <span className="text-[10px] text-muted-text mt-0.5 block">Surplus matches are calculated relative to this coordinates baseline.</span>
                  </div>
                  {ngoAddress && ngoLat !== null && ngoLng !== null ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground break-words">{ngoAddress}</p>
                          <p className="text-[11px] text-muted-light font-mono mt-0.5">{ngoLat.toFixed(6)}, {ngoLng.toFixed(6)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openLocationPicker('NGO')}
                          className="flex-shrink-0 text-xs text-primary hover:underline font-semibold"
                        >
                          Change
                        </button>
                      </div>
                      <MapPreview latitude={ngoLat} longitude={ngoLng} address={ngoAddress} height="150px" />
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openLocationPicker('NGO')}
                      className="w-full py-4 px-4 border-2 border-dashed border-border hover:border-primary/45 rounded-md text-xs font-semibold text-muted-text hover:text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer bg-surface"
                    >
                      📍 Select Operational Address
                    </button>
                  )}
                </motion.div>

                {ngoAddress && ngoLat !== null && ngoLng !== null && (
                  <motion.div 
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-4 border-t border-border overflow-hidden"
                  >
                    {/* Service Radius */}
                    <motion.div variants={itemVariants}>
                      <label className="label-premium">
                        Rescue Coverage Radius
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {['2', '5', '10', '15', '20', '25'].map((r) => {
                          const selected = ngoRadius === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setNgoRadius(r)}
                              className={`py-2 px-3 text-center text-xs sm:text-sm font-semibold rounded-sm border transition-all cursor-pointer ${
                                selected
                                  ? 'bg-primary border-transparent text-primary-foreground shadow-sm'
                                  : 'bg-surface border-border text-foreground hover:bg-surface-muted'
                              }`}
                            >
                              {r} km
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>

                    {/* Availability */}
                    <motion.div variants={itemVariants}>
                      <label className="label-premium">
                        Rescue Availability State
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { id: 'AVAILABLE', label: '🟢 Active' },
                            { id: 'BUSY', label: '🟡 Busy' },
                            { id: 'OFFLINE', label: '🔴 Offline' },
                          ] as const
                        ).map((status) => {
                          const selected = ngoAvailability === status.id;
                          return (
                            <button
                              key={status.id}
                              type="button"
                              onClick={() => setNgoAvailability(status.id)}
                              className={`py-2.5 px-3 text-center text-xs sm:text-sm font-semibold rounded-sm border transition-all cursor-pointer ${
                                selected
                                  ? 'bg-success-bg border-success-border text-success font-bold'
                                  : 'bg-surface border-border text-foreground hover:bg-surface-muted'
                              }`}
                            >
                              {status.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>

                    {/* Food types checklist */}
                    <motion.div variants={itemVariants}>
                      <label className="label-premium">
                        Accepted Food Categories
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                                    setNgoAcceptedFoodTypes(ngoAcceptedFoodTypes.filter((t) => t !== type.id));
                                  } else {
                                    setNgoAcceptedFoodTypes([...ngoAcceptedFoodTypes, type.id]);
                                  }
                                }}
                              />
                              <span className="text-xs font-semibold">{type.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            )}

            {/* VOLUNTEER Form */}
            {role === 'VOLUNTEER' && (
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <label className="label-premium">
                    Rider Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input-premium"
                    value={volName}
                    onChange={(e) => setVolName(e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="label-premium">
                    Affiliated NGO Organization
                  </label>
                  {ngos.length > 0 ? (
                    <select
                      required
                      className="input-premium"
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
                    <div className="p-4 rounded-md bg-danger-bg border border-danger-border text-danger text-xs font-semibold">
                      No NGOs are currently registered on FoodOps. An NGO must be onboarded first before volunteers can link.
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* Bottom actions */}
            <motion.div variants={itemVariants} className="flex gap-4 pt-4 border-t border-border">
              <motion.button
                type="button"
                onClick={() => setStep(2)}
                whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                className="btn-secondary flex-1 py-3"
              >
                &larr; Back
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || (role === 'VOLUNTEER' && ngos.length === 0)}
                whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                className="btn-primary flex-grow py-3 shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Completing Setup...' : 'Complete Registration'}
              </motion.button>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Location Picker Overlay Map Modal */}
      {showLocationPicker && (
        <LocationPicker
          title={locationPickerTarget === 'DONOR' ? 'Select Organization Address' : 'Select NGO Base Address'}
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
