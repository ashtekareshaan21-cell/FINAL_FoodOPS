export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDonorDonations } from '@/app/actions/donations';
import Navbar from '@/components/Navbar';

const STATUS_STYLING: Record<string, { bg: string; text: string; label: string }> = {
  AVAILABLE: { bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Available' },
  ACCEPTED: { bg: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', label: 'Accepted by NGO' },
  VOLUNTEER_ASSIGNED: { bg: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-400', label: 'Volunteer Assigned' },
  PICKUP_IN_PROGRESS: { bg: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400', label: 'Rider En Route' },
  PICKED_UP: { bg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', label: 'Picked Up' },
  DELIVERY_IN_PROGRESS: { bg: 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800', text: 'text-pink-700 dark:text-pink-400', label: 'Delivery in Progress' },
  DELIVERED: { bg: 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-400', label: 'Delivered' },
  COMPLETED: { bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', label: 'Completed & Impact Recorded' },
  CANCELLED: { bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' },
  EXPIRED: { bg: 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800', text: 'text-zinc-500 dark:text-zinc-400', label: 'Expired' },
};

export default async function DonorDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    redirect('/login');
  }

  // Get donor profile
  const donor = await prisma.donorProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!donor) {
    throw new Error('Donor profile not found');
  }

  const donations = await getDonorDonations();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {donor.organizationName}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Welcome to your donor dashboard. Track your surplus food rescues.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/donor/create"
              className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              + Create Donation
            </Link>
          </div>
        </div>

        {/* Donations List */}
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Your Donations</h2>

          {donations.length === 0 ? (
            <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12">
              <svg
                className="mx-auto h-12 w-12 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 00-2 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">No donations</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Get started by creating your first surplus food recovery request.
              </p>
              <div className="mt-6">
                <Link
                  href="/donor/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Create Donation
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <ul role="list" className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {donations.map((donation) => {
                  const style = STATUS_STYLING[donation.status] || { bg: 'bg-zinc-100', text: 'text-zinc-800', label: donation.status };
                  return (
                    <li key={donation.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                              {donation.title}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}
                            >
                              {style.label}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {donation.description}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <div>
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Quantity:</span>{' '}
                              {donation.quantity} {donation.quantityUnit}
                            </div>
                            <div>
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Category:</span>{' '}
                              {donation.foodCategory}
                            </div>
                            <div className="md:col-span-2">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Deadline:</span>{' '}
                              {new Date(donation.pickupDeadlineAt).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Status tracking right section */}
                        <div className="flex-shrink-0 text-right min-w-[150px]">
                          {donation.acceptedNgo ? (
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">Claimed By</p>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {donation.acceptedNgo.organizationName}
                              </p>
                              {donation.assignment?.volunteer && (
                                <>
                                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider pt-2">Rider assigned</p>
                                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    {donation.assignment.volunteer.name} ({donation.assignment.volunteer.phoneNumber})
                                  </p>
                                </>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-zinc-400 italic">Waiting for NGO...</p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
