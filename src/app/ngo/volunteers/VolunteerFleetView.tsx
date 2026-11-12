'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addNgoVolunteer, autoAllotTasks, seedDemoRescues } from '@/app/actions/ngo';
import { assignVolunteer } from '@/app/actions/donations';

export interface VolunteerFleetItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  vehicleInfo: string;
  operatingArea: string;
  status: string;
  verificationStatus: string;
  createdAt: Date | string;
  activeTasksCount: number;
  completedTasksCount: number;
  isBusy: boolean;
  currentTasks: {
    assignmentId: string;
    donationId: string;
    title: string;
    status: string;
    quantity: string;
    donorName: string;
    pickupAddress: string;
  }[];
}

interface VolunteerFleetViewProps {
  ngo: {
    id: string;
    organizationName: string;
    registrationNumber: string;
    status: string;
    availability: string;
    baseAddress: string;
    serviceRadiusKm: number;
  };
  volunteers: VolunteerFleetItem[];
  stats: {
    totalVolunteers: number;
    activeVolunteers: number;
    busyCount: number;
    idleCount: number;
    verifiedCount: number;
  };
  unassignedDonations: {
    id: string;
    title: string;
    quantity: string;
    quantityUnit: string;
    status: string;
    pickupAddress: string;
    donor: { organizationName: string };
  }[];
}

