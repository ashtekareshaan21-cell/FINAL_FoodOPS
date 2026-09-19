'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createDonation, analyzeListingAction } from '@/app/actions/donations';
import LocationPicker, { SelectedLocation } from '@/components/Maps/LocationPicker';
import MapPreview from '@/components/Maps/MapPreview';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';

interface AuditResult {
  id: string;
  status: string;
  foodCategory?: string | null;
  estimatedServings?: number | null;
  estimatedQuantityKg?: number | null;
  packagingObservation?: string | null;
  visualObservations?: string[] | null;
  warnings?: string[] | null;
  confidence?: number | null;
}

interface OCRScanResult {
  text: string;
  detectedLabels: string[];
  confidence: number;
  source: 'ocr';
  status: string;
  error?: string;
}

interface CreateDonationFormProps {
  defaultLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  donorVerificationStatus?: string | null;
}

function AuditLoadingSequence() {
  const [step, setStep] = useState(0);
  const steps = [
    '🔍 Analyzing photo details...',
    '🏷️ Detecting packaging & visual features...',
    '⚖️ Estimating surplus serving scale...',
    '📋 Compiling visual safety findings...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 1300);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4 rounded-md border border-primary/20 bg-primary/5 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="transition-all duration-300">{steps[step]}</span>
      </div>
      <div className="w-full bg-border rounded-full h-1 overflow-hidden">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="bg-primary h-1 rounded-full w-1/3"
        />
      </div>
      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
        <strong>AI-Assisted Screening (Visual Parameters Only):</strong> This automated scan analyzes packaging and estimated volume. It does not detect pathogens or certify food safety. Human verification remains required.
      </p>
    </div>
  );
}

