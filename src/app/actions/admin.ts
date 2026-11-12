'use server';

import { getSession, isAdminPortalEnabled } from '@/lib/auth';
import { adminService } from '@/services/adminService';
import { revalidatePath } from 'next/cache';

export async function getPendingNgos() {
  if (!isAdminPortalEnabled()) throw new Error('Admin portal is disabled.');
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
  return adminService.getPendingNgos();
}

export async function verifyNgo(ngoId: string) {
  if (!isAdminPortalEnabled()) return { success: false, error: 'Admin portal is disabled.' };
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await adminService.verifyNgo(session.userId, ngoId);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Verify NGO error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify NGO.';
    return { success: false, error: message };
  }
}

export async function rejectNgo(ngoId: string, reason: string) {
  if (!isAdminPortalEnabled()) return { success: false, error: 'Admin portal is disabled.' };
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await adminService.rejectNgo(session.userId, ngoId, reason);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Reject NGO error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reject NGO.';
    return { success: false, error: message };
  }
}

export async function getAdminStats() {
  if (!isAdminPortalEnabled()) throw new Error('Admin portal is disabled.');
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required.');
  }
  try {
    return await adminService.getAdminStats();
  } catch (error) {
    console.error('Get admin stats error:', error);
    return {
      totalDonors: 0,
      totalNgos: 0,
      verifiedNgos: 0,
      pendingNgos: 0,
      totalVolunteers: 0,
      totalDonations: 0,
      completedRescues: 0,
      co2SavedKg: 0,
      waterSavedLiters: 0,
      foodWeightKg: 0,
      divertedWeightKg: 0,
      biogasGeneratedKwh: 0,
    };
  }
}

export async function getAllDonors() {
  if (!isAdminPortalEnabled()) throw new Error('Admin portal is disabled.');
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
  return adminService.getAllDonors();
}

export async function getAllNgos() {
  if (!isAdminPortalEnabled()) throw new Error('Admin portal is disabled.');
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
  return adminService.getAllNgos();
}

export async function getAllVolunteers() {
  if (!isAdminPortalEnabled()) throw new Error('Admin portal is disabled.');
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
  return adminService.getAllVolunteers();
}

export async function getAllDonations() {
  if (!isAdminPortalEnabled()) throw new Error('Admin portal is disabled.');
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
  return adminService.getAllDonations();
}

export async function getRecoveryDonations() {
  if (!isAdminPortalEnabled()) throw new Error('Admin portal is disabled.');
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
  return adminService.getRecoveryDonations();
}

export async function getAllImpactRecords() {
  if (!isAdminPortalEnabled()) throw new Error('Admin portal is disabled.');
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
  return adminService.getAllImpactRecords();
}

export async function getAllVerificationRequests() {
  if (!isAdminPortalEnabled()) throw new Error('Admin portal is disabled.');
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
  return adminService.getAllVerificationRequests();
}

export async function forceExpireDonation(donationId: string) {
  if (!isAdminPortalEnabled()) return { success: false, error: 'Admin portal is disabled.' };
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Only Admins can force-expire donations.' };
  }

  try {
    await adminService.forceExpireDonation(session.userId, donationId);
    revalidatePath('/admin');
    revalidatePath('/admin/data');
    revalidatePath('/ngo');
    return { success: true };
  } catch (error) {
    console.error('Force expire donation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to force expire donation.';
    return { success: false, error: message };
  }
}

export async function verifyDonor(donorId: string) {
  if (!isAdminPortalEnabled()) return { success: false, error: 'Admin portal is disabled.' };
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await adminService.verifyDonor(session.userId, donorId);
    revalidatePath('/admin');
    revalidatePath('/admin/data');
    return { success: true };
  } catch (error) {
    console.error('Verify Donor error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify Donor.';
    return { success: false, error: message };
  }
}

export async function rejectDonor(donorId: string, reason: string) {
  if (!isAdminPortalEnabled()) return { success: false, error: 'Admin portal is disabled.' };
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await adminService.rejectDonor(session.userId, donorId, reason);
    revalidatePath('/admin');
    revalidatePath('/admin/data');
    return { success: true };
  } catch (error) {
    console.error('Reject Donor error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reject Donor.';
    return { success: false, error: message };
  }
}

export async function verifyVolunteer(volunteerId: string) {
  if (!isAdminPortalEnabled()) return { success: false, error: 'Admin portal is disabled.' };
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await adminService.verifyVolunteer(session.userId, volunteerId);
    revalidatePath('/admin');
    revalidatePath('/admin/data');
    revalidatePath('/volunteer');
    return { success: true };
  } catch (error) {
    console.error('Verify Volunteer error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify Volunteer.';
    return { success: false, error: message };
  }
}

export async function rejectVolunteer(volunteerId: string, reason: string) {
  if (!isAdminPortalEnabled()) return { success: false, error: 'Admin portal is disabled.' };
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await adminService.rejectVolunteer(session.userId, volunteerId, reason);
    revalidatePath('/admin');
    revalidatePath('/admin/data');
    revalidatePath('/volunteer');
    return { success: true };
  } catch (error) {
    console.error('Reject Volunteer error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reject Volunteer.';
    return { success: false, error: message };
  }
}


