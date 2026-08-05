'use server';

import { getSession } from '@/lib/auth';
import { adminService } from '@/services/adminService';
import { revalidatePath } from 'next/cache';

export async function getPendingNgos() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return adminService.getPendingNgos();
}

export async function verifyNgo(ngoId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    await adminService.verifyNgo(ngoId);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Verify NGO error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify NGO.';
    return { success: false, error: message };
  }
}

export async function rejectNgo(ngoId: string, reason: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    await adminService.rejectNgo(ngoId, reason);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Reject NGO error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reject NGO.';
    return { success: false, error: message };
  }
}

export async function getAdminStats() {
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
  return adminService.getAllDonors();
}

export async function getAllNgos() {
  return adminService.getAllNgos();
}

export async function getAllVolunteers() {
  return adminService.getAllVolunteers();
}

export async function getAllDonations() {
  return adminService.getAllDonations();
}

export async function forceExpireDonation(donationId: string) {
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
