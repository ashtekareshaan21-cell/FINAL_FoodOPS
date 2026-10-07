'use client';

import { useState, useMemo } from 'react';
import ForceExpireButton from './ForceExpireButton';
import ClientDateTime from '@/components/ClientDateTime';

interface AdminDataBrowserProps {
  donors: any[];
  ngos: any[];
  volunteers: any[];
  donations: any[];
  impactRecords: any[];
  verifications: any[];
}

type TabType = 'USERS' | 'DONATIONS' | 'OPERATIONS' | 'VERIFICATION' | 'IMPACT';

export default function AdminDataBrowser({
  donors,
  ngos,
  volunteers,
  donations,
  impactRecords,
  verifications,
}: AdminDataBrowserProps) {
  const [activeTab, setActiveTab] = useState<TabType>('DONATIONS');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.foodCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.donor?.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.acceptedNgo?.organizationName && d.acceptedNgo.organizationName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [donations, searchQuery, statusFilter]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return {
      donors: donors.filter((d) => d.organizationName.toLowerCase().includes(q) || d.user?.email?.toLowerCase().includes(q) || d.user?.phoneNumber?.includes(q)),
      ngos: ngos.filter((n) => n.organizationName.toLowerCase().includes(q) || n.registrationNumber.toLowerCase().includes(q) || n.user?.email?.toLowerCase().includes(q)),
      volunteers: volunteers.filter((v) => v.name.toLowerCase().includes(q) || v.ngo?.organizationName?.toLowerCase().includes(q) || v.user?.email?.toLowerCase().includes(q)),
    };
  }, [donors, ngos, volunteers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['DONATIONS', 'USERS', 'OPERATIONS', 'VERIFICATION', 'IMPACT'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#0b3c26] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab === 'DONATIONS' && '📦 Food / Donations'}
              {tab === 'USERS' && '👥 System Users'}
              {tab === 'OPERATIONS' && '⚡ Operations & Deliveries'}
              {tab === 'VERIFICATION' && '🛡️ Verification Requests'}
              {tab === 'IMPACT' && '🌱 Ecological Impact'}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search records by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium py-2 px-3 pl-9 text-xs"
          />
          <span className="absolute left-3 top-2.5 text-muted-light text-xs">🔍</span>
        </div>
      </div>

      {/* TAB 1: FOOD / DONATIONS */}
      {activeTab === 'DONATIONS' && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Food & Surplus Listings</h2>
              <p className="text-xs text-muted-text">Live audit trail of all registered food donations across lifecycle stages.</p>
            </div>
            
            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-premium py-1.5 px-3 text-xs font-semibold"
              >
                <option value="ALL">All Statuses ({donations.length})</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="VOLUNTEER_ASSIGNED">VOLUNTEER_ASSIGNED</option>
                <option value="PICKUP_IN_PROGRESS">PICKUP_IN_PROGRESS</option>
                <option value="PICKED_UP">PICKED_UP</option>
                <option value="DELIVERY_IN_PROGRESS">DELIVERY_IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead>
                <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                  <th className="pb-3 pr-4">Title & Description</th>
                  <th className="pb-3 pr-4">Donor Org</th>
                  <th className="pb-3 pr-4">Claiming NGO</th>
                  <th className="pb-3 pr-4">Quantity & Category</th>
                  <th className="pb-3 pr-4">Expiry SLA</th>
                  <th className="pb-3 pr-4">Current Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium text-muted-text">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-text">No donation records match the filter criteria.</td>
                  </tr>
                ) : (
                  filteredDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-bold text-foreground">{d.title}</p>
                        <p className="text-[10px] text-muted-light max-w-xs truncate">{d.description}</p>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-foreground">{d.donor?.organizationName || 'N/A'}</td>
                      <td className="py-3 pr-4 text-muted-text">{d.acceptedNgo?.organizationName || 'Unclaimed'}</td>
                      <td className="py-3 pr-4">
                        <span className="font-bold text-foreground">{d.quantity} {d.quantityUnit}</span> &bull; <span className="font-mono text-[10px] uppercase text-primary font-bold">{d.foodCategory}</span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-[11px] text-danger">
                        <ClientDateTime date={d.pickupDeadlineAt} />
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          d.status === 'COMPLETED'
                            ? 'bg-success-bg text-success border border-success-border'
                            : d.status === 'AVAILABLE'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : d.status === 'EXPIRED'
                            ? 'bg-danger-bg text-danger border border-danger-border'
                            : 'bg-warning-bg text-warning border border-warning-border'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {['AVAILABLE', 'ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_IN_PROGRESS'].includes(d.status) ? (
                          <ForceExpireButton donationId={d.id} status={d.status} />
                        ) : (
                          <span className="text-[10px] text-muted-light font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          {/* Donors */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold text-foreground mb-4">Registered Surplus Donors ({filteredUsers.donors.length})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-xs text-left">
                <thead>
                  <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                    <th className="pb-3 pr-4">Organization Name</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Contact Person</th>
                    <th className="pb-3 pr-4">Phone & OTP</th>
                    <th className="pb-3 pr-4">Verification</th>
                    <th className="pb-3">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium text-muted-text">
                  {filteredUsers.donors.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 pr-4 font-bold text-foreground">{d.organizationName}</td>
                      <td className="py-3 pr-4 uppercase text-[10px] font-mono">{d.organizationType}</td>
                      <td className="py-3 pr-4">{d.contactPerson}</td>
                      <td className="py-3 pr-4">
                        <span className="font-mono">{d.user?.phoneNumber}</span>
                        <span className={`ml-2 px-1.5 py-0.2 text-[9px] font-bold rounded-sm ${d.user?.isPhoneVerified ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
                          {d.user?.isPhoneVerified ? 'Verified' : 'Pending OTP'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${d.verificationStatus === 'VERIFIED' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
                          {d.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-muted-light">{d.user?.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NGOs */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold text-foreground mb-4">Rescue NGOs ({filteredUsers.ngos.length})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-xs text-left">
                <thead>
                  <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                    <th className="pb-3 pr-4">NGO Name</th>
                    <th className="pb-3 pr-4">FSSAI License</th>
                    <th className="pb-3 pr-4">Base Address</th>
                    <th className="pb-3 pr-4">Service Radius</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium text-muted-text">
                  {filteredUsers.ngos.map((n) => (
                    <tr key={n.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 pr-4 font-bold text-foreground">{n.organizationName}</td>
                      <td className="py-3 pr-4 font-mono">{n.registrationNumber}</td>
                      <td className="py-3 pr-4 max-w-[180px] truncate text-[11px]">{n.baseAddress}</td>
                      <td className="py-3 pr-4 font-bold">{n.serviceRadiusKm} km</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${n.status === 'VERIFIED' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
                          {n.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-muted-light">{n.user?.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Volunteers */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold text-foreground mb-4">Rescue Riders / Volunteers ({filteredUsers.volunteers.length})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-xs text-left">
                <thead>
                  <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                    <th className="pb-3 pr-4">Rider Name</th>
                    <th className="pb-3 pr-4">Affiliated NGO</th>
                    <th className="pb-3 pr-4">Phone</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium text-muted-text">
                  {filteredUsers.volunteers.map((v) => (
                    <tr key={v.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 pr-4 font-bold text-foreground">{v.name}</td>
                      <td className="py-3 pr-4">{v.ngo?.organizationName || 'Independent'}</td>
                      <td className="py-3 pr-4 font-mono">{v.phoneNumber}</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-primary/5 text-primary border border-primary/10">
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-muted-light">{v.user?.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONS */}
      {activeTab === 'OPERATIONS' && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden space-y-4">
          <h2 className="text-lg font-bold text-foreground">Active Operational Rescues & Deliveries</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead>
                <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                  <th className="pb-3 pr-4">Donation Title</th>
                  <th className="pb-3 pr-4">Donor Org</th>
                  <th className="pb-3 pr-4">Assigned Volunteer</th>
                  <th className="pb-3 pr-4">NGO Recipient</th>
                  <th className="pb-3 pr-4">Pickup Address</th>
                  <th className="pb-3">Donation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium text-muted-text">
                {donations.filter((d) => d.acceptedNgoId).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-text">No active operations currently claimed by NGOs.</td>
                  </tr>
                ) : (
                  donations.filter((d) => d.acceptedNgoId).map((d) => (
                    <tr key={d.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 pr-4 font-bold text-foreground">{d.title}</td>
                      <td className="py-3 pr-4 font-semibold">{d.donor?.organizationName}</td>
                      <td className="py-3 pr-4 text-primary font-bold">{d.assignment?.volunteer?.name || 'Unassigned Rider'}</td>
                      <td className="py-3 pr-4">{d.acceptedNgo?.organizationName}</td>
                      <td className="py-3 pr-4 max-w-[150px] truncate text-[11px]">{d.pickupAddress}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VERIFICATION */}
      {activeTab === 'VERIFICATION' && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden space-y-4">
          <h2 className="text-lg font-bold text-foreground">Formal System Verification Requests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead>
                <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                  <th className="pb-3 pr-4">User Email</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Submitted At</th>
                  <th className="pb-3 pr-4">Notes</th>
                  <th className="pb-3">Request Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium text-muted-text">
                {verifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-text">No formal verification request logs.</td>
                  </tr>
                ) : (
                  verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 pr-4 font-mono font-bold text-foreground">{v.user?.email}</td>
                      <td className="py-3 pr-4 font-bold uppercase text-[10px]">{v.verificationType}</td>
                      <td className="py-3 pr-4 font-mono text-[11px]"><ClientDateTime date={v.submittedAt} /></td>
                      <td className="py-3 pr-4 text-muted-light max-w-xs truncate">{v.notes || '—'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          v.status === 'VERIFIED' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: IMPACT */}
      {activeTab === 'IMPACT' && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden space-y-4">
          <h2 className="text-lg font-bold text-foreground">Ecological & Biogas Impact Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead>
                <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                  <th className="pb-3 pr-4">Donation ID</th>
                  <th className="pb-3 pr-4">Food Weight</th>
                  <th className="pb-3 pr-4">Meals Served</th>
                  <th className="pb-3 pr-4">CO₂e Prevented</th>
                  <th className="pb-3 pr-4">Water Saved</th>
                  <th className="pb-3">Calculation Methodology</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium text-muted-text">
                {impactRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-text">No impact records generated yet. Complete rescues or recovery actions to log impact.</td>
                  </tr>
                ) : (
                  impactRecords.map((imp) => (
                    <tr key={imp.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3 pr-4 font-mono font-bold text-foreground text-[10px]">{imp.donationId}</td>
                      <td className="py-3 pr-4 font-bold text-success">{imp.foodWeightKg.toFixed(1)} kg</td>
                      <td className="py-3 pr-4 font-bold">{imp.estimatedServings}</td>
                      <td className="py-3 pr-4 font-mono">{imp.co2EquivalentKg.toFixed(1)} kg</td>
                      <td className="py-3 pr-4 font-mono">{imp.waterSavedLiters.toFixed(0)} L</td>
                      <td className="py-3">
                        <span
                          title={imp.factorsUsed}
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono cursor-help ${
                            imp.calculationMethod.includes('BIOGAS') ||
                            imp.calculationMethod.includes('RECOVERY') ||
                            imp.calculationMethod.includes('ANAEROBIC') ||
                            imp.calculationMethod.includes('AEROBIC') ||
                            imp.calculationMethod.includes('CIRCULAR')
                              ? 'bg-warning-bg text-warning border border-warning-border'
                              : 'bg-success-bg text-success border border-success-border'
                          }`}
                        >
                          {imp.calculationMethod}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
