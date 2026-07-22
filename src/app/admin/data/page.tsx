import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllDonors, getAllNgos, getAllVolunteers, getAllDonations } from '@/app/actions/admin';
import Navbar from '@/components/Navbar';
import ForceExpireButton from './ForceExpireButton';

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <div className="pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            System Data Browser
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Audit raw database rows, statuses, and coordinates.
          </p>
        </div>

        {/* Donors List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Surplus Donors</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-left">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3">Organization Name</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Coordinates (Lat, Lng)</th>
                  <th className="pb-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {donors.map((d) => (
                  <tr key={d.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="py-3 font-semibold">{d.organizationName}</td>
                    <td className="py-3">{d.organizationType}</td>
                    <td className="py-3">{d.contactPerson}</td>
                    <td className="py-3 font-mono">{d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}</td>
                    <td className="py-3 text-zinc-500">{d.user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NGOs List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Rescue NGOs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-left">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3">NGO Name</th>
                  <th className="pb-3">FSSAI Registration</th>
                  <th className="pb-3">Operational Address</th>
                  <th className="pb-3">Coordinates</th>
                  <th className="pb-3">Service Radius</th>
                  <th className="pb-3">Accepted Food Types</th>
                  <th className="pb-3">Availability</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 font-mono">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {ngos.map((n) => (
                  <tr key={n.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="py-3 font-semibold">{n.organizationName}</td>
                    <td className="py-3 font-mono">{n.registrationNumber}</td>
                    <td className="py-3 max-w-[200px] truncate text-xs" title={n.baseAddress}>{n.baseAddress}</td>
                    <td className="py-3 font-mono">{n.baseLatitude.toFixed(4)}, {n.baseLongitude.toFixed(4)}</td>
                    <td className="py-3">{n.serviceRadiusKm} km</td>
                    <td className="py-3 max-w-[150px] truncate font-mono text-[11px]" title={n.acceptedFoodTypes}>{n.acceptedFoodTypes || 'None'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.availability === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : n.availability === 'BUSY'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                      }`}>
                        {n.availability || 'AVAILABLE'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-500">{n.user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volunteers List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Rescue Riders (Volunteers)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-left">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3">Rider Name</th>
                  <th className="pb-3">Affiliated NGO</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {volunteers.map((v) => (
                  <tr key={v.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="py-3 font-semibold">{v.name}</td>
                    <td className="py-3">{v.ngo.organizationName}</td>
                    <td className="py-3">{v.phoneNumber}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-500">{v.user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donations List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Donation Life Cycles</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-left">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3">Donation Title</th>
                  <th className="pb-3">Donor</th>
                  <th className="pb-3">Qty</th>
                  <th className="pb-3">State</th>
                  <th className="pb-3">Claimed NGO</th>
                  <th className="pb-3">Coordinates (Lat, Lng)</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {donations.map((dn) => (
                  <tr key={dn.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="py-3 font-semibold">{dn.title}</td>
                    <td className="py-3">{dn.donor.organizationName}</td>
                    <td className="py-3">{dn.quantity} {dn.quantityUnit}</td>
                    <td className="py-3 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {dn.status}
                    </td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">
                      {dn.acceptedNgo?.organizationName || <span className="italic text-zinc-400">Unclaimed</span>}
                    </td>
                    <td className="py-3 font-mono">{dn.pickupLatitude.toFixed(4)}, {dn.pickupLongitude.toFixed(4)}</td>
                    <td className="py-3">
                      {(dn.status !== 'COMPLETED' && dn.status !== 'CANCELLED' && dn.status !== 'EXPIRED') ? (
                        <ForceExpireButton donationId={dn.id} />
                      ) : (
                        <span className="text-xs text-zinc-400 italic font-mono">No action</span>
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