export default function VolunteerFleetView({
  ngo,
  volunteers,
  stats,
  unassignedDonations,
}: VolunteerFleetViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'AVAILABLE' | 'BUSY' | 'VERIFIED'>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [showSingleAssignModal, setShowSingleAssignModal] = useState(false);
  const [selectedVolunteerForAssign, setSelectedVolunteerForAssign] = useState<VolunteerFleetItem | null>(null);

  // Auto-allotment state
  const [allotMode, setAllotMode] = useState<'RANDOM' | 'ROUND_ROBIN'>('RANDOM');
  const [allotResult, setAllotResult] = useState<{
    count: number;
    mode: string;
    assignments: { donationTitle: string; volunteerName: string }[];
  } | null>(null);

  // Add Volunteer form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVehicle, setNewVehicle] = useState('Bike / Two-Wheeler');
  const [newArea, setNewArea] = useState('Central Zone');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filtering
  const filteredVolunteers = volunteers.filter((vol) => {
    const matchesSearch =
      vol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vol.phoneNumber.includes(searchTerm) ||
      vol.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vol.operatingArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vol.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'AVAILABLE') return !vol.isBusy && vol.status === 'ACTIVE';
    if (filterTab === 'BUSY') return vol.isBusy;
    if (filterTab === 'VERIFIED') return vol.verificationStatus === 'VERIFIED';
    return true;
  });

  // Handle Add Volunteer
  const handleAddVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    startTransition(async () => {
      const res = await addNgoVolunteer({
        name: newName,
        email: newEmail,
        phoneNumber: newPhone,
        vehicleInfo: newVehicle,
        operatingArea: newArea,
      });

      if (res.success) {
        setFormSuccess(`Volunteer ${newName} registered successfully!`);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setTimeout(() => {
          setShowAddModal(false);
          setFormSuccess(null);
          router.refresh();
        }, 1200);
      } else {
        setFormError(res.error || 'Failed to add volunteer.');
      }
    });
  };

  // Handle Auto-Allot Tasks
  const handleExecuteAllotment = async () => {
    setFormError(null);
    startTransition(async () => {
      const res = await autoAllotTasks({ mode: allotMode });
      if (res.success && res.assignments) {
        setAllotResult({
          count: res.count || 0,
          mode: res.mode || allotMode,
          assignments: res.assignments,
        });
        router.refresh();
      } else {
        setFormError(res.error || 'Failed to auto-allot tasks.');
      }
    });
  };

  // Handle Seed Demo Rescues
  const handleSeedDemo = async () => {
    setFormError(null);
    startTransition(async () => {
      const res = await seedDemoRescues();
      if (res.success) {
        router.refresh();
      } else {
        setFormError(res.error || 'Failed to seed demo rescues.');
      }
    });
  };

  // Handle Single Volunteer Direct Assign
  const handleAssignDonationToVolunteer = async (donationId: string) => {
    if (!selectedVolunteerForAssign) return;
    startTransition(async () => {
      const res = await assignVolunteer(donationId, selectedVolunteerForAssign.id);
      if (res.success) {
        setShowSingleAssignModal(false);
        setSelectedVolunteerForAssign(null);
        router.refresh();
      } else {
        setFormError(res.error || 'Failed to assign donation.');
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Fleet Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">
              Total Fleet
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
              👥
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground font-display">
            {stats.totalVolunteers}
          </p>
          <span className="text-[11px] text-muted-text font-medium">
            Registered riders
          </span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">
              On Duty Now
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm">
              🛵
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 font-display">
            {stats.busyCount}
          </p>
          <span className="text-[11px] text-muted-text font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Handling live rescues
          </span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">
              Idle & Available
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
              ⚡
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 font-display">
            {stats.idleCount}
          </p>
          <span className="text-[11px] text-muted-text font-medium">
            Ready for instant dispatch
          </span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">
              Verified Partners
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-sm">
              🛡️
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground font-display">
            {stats.verifiedCount}
          </p>
          <span className="text-[11px] text-muted-text font-medium">
            FSSAI compliant riders
          </span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4.5 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">
              Pending Rescues
            </span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center font-bold text-sm">
              📦
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-700 font-display">
            {unassignedDonations.length}
          </p>
          <span className="text-[11px] text-muted-text font-medium">
            Awaiting rider dispatch
          </span>
        </div>
      </div>

      {/* Action Command Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0b3c26] to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <span>🚀 Fleet Dispatch Center</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white font-display">
              Multi-Volunteer Batch Allotment & Fleet Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Instantly allot multiple food rescues to various fleet volunteers at once using
              random or balanced distribution, or register new riders to expand your NGO fleet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 1-Click Auto Allotment Button */}
            <button
              onClick={() => {
                setAllotResult(null);
                setFormError(null);
                setShowAllotModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-accent text-slate-950 font-bold text-sm shadow-md hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>🎲</span>
              <span>Auto-Allot Tasks</span>
              {unassignedDonations.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-mono font-black">
                  {unassignedDonations.length}
                </span>
              )}
            </button>

            {/* Register Volunteer Button */}
            <button
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>➕</span>
              <span>Add Volunteer</span>
            </button>

            {/* Live Monitor Link */}
            <Link
              href="/ngo/active"
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>🛰️</span>
              <span>Live Monitor</span>
            </Link>

            {/* Quick Demo Rescues Seeder */}
            <button
              onClick={handleSeedDemo}
              disabled={isPending}
              title="Add 3 realistic surplus donations for quick testing"
              className="px-3 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold border border-emerald-700/50 transition-all flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Seed Demo Rescues</span>
            </button>
          </div>
        </div>

        {/* Unassigned Tasks Notice Banner */}
        {unassignedDonations.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-semibold">
                {unassignedDonations.length} surplus donation(s) ready for pickup assignment:
              </span>
              <span className="text-white/80 hidden md:inline">
                {unassignedDonations.map((d) => d.title).slice(0, 2).join(', ')}
                {unassignedDonations.length > 2 ? ` and ${unassignedDonations.length - 2} more...` : ''}
              </span>
            </div>
            <button
              onClick={() => {
                setAllotMode('RANDOM');
                setShowAllotModal(true);
              }}
              className="text-emerald-300 hover:text-white font-bold underline underline-offset-4 cursor-pointer"
            >
              Allot to Volunteers Now →
            </button>
          </div>
        )}
      </div>

      {/* Roster Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'ALL', label: 'All Fleet', count: volunteers.length },
              { key: 'AVAILABLE', label: 'Idle & Available', count: stats.idleCount },
              { key: 'BUSY', label: 'On Mission', count: stats.busyCount },
              { key: 'VERIFIED', label: 'Verified', count: stats.verifiedCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === tab.key
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-muted text-muted-text hover:text-foreground hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-slate-700 border border-border'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search rider name, phone, area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Volunteer Fleet Grid */}
      {filteredVolunteers.length === 0 ? (
        <div className="text-center bg-surface border border-border rounded-2xl p-16 shadow-xs">
          <span className="text-4xl block mb-3">🛵</span>
          <h3 className="text-base font-bold text-foreground">No volunteers found</h3>
          <p className="mt-1 text-xs text-muted-text max-w-sm mx-auto">
            {searchTerm
              ? `No volunteers match your search "${searchTerm}".`
              : 'You do not have any volunteers in this category yet. Click "Add Volunteer" above to register fleet riders.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVolunteers.map((vol) => (
            <div
              key={vol.id}
              className={`bg-surface border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                vol.isBusy
                  ? 'border-amber-200 ring-1 ring-amber-100'
                  : 'border-border hover:border-emerald-300'
              }`}
            >
              <div>
                {/* Card Header: Avatar & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0b3c26] to-[#10b981] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {vol.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          vol.isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                        title={vol.isBusy ? 'On active rescue' : 'Available'}
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-foreground tracking-tight font-display">
                        {vol.name}
                      </h3>
                      <p className="text-xs text-muted-text font-medium flex items-center gap-1.5 mt-0.5">
                        <span>📞 {vol.phoneNumber}</span>
                      </p>
                    </div>
                  </div>

                  {vol.isBusy ? (
                    <span className="badge-premium bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5">
                      On Mission ({vol.activeTasksCount})
                    </span>
                  ) : (
                    <span className="badge-premium bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5">
                      Available
                    </span>
                  )}
                </div>

                {/* Rider Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface-muted/60 p-2.5 rounded-xl border border-border/70 mb-3.5">
                  <div>
                    <span className="text-muted-text block text-[10px] uppercase font-bold tracking-wider">
                      Vehicle
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      🛵 {vol.vehicleInfo}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-text block text-[10px] uppercase font-bold tracking-wider">
                      Operating Area
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      📍 {vol.operatingArea}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-text block text-[10px] uppercase font-bold tracking-wider">
                      Total Rescues
                    </span>
                    <span className="font-semibold text-emerald-700 font-mono">
                      🏆 {vol.completedTasksCount} completed
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-text block text-[10px] uppercase font-bold tracking-wider">
                      Compliance
                    </span>
                    <span
                      className={`font-semibold ${
                        vol.verificationStatus === 'VERIFIED'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {vol.verificationStatus === 'VERIFIED' ? '✓ Verified' : '⏳ Review'}
                    </span>
                  </div>
                </div>

                {/* Active Mission Card (if busy) */}
                {vol.isBusy && vol.currentTasks.length > 0 && (
                  <div className="space-y-2 mb-3.5">
                    <span className="text-[10px] uppercase font-bold text-muted-text tracking-wider block">
                      Active Handling Mission:
                    </span>
                    {vol.currentTasks.map((task) => (
                      <div
                        key={task.assignmentId}
                        className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-xs space-y-1"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-amber-950 truncate">
                            🍲 {task.title}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold whitespace-nowrap">
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 truncate">
                          From: {task.donorName} ({task.quantity})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <a
                  href={`tel:${vol.phoneNumber}`}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-muted hover:bg-slate-200 text-foreground text-xs font-semibold border border-border transition-all flex items-center gap-1"
                  title="Call Volunteer"
                >
                  <span>📞 Call</span>
                </a>

                <button
                  onClick={() => {
                    setSelectedVolunteerForAssign(vol);
                    setShowSingleAssignModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>📦 Assign Rescue</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / REGISTER VOLUNTEER                       */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Register Fleet Volunteer</h3>
                <p className="text-xs text-muted-text mt-0.5">
                  Add a new driver or rider to {ngo.organizationName}.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-danger-bg text-danger border border-danger-border text-xs font-semibold">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mt-4 p-3 rounded-lg bg-success-bg text-success border border-success-border text-xs font-semibold">
                ✓ {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddVolunteerSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rider@foodops.org"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="Bike / Two-Wheeler">Bike / Two-Wheeler</option>
                    <option value="EV Scooter">EV Scooter</option>
                    <option value="Cargo Auto">Cargo Auto</option>
                    <option value="Van / Four-Wheeler">Van / Four-Wheeler</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Operating Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shivajinagar, Kothrud, Pimpri-Chinchwad"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-muted hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary px-5 py-2 text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {isPending ? 'Registering...' : 'Register Volunteer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: AUTO / RANDOM ALLOTMENT ENGINE                 */}
      {/* ======================================================== */}
      {showAllotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-xl w-full p-6 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>🎲</span> Auto-Allot Tasks to Fleet
                </h3>
                <p className="text-xs text-muted-text mt-0.5">
                  Batch assign pending food donations across your active volunteers at once.
                </p>
              </div>
              <button
                onClick={() => setShowAllotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-danger-bg text-danger border border-danger-border text-xs font-semibold">
                {formError}
              </div>
            )}

            {allotResult ? (
              <div className="mt-5 space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-success-bg border border-success-border text-success space-y-1">
                  <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>✓</span> Batch Allotment Successful!
                  </h4>
                  <p className="text-xs">
                    Successfully allotted {allotResult.count} food rescue(s) to fleet riders using{' '}
                    <span className="font-bold underline">{allotResult.mode}</span> distribution.
                  </p>
                </div>

                <div className="bg-surface-muted rounded-xl p-4 border border-border space-y-2">
                  <span className="text-[11px] uppercase font-bold text-muted-text tracking-wider block">
                    Dispatched Assignments:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {allotResult.assignments.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-surface p-2.5 rounded-lg border border-border shadow-2xs"
                      >
                        <span className="font-bold text-foreground truncate max-w-[240px]">
                          🍲 {item.donationTitle}
                        </span>
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          ➔ 🛵 {item.volunteerName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Link
                    href="/ngo/active"
                    className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs flex items-center gap-1.5"
                  >
                    <span>🛰️ Open Live Rescue Monitor</span>
                  </Link>
                  <button
                    onClick={() => setShowAllotModal(false)}
                    className="px-4 py-2 rounded-lg bg-surface-muted text-foreground text-xs font-semibold hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2">
                    Select Allotment Algorithm
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAllotMode('RANDOM')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        allotMode === 'RANDOM'
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-muted text-muted-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <span>🎲</span>
                        <span>Random Allotment</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-80">
                        Randomly shuffles available verified volunteers and distributes pending tasks.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAllotMode('ROUND_ROBIN')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        allotMode === 'ROUND_ROBIN'
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-muted text-muted-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <span>⚖️</span>
                        <span>Balanced Round-Robin</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-80">
                        Allocates tasks evenly to volunteers with the lowest active workload first.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Candidate Donations preview */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-foreground">
                      Pending Donations to Distribute ({unassignedDonations.length})
                    </label>
                    <span className="text-[11px] text-muted-text">
                      {volunteers.filter((v) => v.status === 'ACTIVE').length} active riders available
                    </span>
                  </div>

                  {unassignedDonations.length === 0 ? (
                    <div className="p-6 bg-surface-muted border border-border rounded-xl text-center">
                      <span className="text-2xl block mb-1">📦</span>
                      <p className="text-xs text-muted-text">
                        No pending donations waiting for allotment.
                      </p>
                      <button
                        onClick={handleSeedDemo}
                        disabled={isPending}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-all"
                      >
                        ⚡ Seed 3 Demo Rescues Now
                      </button>
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl divide-y divide-border max-h-48 overflow-y-auto">
                      {unassignedDonations.map((d) => (
                        <div key={d.id} className="p-3 text-xs flex justify-between items-center bg-surface">
                          <div>
                            <span className="font-bold text-foreground block truncate max-w-[280px]">
                              🍲 {d.title}
                            </span>
                            <span className="text-[11px] text-muted-text">
                              {d.quantity} {d.quantityUnit} • From: {d.donor.organizationName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            Ready
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Dispatch Actions */}
                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAllotModal(false)}
                    className="px-4 py-2 rounded-lg bg-surface-muted hover:bg-slate-200 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPending || unassignedDonations.length === 0}
                    onClick={handleExecuteAllotment}
                    className="btn-primary px-5 py-2 text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isPending ? 'Distributing Tasks...' : `🚀 Confirm Allotment (${allotMode})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DIRECT ASSIGN TO VOLUNTEER                      */}
      {/* ======================================================== */}
      {showSingleAssignModal && selectedVolunteerForAssign && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Assign Rescue to {selectedVolunteerForAssign.name}
                </h3>
                <p className="text-xs text-muted-text mt-0.5">
                  Select a pending surplus donation from the list below.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSingleAssignModal(false);
                  setSelectedVolunteerForAssign(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {unassignedDonations.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-3xl block mb-2">📦</span>
                <p className="text-xs text-muted-text">
                  No unassigned donations found. Claim donations or seed demo items first.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {unassignedDonations.map((don) => (
                  <div
                    key={don.id}
                    className="p-3 rounded-xl border border-border bg-surface-muted/50 hover:bg-surface-muted flex justify-between items-center text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-foreground block truncate max-w-[200px]">
                        {don.title}
                      </span>
                      <span className="text-[11px] text-muted-text">
                        {don.quantity} {don.quantityUnit} • {don.donor.organizationName}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAssignDonationToVolunteer(don.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-border flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowSingleAssignModal(false);
                  setSelectedVolunteerForAssign(null);
                }}
                className="px-4 py-2 rounded-lg bg-surface-muted hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
