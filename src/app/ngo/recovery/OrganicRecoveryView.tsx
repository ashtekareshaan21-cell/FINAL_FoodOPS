'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { dispatchOrganicRecovery, confirmFacilityArrival, seedDemoExpiredDonations } from '@/app/actions/organicRecovery';
import { dynamicImpactEngine } from '@/services/dynamicImpactEngine';
import { IS_DEMO_MODE } from '@/lib/siteConfig';

export interface OrganicFacilityItem {
  id: string;
  name: string;
  facilityType: string;
  operatorName: string;
  address: string;
  city: string;
  contactPhone: string;
  dailyCapacityKg: number;
  currentLoadKg: number;
  acceptedWasteTypes: string;
  processingMethod: string;
  outputProduct: string;
}

export interface OrganicMissionItem {
  id: string;
  donationId: string;
  status: string;
  foodWeightKg: number;
  wasteCategory: string;
  vehicleType: string | null;
  assignedVolunteerName: string | null;
  gateEntryOtp: string | null;
  cleanEnergyKwh: number | null;
  biogasM3: number | null;
  bioFertilizerKg: number | null;
  landfillMethaneAvoidedKg: number | null;
  divertReason: string | null;
  createdAt: Date | string;
  facility: {
    id: string;
    name: string;
    city: string;
    processingMethod: string;
    outputProduct: string;
  };
  donation: {
    title: string;
    quantity: string;
    quantityUnit: string;
    donor: {
      organizationName: string;
      address: string;
    };
  };
}

export interface CandidateDonationItem {
  id: string;
  title: string;
  description?: string | null;
  foodCategory?: string | null;
  vegNonVegMixed?: string | null;
  quantity: string;
  quantityUnit: string;
  status: string;
  cancelReason: string | null;
  pickupDeadlineAt: Date | string;
  donor: {
    organizationName: string;
    address: string;
  };
}

interface OrganicRecoveryViewProps {
  facilities: OrganicFacilityItem[];
  missions: OrganicMissionItem[];
  candidateDonations: CandidateDonationItem[];
  volunteers: { id: string; name: string; vehicleInfo?: string | null }[];
  metrics: {
    totalMissions: number;
    totalWasteKg: number;
    totalCleanEnergyKwh: number;
    totalBioFertilizerKg: number;
    totalMethaneAvoidedKg: number;
  };
}