export default function CreateDonationForm({ defaultLocation, donorVerificationStatus }: CreateDonationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Listing Audit States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // OCR Extraction States
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRScanResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAuditId(null);
    setAuditResult(null);
    setAuditError(null);
    setOcrResult(null);
    setOcrError(null);

    if (file.size > 4 * 1024 * 1024) {
      setAuditError('Image size exceeds 4MB limit.');
      return;
    }

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

  const handleRunOcrScan = async () => {
    if (!base64Image || !mimeType) {
      setOcrError('Please select a valid image first.');
      return;
    }

    setOcrLoading(true);
    setOcrError(null);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image, mimeType }),
      });

      const data = await res.json();
      if (res.ok && (data.status === 'SUCCESS' || data.status === 'EMPTY_RESULT')) {
        setOcrResult(data);
        if (data.status === 'EMPTY_RESULT') {
          setOcrError('No visible text or labels found in this image.');
        } else {
          setOcrError(null);
        }
      } else {
        const rawErr = data.error || '';
        const cleanMsg = rawErr.includes('GoogleGenerativeAI') || rawErr.includes('Blocked') || rawErr.includes('403') || rawErr.includes('401')
          ? 'Cloud AI service is unavailable. Text details can be entered manually.'
          : (rawErr || 'OCR text extraction failed.');
        setOcrError(cleanMsg);
      }
    } catch (err) {
      console.error('OCR API error:', err);
      setOcrError('An unexpected error occurred during OCR scanning.');
    } finally {
      setOcrLoading(false);
    }
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
        setAuditId(res.auditId ?? null);
        setAuditResult((res.audit as unknown as AuditResult) ?? null);
      } else {
        const rawErr = res.error || '';
        const cleanMsg = rawErr.includes('GoogleGenerativeAI') || rawErr.includes('Blocked') || rawErr.includes('403') || rawErr.includes('401')
          ? 'AI listing audit is temporarily unavailable. You can enter details manually.'
          : (rawErr || 'AI analysis failed.');
        setAuditError(cleanMsg);
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
  
  const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const [pickupDeadlineAt, setPickupDeadlineAt] = useState(formatDateTime(fourHoursLater));

  const [useSavedLocation, setUseSavedLocation] = useState(!!defaultLocation);
  const [pickupAddress, setPickupAddress] = useState(defaultLocation?.address || '');
  const [pickupLatitude, setPickupLatitude] = useState<number | null>(defaultLocation?.latitude ?? null);
  const [pickupLongitude, setPickupLongitude] = useState<number | null>(defaultLocation?.longitude ?? null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [specialNotes, setSpecialNotes] = useState('');

  const handleToggleSavedLocation = (enable: boolean) => {
    setUseSavedLocation(enable);
    if (enable && defaultLocation) {
      setPickupAddress(defaultLocation.address);
      setPickupLatitude(defaultLocation.latitude);
      setPickupLongitude(defaultLocation.longitude);
      setError(null);
    } else {
      setPickupAddress('');
      setPickupLatitude(null);
      setPickupLongitude(null);
    }
  };

  const handleLocationSelected = (location: SelectedLocation) => {
    setPickupAddress(location.address);
    setPickupLatitude(location.latitude);
    setPickupLongitude(location.longitude);
    setUseSavedLocation(false);
    setShowLocationPicker(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (donorVerificationStatus && donorVerificationStatus !== 'VERIFIED') {
      setError('Account pending verification. You must be a verified donor to publish listings.');
      setLoading(false);
      return;
    }

    if (!pickupAddress || pickupLatitude === null || pickupLongitude === null) {
      setError('Please select a pickup location before submitting.');
      setLoading(false);
      return;
    }

    let isoPreparationTime = '';
    let isoPickupAvailableAt = '';
    let isoPickupDeadlineAt = '';

    try {
      if (preparationTime) {
        const prepDate = new Date(preparationTime);
        if (isNaN(prepDate.getTime())) {
          throw new Error('Please enter a valid food preparation date & time.');
        }
        isoPreparationTime = prepDate.toISOString();
      }

      if (!pickupAvailableAt) {
        throw new Error('Please select a pickup available date & time.');
      }
      const availDate = new Date(pickupAvailableAt);
      if (isNaN(availDate.getTime())) {
        throw new Error('Please enter a valid pickup available date & time.');
      }
      isoPickupAvailableAt = availDate.toISOString();

      if (!pickupDeadlineAt) {
        throw new Error('Please select a pickup deadline date & time.');
      }
      const deadlineDate = new Date(pickupDeadlineAt);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('Please enter a valid pickup deadline date & time.');
      }
      isoPickupDeadlineAt = deadlineDate.toISOString();

      if (deadlineDate.getTime() <= availDate.getTime()) {
        throw new Error('Pickup deadline must be after the pickup available time.');
      }
    } catch (dateErr) {
      setError(dateErr instanceof Error ? dateErr.message : 'Invalid date format selected.');
      setLoading(false);
      return;
    }

    try {
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

      if (res.success) {
        router.push('/donor');
        router.refresh();
      } else {
        setError(res.error || 'Failed to create donation.');
      }
    } catch (err) {
      console.error('Donation submit error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while creating listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <motion.div variants={itemVariants}>
          <label className="label-premium">
            Donation Title
          </label>
          <input
            type="text"
            required
            className="input-premium"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 50 Servings of Veg Biryani"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="label-premium">
            Food Details & Description
          </label>
          <textarea
            required
            rows={3}
            className="input-premium"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe items, list ingredients or allergens (e.g. prepared for wedding, kept refrigerated)"
          />
        </motion.div>

        {/* AI Listing Audit Section */}
        <motion.div variants={itemVariants} className="bg-surface-muted p-4 rounded-md border border-border space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
              Food Photo (Optional AI Audit)
            </label>
            <span className="badge-premium bg-primary/5 text-primary border border-primary/10 tracking-widest text-[9px] uppercase font-extrabold">
              Gemini AI
            </span>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-grow">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="block w-full text-xs text-muted-text
                  file:mr-4 file:py-2 file:px-3.5
                  file:rounded-sm file:border-0
                  file:text-xs file:font-semibold
                  file:bg-primary/5 file:text-primary
                  hover:file:bg-primary/10 cursor-pointer"
              />
              <p className="text-[10px] text-muted-light mt-1">Supports JPG, PNG, WebP up to 4MB.</p>
            </div>
            {imagePreview && (
              <div className="relative w-16 h-16 rounded-sm border border-border overflow-hidden flex-shrink-0 bg-surface">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            {base64Image && (
              <div className="flex flex-wrap gap-2.5 items-center">
                {!auditResult && !analyzing && (
                  <motion.button
                    key="btn-analyze"
                    type="button"
                    onClick={handleAnalyzeImage}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                    className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Analyze Listing with AI
                  </motion.button>
                )}

                {!ocrResult && !ocrLoading && (
                  <motion.button
                    key="btn-ocr"
                    type="button"
                    onClick={handleRunOcrScan}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                    className="px-3.5 py-2 text-xs font-bold rounded-sm border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Scan Packaging Text (OCR)
                  </motion.button>
                )}

                {ocrLoading && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary py-2 px-3 bg-primary/5 rounded border border-primary/20">
                    <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Extracting text from image...</span>
                  </div>
                )}
              </div>
            )}

            {analyzing && (
              <motion.div key="seq-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AuditLoadingSequence />
              </motion.div>
            )}
          </AnimatePresence>

          {ocrError && (
            <div className="p-3 rounded-sm bg-warning-bg border border-warning-border text-xs text-warning font-semibold">
              {ocrError}
            </div>
          )}

          <AnimatePresence>
            {ocrResult && (ocrResult.text || ocrResult.detectedLabels.length > 0) && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 rounded-md p-4 space-y-3"
              >
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">OCR Text Extraction Result</h4>
                  </div>
                  <span className="text-[10px] text-muted-light font-mono">Confidence: {ocrResult.confidence}%</span>
                </div>

                {ocrResult.text && (
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted mb-1 tracking-wider">Visible Extracted Text</p>
                    <p className="text-xs font-mono bg-surface p-2.5 rounded border border-border text-foreground leading-relaxed whitespace-pre-wrap">
                      {ocrResult.text}
                    </p>
                  </div>
                )}

                {ocrResult.detectedLabels.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted mb-1 tracking-wider">Detected Labels & Markings</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ocrResult.detectedLabels.map((label, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[10px] font-medium bg-surface border border-border text-foreground rounded">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {ocrResult.text && (
                    <button
                      type="button"
                      onClick={() => setDescription((prev) => (prev ? `${prev}\n\n[OCR Label Text]: ${ocrResult.text}` : `[OCR Label Text]: ${ocrResult.text}`))}
                      className="px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 rounded cursor-pointer"
                    >
                      + Add to Description
                    </button>
                  )}
                  {ocrResult.text && (
                    <button
                      type="button"
                      onClick={() => setSpecialNotes((prev) => (prev ? `${prev}\n[Packaging OCR]: ${ocrResult.text}` : `[Packaging OCR]: ${ocrResult.text}`))}
                      className="px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded cursor-pointer"
                    >
                      + Add to Special Notes
                    </button>
                  )}
                </div>

                <p className="text-[9px] text-muted-light italic border-t border-border pt-2 mt-2">
                  <strong>Notice:</strong> OCR only extracts visible text and labels from packaging/vessels. It does not certify food safety or freshness.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {auditError && (
            <div className="p-3 rounded-sm bg-danger-bg border border-danger-border text-xs text-danger font-semibold">
              {auditError}
            </div>
          )}

          <AnimatePresence>
            {auditResult && (
              <motion.div 
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-primary/20 bg-primary/5 rounded-md p-4 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Visual Listing Audit</h4>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-light font-mono">Status: {auditResult.status}</span>
                  </div>
                </div>

                {auditResult.status === 'COMPLETED' ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Category Suggestion */}
                      <div className="p-3 bg-surface rounded-sm border border-border flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Category Suggestion</p>
                          <p className="font-semibold text-foreground capitalize mt-0.5">{auditResult.foodCategory}</p>
                        </div>
                        {foodCategory !== (auditResult.foodCategory || 'mixed') && (
                          <button
                            type="button"
                            onClick={() => setFoodCategory(auditResult.foodCategory || 'mixed')}
                            className="px-2 py-0.5 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-sm cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </div>

                      {/* Servings Suggestion */}
                      <div className="p-3 bg-surface rounded-sm border border-border flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Servings Suggestion</p>
                          <p className="font-semibold text-foreground mt-0.5">{auditResult.estimatedServings} servings</p>
                        </div>
                        {String(estimatedServings) !== String(auditResult.estimatedServings ?? '') && (
                          <button
                            type="button"
                            onClick={() => setEstimatedServings(String(auditResult.estimatedServings ?? ''))}
                            className="px-2 py-0.5 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-sm cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </div>

                      {/* Quantity Suggestion */}
                      <div className="p-3 bg-surface rounded-sm border border-border flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Quantity Suggestion</p>
                          <p className="font-semibold text-foreground mt-0.5">{auditResult.estimatedQuantityKg} kg</p>
                        </div>
                        {(quantity !== String(auditResult.estimatedQuantityKg ?? '') || quantityUnit !== 'KG') && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuantity(String(auditResult.estimatedQuantityKg ?? ''));
                              setQuantityUnit('KG');
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-sm cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </div>

                      {/* Packaging Observation */}
                      <div className="p-3 bg-surface rounded-sm border border-border col-span-1 md:col-span-2 shadow-sm">
                        <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Packaging style</p>
                        <p className="text-foreground font-semibold mt-0.5">{auditResult.packagingObservation || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Visual Observations */}
                    {auditResult.visualObservations && auditResult.visualObservations.length > 0 && (
                      <div>
                        <p className="text-[9px] uppercase font-bold text-muted mb-1 tracking-wider">Visual Observations</p>
                        <ul className="list-disc pl-4 space-y-0.5 text-muted-text font-medium">
                          {auditResult.visualObservations.map((obs: string, idx: number) => (
                            <li key={idx}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {auditResult.warnings && auditResult.warnings.length > 0 && (
                      <div className="p-3 bg-warning-bg border border-warning-border rounded-md text-warning">
                        <p className="text-[10px] font-bold mb-1.5 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Safety Warning Notice
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-semibold">
                          {auditResult.warnings.map((warn: string, idx: number) => (
                            <li key={idx}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Confidence meter */}
                    <div className="pt-1">
                      <div className="flex justify-between items-center text-muted font-bold mb-1">
                        <span>Visual Analysis Confidence</span>
                        <span>{auditResult.confidence}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1 overflow-hidden">
                        <motion.div
                          className="bg-primary h-1 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${auditResult.confidence}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-light mt-1 italic leading-tight">
                        This confidence score represents the visual characteristics analysis only. It does not reflect food-safety certification.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 rounded text-amber-700 dark:text-amber-300 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      GEMINI_API_KEY Not Configured
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                      Your <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono text-[10px]">.env</code> is missing a valid <code className="font-bold font-mono">GEMINI_API_KEY</code>.
                      To enable live AI Listing Audits & OCR Scanning, get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google AI Studio</a>. You may also proceed with manual donation details.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-premium">
              Food Category
            </label>
            <select
              className="input-premium"
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
            <label className="label-premium">
              Dietary Info
            </label>
            <select
              className="input-premium"
              value={vegNonVegMixed}
              onChange={(e) => setVegNonVegMixed(e.target.value)}
            >
              <option value="VEG">Vegetarian Only</option>
              <option value="NON_VEG">Non-Vegetarian</option>
              <option value="MIXED">Mixed items (separate packages)</option>
            </select>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label-premium">
              Quantity
            </label>
            <input
              type="text"
              required
              className="input-premium"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 15"
            />
          </div>
          <div>
            <label className="label-premium">
              Unit
            </label>
            <select
              className="input-premium"
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
            <label className="label-premium">
              Est. Servings (people)
            </label>
            <input
              type="number"
              className="input-premium"
              value={estimatedServings}
              onChange={(e) => setEstimatedServings(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label-premium">
              Food Prepared At
            </label>
            <input
              type="datetime-local"
              className="input-premium"
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label-premium">
              Available For Pickup
            </label>
            <input
              type="datetime-local"
              required
              className="input-premium"
              value={pickupAvailableAt}
              onChange={(e) => setPickupAvailableAt(e.target.value)}
            />
          </div>
          <div>
            <label className="label-premium">
              Pickup Deadline (expiry)
            </label>
            <input
              type="datetime-local"
              required
              className="input-premium"
              value={pickupDeadlineAt}
              onChange={(e) => setPickupDeadlineAt(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Location Selection */}
        <motion.div variants={itemVariants} className="bg-surface-muted p-4 rounded-md border border-border space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Pickup Location
            </span>
            {defaultLocation && (
              <label className="flex items-center gap-2 text-xs font-semibold text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary accent-primary"
                  checked={useSavedLocation}
                  onChange={(e) => handleToggleSavedLocation(e.target.checked)}
                />
                Use Registered Address
              </label>
            )}
          </div>

          {useSavedLocation && defaultLocation ? (
            <div className="space-y-3">
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-md flex items-center gap-2 text-xs text-primary font-semibold">
                <span>📍</span> Using registered facility address
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground break-words">
                    {pickupAddress}
                  </p>
                  <p className="text-[11px] text-muted-light font-mono mt-0.5">
                    {pickupLatitude?.toFixed(6)}, {pickupLongitude?.toFixed(6)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSavedLocation(false)}
                  className="flex-shrink-0 text-xs text-primary font-bold hover:underline"
                >
                  Choose another
                </button>
              </div>
              <MapPreview
                latitude={pickupLatitude!}
                longitude={pickupLongitude!}
                address={pickupAddress}
                height="160px"
              />
            </div>
          ) : pickupAddress && pickupLatitude !== null && pickupLongitude !== null ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground break-words">
                    {pickupAddress}
                  </p>
                  <p className="text-[11px] text-muted-light font-mono mt-0.5">
                    {pickupLatitude.toFixed(6)}, {pickupLongitude.toFixed(6)}
                  </p>
                </div>
                <div className="flex gap-3">
                  {defaultLocation && (
                    <button
                      type="button"
                      onClick={() => handleToggleSavedLocation(true)}
                      className="text-xs text-muted hover:text-foreground font-semibold"
                    >
                      Reset to registered
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="flex-shrink-0 text-xs text-primary font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>
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
              className="w-full py-4 px-4 border-2 border-dashed border-border rounded-md text-xs font-semibold text-muted hover:border-primary/45 hover:text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer bg-surface"
            >
              <svg className="w-5 h-5 text-muted-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Select Pickup Location on Map
            </button>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="label-premium">
            Special Notes & Instructions
          </label>
          <textarea
            rows={2}
            className="input-premium"
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="e.g. Park at the back loading dock, call Rahul on arrival"
          />
        </motion.div>

        {/* Strict AI Safety Disclaimer Footnote */}
        <motion.div variants={itemVariants} className="p-3 bg-surface-muted border border-border rounded-md text-[10px] text-muted-text leading-relaxed">
          <span className="font-bold text-foreground block mb-0.5">AI Safety Disclaimer:</span>
          AI estimates visual characteristics and quantity. It does not detect pathogens or certify food as safe for consumption. Food safety remains subject to donor declarations, handling practices, time limits, and applicable food-safety requirements.
        </motion.div>

        {/* Verification Status Notice */}
        {donorVerificationStatus && donorVerificationStatus !== 'VERIFIED' && (
          <motion.div variants={itemVariants} className="p-4 rounded-md bg-warning-bg border border-warning-border text-warning text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>⏳</span> Account Verification Pending
            </div>
            <p className="font-medium leading-relaxed">
              Your donor profile is currently pending administrator verification. In compliance with operational safety standards, only verified donors can publish surplus food rescue listings.
            </p>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/donor')}
            className="btn-secondary flex-1 py-3 hover:scale-[1.01]"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={loading || (!!donorVerificationStatus && donorVerificationStatus !== 'VERIFIED')}
            whileHover={shouldReduceMotion || (!!donorVerificationStatus && donorVerificationStatus !== 'VERIFIED') ? {} : { scale: 1.01 }}
            whileTap={shouldReduceMotion || (!!donorVerificationStatus && donorVerificationStatus !== 'VERIFIED') ? {} : { scale: 0.99 }}
            className={`btn-primary flex-grow py-3 shadow-md shadow-primary/10 ${
              donorVerificationStatus && donorVerificationStatus !== 'VERIFIED' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating request...' : donorVerificationStatus && donorVerificationStatus !== 'VERIFIED' ? 'Verification Pending' : 'Publish Donation'}
          </motion.button>
        </motion.div>
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
    </motion.div>
  );
}
