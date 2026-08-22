export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllDonors, getAllNgos, getAllVolunteers, getAllDonations } from '@/app/actions/admin';
import Navbar from '@/components/Navbar';
import ForceExpireButton from './ForceExpireButton';
import FoodOpsBackground from '@/components/visual/FoodOpsBackground';

export default async function AdminDataPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const donors = await getAllDonors();
  const ngos = await getAllNgos();
  const volunteers = await getAllVolunteers();
  const donations = await getAllDonations();

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      <FoodOpsBackground variant="admin" />
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in">
        <div className="pb-6 border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-display">
            System Data Browser
          </h1>
          <p className="mt-1.5 text-sm text-muted-text font-medium">
            Audit raw database rows, operational coordinates, and status logs.
          </p>
        </div>

        {/* Donors List */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-foreground mb-4">Surplus Donors</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead>
                <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                  <th className="pb-3 pr-4">Organization Name</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Contact</th>
                  <th className="pb-3 pr-4">Coordinates (Lat, Lng)</th>
                  <th className="pb-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium text-muted-text">
                {donors.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-muted transition-colors">
                    <td className="py-3 pr-4 font-bold text-foreground">{d.organizationName}</td>
                    <td className="py-3 pr-4">{d.organizationType}</td>
                    <td className="py-3 pr-4">{d.contactPerson}</td>
                    <td className="py-3 pr-4 font-mono">{d.latitude.toFixed(6)}, {d.longitude.toFixed(6)}</td>
                    <td className="py-3 font-mono text-muted-light">{d.user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NGOs List */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-foreground mb-4">Rescue NGOs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead>
                <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                  <th className="pb-3 pr-4">NGO Name</th>
                  <th className="pb-3 pr-4">FSSAI Registration</th>
                  <th className="pb-3 pr-4">Operational Address</th>
                  <th className="pb-3 pr-4">Coordinates</th>
                  <th className="pb-3 pr-4">Radius</th>
                  <th className="pb-3 pr-4">Accepted Categories</th>
                  <th className="pb-3 pr-4">Availability</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium text-muted-text">
                {ngos.map((n) => (
                  <tr key={n.id} className="hover:bg-surface-muted transition-colors">
                    <td className="py-3 pr-4 font-bold text-foreground">{n.organizationName}</td>
                    <td className="py-3 pr-4 font-mono">{n.registrationNumber}</td>
                    <td className="py-3 pr-4 max-w-[150px] truncate text-[11px]" title={n.baseAddress}>{n.baseAddress}</td>
                    <td className="py-3 pr-4 font-mono">{n.baseLatitude.toFixed(6)}, {n.baseLongitude.toFixed(6)}</td>
                    <td className="py-3 pr-4">{n.serviceRadiusKm} km</td>
                    <td className="py-3 pr-4 max-w-[150px] truncate font-mono text-[10px]" title={n.acceptedFoodTypes}>{n.acceptedFoodTypes || 'None'}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        n.availability === 'AVAILABLE'
                          ? 'bg-success-bg text-success border border-success-border'
                          : n.availability === 'BUSY'
                          ? 'bg-warning-bg text-warning border border-warning-border'
                          : 'bg-danger-bg text-danger border border-danger-border'
                      }`}>
                        {n.availability || 'AVAILABLE'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        n.status === 'VERIFIED' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-muted-light">{n.user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volunteers List */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-foreground mb-4">Rescue Riders (Volunteers)</h2>
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
                {volunteers.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-muted transition-colors">
                    <td className="py-3 pr-4 font-bold text-foreground">{v.name}</td>
                    <td className="py-3 pr-4">{v.ngo.organizationName}</td>
                    <td className="py-3 pr-4 font-mono">{v.phoneNumber}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-primary/5 text-primary border border-primary/10">
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-muted-light">{v.user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donations List */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-foreground mb-4">Donation Life Cycles</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead>
                <tr className="text-muted uppercase tracking-wider text-[9px] font-bold border-b border-border">
                  <th className="pb-3 pr-4">Donation Title</th>
                  <th className="pb-3 pr-4">Donor</th>
                  <th className="pb-3 pr-4">Qty</th>
                  <th className="pb-3 pr-4">State</th>
                  <th className="pb-3 pr-4">Claimed NGO</th>
                  <th className="pb-3 pr-4">Coordinates (Lat, Lng)</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium text-muted-text">
                {donations.map((dn) => (
                  <tr key={dn.id} className="hover:bg-surface-muted transition-colors">
                    <td className="py-3 pr-4 font-bold text-foreground">{dn.title}</td>
                    <td className="py-3 pr-4">{dn.donor.organizationName}</td>
                    <td className="py-3 pr-4">{dn.quantity} {dn.quantityUnit}</td>
                    <td className="py-3 pr-4 font-mono text-xs font-bold text-primary">
                      {dn.status}
                    </td>
                    <td className="py-3 pr-4">
                      {dn.acceptedNgo?.organizationName || <span className="italic text-muted-light">Unclaimed</span>}
                    </td>
                    <td className="py-3 pr-4 font-mono">{dn.pickupLatitude.toFixed(6)}, {dn.pickupLongitude.toFixed(6)}</td>
                    <td className="py-3">
                      {(dn.status !== 'COMPLETED' && dn.status !== 'CANCELLED' && dn.status !== 'EXPIRED') ? (
                        <ForceExpireButton donationId={dn.id} />
                      ) : (
                        <span className="text-[10px] text-muted-light italic font-mono">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