export default function OrganicRecoveryView({
  facilities = [],
  missions = [],
  candidateDonations = [],
  volunteers = [],
  metrics = {
    totalMissions: 0,
    totalWasteKg: 0,
    totalCleanEnergyKwh: 0,
    totalBioFertilizerKg: 0,
    totalMethaneAvoidedKg: 0,
  },
}: OrganicRecoveryViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tab: 'MISSIONS' | 'CANDIDATES' | 'FACILITIES'
  const [activeTab, setActiveTab] = useState<'MISSIONS' | 'CANDIDATES' | 'FACILITIES'>('MISSIONS');

  // Dispatch Wizard Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState<string>('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilities?.[0]?.id || '');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('Cargo Auto (Sealed)');
  const [divertReason, setDivertReason] = useState<string>('SLA Expiry (Beyond Safe Consumption Window)');
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Weighbridge OTP Confirm Modal State
  const [verifyingMissionId, setVerifyingMissionId] = useState<string | null>(null);
  const [inputOtp, setInputOtp] = useState<string>('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Selected donation and facility details for dynamic calculation
  const safeCandidateDonations = candidateDonations || [];
  const safeFacilities = facilities || [];
  const chosenDonation = safeCandidateDonations.find((d) => d.id === selectedDonationId);
  const chosenFacility = safeFacilities.find((f) => f.id === selectedFacilityId);
  const parsedWeight = chosenDonation
    ? parseFloat(chosenDonation.quantity?.replace(/[^\d.]/g, '') || '25') || 25
    : 25;

  const recoveryCalc = dynamicImpactEngine.calculateRecoveryImpact({
    foodWeightKg: parsedWeight,
    facilityType: chosenFacility?.facilityType || 'BIOMETHANATION_PLANT',
    facilityName: chosenFacility?.name,
    title: chosenDonation?.title,
    description: chosenDonation?.description,
    wasteCategory: chosenDonation?.foodCategory,
    vegNonVeg: chosenDonation?.vegNonVegMixed,
    vehicleType,
  });

  const projectedEnergy = (recoveryCalc?.cleanEnergyKwh ?? 0).toFixed(1);
  const projectedBiogas = (recoveryCalc?.biogasM3 ?? 0).toFixed(1);
  const projectedFertilizer = (recoveryCalc?.bioFertilizerKg ?? 0).toFixed(1);
  const projectedMethane = (recoveryCalc?.landfillMethaneAvoidedKg ?? 0).toFixed(1);

  // Handle Dispatch Submit
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonationId || !selectedFacilityId) {
      setDispatchError('Please select both a food listing and a recovery facility.');
      return;
    }
    setDispatchError(null);

    startTransition(async () => {
      const res = await dispatchOrganicRecovery({
        donationId: selectedDonationId,
        facilityId: selectedFacilityId,
        assignedVolunteerId: selectedVolunteerId || undefined,
        vehicleType,
        divertReason,
      });

      if (res.success) {
        setShowDispatchModal(false);
        setSelectedDonationId('');
        router.refresh();
      } else {
        setDispatchError(('error' in res && res.error) || 'Failed to dispatch organic recovery.');
      }
    });
  };

  // Handle Confirm Gate Arrival
  const handleConfirmArrival = async (missionId: string) => {
    setVerifyError(null);
    startTransition(async () => {
      const res = await confirmFacilityArrival(missionId, inputOtp || undefined);
      if (res.success) {
        setVerifyingMissionId(null);
        setInputOtp('');
        router.refresh();
      } else {
        setVerifyError(('error' in res && res.error) || 'Failed to verify arrival.');
      }
    });
  };

  // Handle Seed Demo Expired
  const handleSeedDemo = async () => {
    if (!IS_DEMO_MODE) return;
    startTransition(async () => {
      const res = await seedDemoExpiredDonations();
      if (res.success) {
        router.refresh();
        setActiveTab('CANDIDATES');
      } else {
        alert(res.error || 'Failed to seed demo expired food.');
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top ESG Ecological Impact Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Clean Energy Generated */}
        <div className="bg-gradient-to-br from-emerald-950 via-[#0b3c26] to-teal-900 border border-emerald-600/30 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Clean Energy Generated
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
              ⚡
            </span>
          </div>
          <p className="mt-2.5 text-2xl sm:text-3xl font-black text-white font-mono">
            {metrics.totalCleanEnergyKwh}{' '}
            <span className="text-xs font-sans text-emerald-300 font-semibold">kWh</span>
          </p>
          <span className="text-[11px] text-slate-300 mt-1 block">
            Generated via biomethanation power plants
          </span>
        </div>

        {/* Metric 2: Bio-Fertilizer Created */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
              Bio-Fertilizer & Compost
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
              🌱
            </span>
          </div>
          <p className="mt-2.5 text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {metrics.totalBioFertilizerKg}{' '}
            <span className="text-xs font-sans text-muted-text font-semibold">KG</span>
          </p>
          <span className="text-[11px] text-muted-text mt-1 block">
            Returned to regenerative local soil
          </span>
        </div>

        {/* Metric 3: Landfill Methane Prevented */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
              Methane Avoided (CO₂e)
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-sm">
              🛡️
            </span>
          </div>
          <p className="mt-2.5 text-2xl sm:text-3xl font-black text-blue-700 font-mono">
            {metrics.totalMethaneAvoidedKg}{' '}
            <span className="text-xs font-sans text-muted-text font-semibold">KG</span>
          </p>
          <span className="text-[11px] text-muted-text mt-1 block">
            Prevented from rotting in landfills
          </span>
        </div>

        {/* Metric 4: Total Biomass Diverted */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
              Total Organic Diverted
            </span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center font-bold text-sm">
              ♻️
            </span>
          </div>
          <p className="mt-2.5 text-2xl sm:text-3xl font-black text-foreground font-mono">
            {metrics.totalWasteKg}{' '}
            <span className="text-xs font-sans text-muted-text font-semibold">KG</span>
          </p>
          <span className="text-[11px] text-muted-text mt-1 block">
            Across {metrics.totalMissions} recovery missions
          </span>
        </div>
      </div>

      {/* Action Header Banner */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2">
            <span>♻️ Zero Landfill Waste Mandate</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-display">
            Organic Recovery & Biomethanation Hub
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-text max-w-2xl leading-relaxed">
            When surplus food exceeds safe human consumption windows or fails quality inspection,
            route it to certified Pune biomethanation, bio-CNG, or industrial composting facilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dispatch Button */}
          <button
            onClick={() => {
              setDispatchError(null);
              setShowDispatchModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover active:scale-95 font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all"
          >
            <span>♻️</span>
            <span>New Recovery Mission</span>
          </button>

          {/* Seed Demo Button (demo mode only) */}
          {IS_DEMO_MODE && (
            <button
              onClick={handleSeedDemo}
              disabled={isPending}
              className="px-3.5 py-2.5 rounded-xl bg-surface-muted hover:bg-slate-200 text-foreground font-bold text-xs border border-border flex items-center gap-1.5 transition-all"
            >
              <span>⚡ Seed Test Expired Food</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('MISSIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'MISSIONS'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface hover:bg-surface-muted text-muted-text'
          }`}
        >
          <span>🛰️ Active & Processed Missions</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
            {missions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CANDIDATES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'CANDIDATES'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface hover:bg-surface-muted text-muted-text'
          }`}
        >
          <span>📦 Pending Waste Candidates</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              candidateDonations.length > 0
                ? 'bg-amber-100 text-amber-900 font-bold'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {candidateDonations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('FACILITIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'FACILITIES'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface hover:bg-surface-muted text-muted-text'
          }`}
        >
          <span>🏭 Pune Facility Registry</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
            {facilities.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: RECOVERY MISSIONS BOARD                          */}
      {/* ======================================================== */}
      {activeTab === 'MISSIONS' && (
        <div className="space-y-4">
          {missions.length === 0 ? (
            <div className="text-center bg-surface border border-border rounded-2xl p-16 shadow-xs space-y-3">
              <span className="text-4xl block">🌱</span>
              <h3 className="text-base font-bold text-foreground">No organic recovery missions yet</h3>
              <p className="text-xs text-muted-text max-w-md mx-auto">
                No surplus food has been diverted to organic recovery facilities yet. When food expires
                or is diverted from the active rescues screen, dispatch it here.
              </p>
              {IS_DEMO_MODE && (
                <button
                  onClick={handleSeedDemo}
                  disabled={isPending}
                  className="btn-primary px-4 py-2 text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>⚡ Seed Expired Food to Test Flow</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className={`bg-surface border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                    mission.status === 'PROCESSED'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-amber-200 ring-1 ring-amber-100'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-foreground text-sm">
                            {mission.donation.title}
                          </h4>
                          <span
                            className={`badge-premium text-[9px] font-mono font-bold uppercase px-2 py-0.5 ${
                              mission.status === 'PROCESSED'
                                ? 'bg-success-bg text-success border border-success-border'
                                : 'bg-warning-bg text-warning border border-warning-border'
                            }`}
                          >
                            {mission.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-text mt-0.5">
                          From: {mission.donation.donor.organizationName} • {mission.foodWeightKg} KG
                        </p>
                      </div>

                      {/* Weight pill */}
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-surface-muted text-foreground border border-border">
                        {mission.foodWeightKg} KG
                      </span>
                    </div>

                    {/* Facility & Processing Card */}
                    <div className="bg-surface-muted/60 p-3 rounded-xl border border-border space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground truncate max-w-[240px]">
                          🏭 {mission.facility.name}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                          {mission.facility.city}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-text truncate">
                        Method: {mission.facility.processingMethod.replace(/_/g, ' ')}
                      </p>
                      {mission.assignedVolunteerName && (
                        <p className="text-[11px] text-foreground font-semibold flex items-center gap-1.5 pt-1 border-t border-border/60">
                          <span>🛵 Driver: {mission.assignedVolunteerName}</span>
                          <span className="text-muted-text">• {mission.vehicleType}</span>
                        </p>
                      )}
                    </div>

                    {/* Green Outputs Pill Row */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-emerald-50 border border-emerald-200/80 p-2 rounded-xl">
                        <span className="text-[9px] font-bold text-emerald-800 uppercase block">
                          Clean Energy
                        </span>
                        <span className="font-mono font-black text-emerald-900 text-xs">
                          {mission.cleanEnergyKwh} kWh
                        </span>
                      </div>
                      <div className="bg-teal-50 border border-teal-200/80 p-2 rounded-xl">
                        <span className="text-[9px] font-bold text-teal-800 uppercase block">
                          Bio-Fertilizer
                        </span>
                        <span className="font-mono font-black text-teal-900 text-xs">
                          {mission.bioFertilizerKg} KG
                        </span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200/80 p-2 rounded-xl">
                        <span className="text-[9px] font-bold text-blue-800 uppercase block">
                          Methane Avoided
                        </span>
                        <span className="font-mono font-black text-blue-900 text-xs">
                          {mission.landfillMethaneAvoidedKg} KG
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Gate Entry Verification */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-text text-[10px] uppercase font-bold">
                        Plant Gate Pass:
                      </span>
                      <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 tracking-wider">
                        {mission.gateEntryOtp || 'N/A'}
                      </span>
                    </div>

                    {mission.status !== 'PROCESSED' ? (
                      <button
                        onClick={() => {
                          setVerifyingMissionId(mission.id);
                          setInputOtp(mission.gateEntryOtp || '');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                      >
                        <span>✓ Confirm Weighbridge Acceptance</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <span>✓ Fully Digested & Converted</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PENDING WASTE CANDIDATES                          */}
      {/* ======================================================== */}
      {activeTab === 'CANDIDATES' && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <div>
              <h3 className="font-bold text-foreground text-sm">
                Expired & Diverted Food Ready for Organic Recovery ({candidateDonations.length})
              </h3>
              <p className="text-xs text-muted-text mt-0.5">
                Food that passed human consumption safety limits and must be converted into clean biogas/compost.
              </p>
            </div>
            {IS_DEMO_MODE && (
              <button
                onClick={handleSeedDemo}
                disabled={isPending}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                + Seed Expired Items
              </button>
            )}
          </div>

          {candidateDonations.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-text">
              No expired or rejected food listings pending organic recovery at this time.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {candidateDonations.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-surface-muted/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-foreground text-sm">
                        🍲 {item.title}
                      </span>
                      <span className="badge-premium bg-danger-bg text-danger border border-danger-border text-[9px] font-mono font-bold uppercase px-2 py-0.5">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-text">
                      Donor: <span className="font-semibold text-foreground">{item.donor.organizationName}</span> •{' '}
                      Quantity: <span className="font-semibold text-foreground">{item.quantity} {item.quantityUnit}</span>
                    </p>
                    <p className="text-[11px] text-danger font-medium italic">
                      Reason: {item.cancelReason || 'SLA Expiration & Spoilage Prevention'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDonationId(item.id);
                      setDispatchError(null);
                      setShowDispatchModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>♻️ Dispatch to Recovery Plant</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PUNE FACILITY REGISTRY                            */}
      {/* ======================================================== */}
      {activeTab === 'FACILITIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((fac) => {
            const loadPercent = Math.min(100, Math.round((fac.currentLoadKg / fac.dailyCapacityKg) * 100));

            return (
              <div
                key={fac.id}
                className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {fac.facilityType.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-sm font-extrabold text-foreground mt-1.5">
                        {fac.name}
                      </h4>
                      <p className="text-xs text-muted-text mt-0.5">{fac.operatorName}</p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-text space-y-1 bg-surface-muted/60 p-3 rounded-xl border border-border">
                    <p className="font-semibold text-foreground">📍 {fac.address}</p>
                    <p className="font-mono text-[11px]">📞 {fac.contactPhone}</p>
                    <p className="text-[11px] font-semibold text-emerald-800 pt-1 border-t border-border/60">
                      ⚡ Product: {fac.outputProduct.replace(/_/g, ' ')}
                    </p>
                  </div>

                  {/* Capacity Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-muted-text">Daily Capacity Utilization</span>
                      <span className="text-foreground font-mono">
                        {fac.currentLoadKg} / {fac.dailyCapacityKg} KG ({loadPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          loadPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${loadPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Accepted Waste Chips */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-text tracking-wider block mb-1">
                      Accepted Waste:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {fac.acceptedWasteTypes.split(',').map((type, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-semibold bg-surface-muted border border-border px-1.5 py-0.5 rounded text-slate-700"
                        >
                          {type.trim().replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedFacilityId(fac.id);
                    setShowDispatchModal(true);
                  }}
                  className="w-full py-2 rounded-xl bg-surface-muted hover:bg-slate-200 text-foreground font-bold text-xs border border-border flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Select for Dispatch</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: DISPATCH WIZARD MODAL                          */}
      {/* ======================================================== */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-xl w-full p-6 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>♻️</span> Dispatch Organic Waste to Recovery Plant
                </h3>
                <p className="text-xs text-muted-text mt-0.5">
                  Route spoiled or expired surplus food to biogas or composting facilities in Pune.
                </p>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {dispatchError && (
              <div className="mt-4 p-3 rounded-lg bg-danger-bg text-danger border border-danger-border text-xs font-semibold">
                {dispatchError}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit} className="mt-4 space-y-4">
              {/* Select Candidate Listing */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Select Expired / Rejected Food Listing *
                </label>
                {candidateDonations.length === 0 ? (
                  <div className="p-3 bg-surface-muted border border-border rounded-lg text-xs text-muted-text flex justify-between items-center">
                    <span>No pending expired listings found.</span>
                    {IS_DEMO_MODE && (
                      <button
                        type="button"
                        onClick={handleSeedDemo}
                        className="text-primary font-bold hover:underline"
                      >
                        + Seed Demo
                      </button>
                    )}
                  </div>
                ) : (
                  <select
                    required
                    value={selectedDonationId}
                    onChange={(e) => setSelectedDonationId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Choose food listing...</option>
                    {candidateDonations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.quantity} {d.quantityUnit}) - {d.donor.organizationName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select Recovery Facility */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Destination Recovery Plant *
                </label>
                <select
                  required
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.city}) - {fac.processingMethod.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver & Vehicle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Assigned Fleet Driver
                  </label>
                  <select
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Unassigned / Plant Logistics</option>
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.vehicleInfo || 'Vehicle'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="Cargo Auto (Sealed)">Cargo Auto (Sealed)</option>
                    <option value="Insulated Bio-Crate Van">Insulated Bio-Crate Van</option>
                    <option value="Municipal Waste Truck">Municipal Waste Truck</option>
                    <option value="Two-Wheeler Utility Cask">Two-Wheeler Utility Cask</option>
                  </select>
                </div>
              </div>

              {/* Divert Reason */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Reason for Organic Diversion
                </label>
                <input
                  type="text"
                  value={divertReason}
                  onChange={(e) => setDivertReason(e.target.value)}
                  placeholder="e.g. SLA Expiration, Spoilage, Visual Quality Rejection"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Real-time Ecological Calculations Preview */}
              <div className="bg-emerald-950 text-white p-4 rounded-xl border border-emerald-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Live Dynamic Kinetics ({parsedWeight} KG):
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-mono">
                    {recoveryCalc.metricsBreakdown.substrateCategory} • {recoveryCalc.metricsBreakdown.moisturePercent}% Moisture
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-300 block">Clean Energy</span>
                    <span className="font-mono font-black text-emerald-300 text-sm">{projectedEnergy}</span>
                    <span className="text-[9px] block text-slate-400">kWh</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-300 block">Biogas</span>
                    <span className="font-mono font-black text-emerald-300 text-sm">{projectedBiogas}</span>
                    <span className="text-[9px] block text-slate-400">m³</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-300 block">Organic Yield</span>
                    <span className="font-mono font-black text-emerald-300 text-sm">{projectedFertilizer}</span>
                    <span className="text-[9px] block text-slate-400">KG</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-300 block">Avoided Methane</span>
                    <span className="font-mono font-black text-emerald-300 text-sm">{projectedMethane}</span>
                    <span className="text-[9px] block text-slate-400">kg CO₂e</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-muted hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || candidateDonations.length === 0}
                  className="btn-primary px-5 py-2 text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? 'Dispatching...' : '🚀 Dispatch to Plant & Generate Gate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: WEIGHBRIDGE CONFIRMATION MODAL                 */}
      {/* ======================================================== */}
      {verifyingMissionId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-6 shadow-xl animate-fade-in">
            <h3 className="text-base font-bold text-foreground">
              Confirm Facility Weighbridge Delivery
            </h3>
            <p className="text-xs text-muted-text mt-1">
              Verify gate reception and start anaerobic conversion.
            </p>

            {verifyError && (
              <div className="mt-3 p-2.5 rounded-lg bg-danger-bg text-danger border border-danger-border text-xs font-semibold">
                {verifyError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Gate Entry Pass Code (OTP)
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold tracking-widest text-center bg-surface-muted border border-border rounded-lg text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingMissionId(null)}
                  className="px-3 py-1.5 rounded-lg bg-surface-muted text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleConfirmArrival(verifyingMissionId)}
                  className="btn-primary px-4 py-1.5 text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {isPending ? 'Verifying...' : 'Confirm Digestion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
