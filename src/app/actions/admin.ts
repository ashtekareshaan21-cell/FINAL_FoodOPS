'use server';

import { getSession, isAdminPortalEnabled } from '@/lib/auth';
import { isLocalhostDevAdmin } from '@/lib/adminGate';
import { adminService } from '@/services/adminService';
import { revalidatePath } from 'next/cache';

async function resolveAdminAccess(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  if (await isLocalhostDevAdmin()) {
    const session = await getSession();
    return {
      ok: true,
      userId: session?.role === 'ADMIN' ? session.userId : 'local-dev-admin',
    };
  }
  if (process.env.NODE_ENV === 'production' || !isAdminPortalEnabled()) {
    return { ok: false, error: 'Admin portal is disabled.' };
  }
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { ok: false, error: 'Unauthorized' };
  }
  return { ok: true, userId: session.userId };
}

export async function getPendingNgos() {
  const access = await resolveAdminAccess();
  if (!access.ok) throw new Error(access.error);
  return adminService.getPendingNgos();
}

export async function verifyNgo(ngoId: string) {
  const access = await resolveAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  try {
    await adminService.verifyNgo(access.userId, ngoId);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Verify NGO error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify NGO.';
    return { success: false, error: message };
  }
}

export async function rejectNgo(ngoId: string, reason: string) {
  const access = await resolveAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  try {
    await adminService.rejectNgo(access.userId, ngoId, reason);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Reject NGO error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reject NGO.';
    return { success: false, error: message };
  }
}

export async function getAdminStats() {
  const access = await resolveAdminAccess();
  if (!access.ok) {
    throw new Error(
      access.error === 'Unauthorized'
        ? 'Unauthorized: Admin access required.'
        : access.error
    );
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
  const access = await resolveAdminAccess();
  if (!access.ok) throw new Error(access.error);
  return adminService.getAllDonors();
}

export async function getAllNgos() {
  const access = await resolveAdminAccess();
  if (!access.ok) throw new Error(access.error);
  return adminService.getAllNgos();
}

export async function getAllVolunteers() {
  const access = await resolveAdminAccess();
  if (!access.ok) throw new Error(access.error);
  return adminService.getAllVolunteers();
}

export async function getAllDonations() {
  const access = await resolveAdminAccess();
  if (!access.ok) throw new Error(access.error);
  return adminService.getAllDonations();
}

export async function getRecoveryDonations() {
  const access = await resolveAdminAccess();
  if (!access.ok) throw new Error(access.error);
  return adminService.getRecoveryDonations();
}

export async function getAllImpactRecords() {
  const access = await resolveAdminAccess();
  if (!access.ok) throw new Error(access.error);
  return adminService.getAllImpactRecords();
}

export async function getAllVerificationRequests() {
  const access = await resolveAdminAccess();
  if (!access.ok) throw new Error(access.error);
  return adminService.getAllVerificationRequests();
}

export async function forceExpireDonation(donationId: string) {
  const access = await resolveAdminAccess();
  if (!access.ok) {
    return {
      success: false,
      error:
        access.error === 'Unauthorized'
          ? 'Unauthorized. Only Admins can force-expire donations.'
          : access.error,
    };
  }

  try {
    await adminService.forceExpireDonation(access.userId, donationId);
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
  const access = await resolveAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  try {
    await adminService.verifyDonor(access.userId, donorId);
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
  const access = await resolveAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  try {
    await adminService.rejectDonor(access.userId, donorId, reason);
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
  const access = await resolveAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  try {
    await adminService.verifyVolunteer(access.userId, volunteerId);
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
  const access = await resolveAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  try {
    await adminService.rejectVolunteer(access.userId, volunteerId, reason);
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
