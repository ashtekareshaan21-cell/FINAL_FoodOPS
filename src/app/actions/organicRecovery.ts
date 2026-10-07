'use server';

import { getSession } from '@/lib/auth';
import { organicRecoveryService, DispatchOrganicRecoveryInput } from '@/services/organicRecoveryService';
import { revalidatePath } from 'next/cache';

export async function getOrganicRecoveryData() {
  const session = await getSession();
  if (!session || (session.role !== 'NGO' && session.role !== 'ADMIN')) {
    return {
      facilities: [],
      missions: [],
      candidateDonations: [],
      metrics: {
        totalMissions: 0,
        totalWasteKg: 0,
        totalCleanEnergyKwh: 0,
        totalBioFertilizerKg: 0,
        totalMethaneAvoidedKg: 0,
      },
    };
  }

  try {
    return await organicRecoveryService.getOrganicRecoveryDashboardData();
  } catch (error) {
    console.error('getOrganicRecoveryData error:', error);
    return {
      facilities: [],
      missions: [],
      candidateDonations: [],
      metrics: {
        totalMissions: 0,
        totalWasteKg: 0,
        totalCleanEnergyKwh: 0,
        totalBioFertilizerKg: 0,
        totalMethaneAvoidedKg: 0,
      },
    };
  }
}

export async function getOrganicFacilities() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  return organicRecoveryService.getFacilities();
}

export async function dispatchOrganicRecovery(input: DispatchOrganicRecoveryInput) {
  const session = await getSession();
  if (!session || (session.role !== 'NGO' && session.role !== 'ADMIN')) {
    return { success: false, error: 'Unauthorized. Only NGOs or Admins can dispatch organic recovery.' };
  }

  try {
    const res = await organicRecoveryService.dispatchOrganicRecovery(session.userId, input);
    revalidatePath('/ngo/recovery');
    revalidatePath('/ngo/active');
    revalidatePath('/ngo');
    revalidatePath('/admin');
    revalidatePath('/admin/recovery');
    return res;
  } catch (error) {
    console.error('Dispatch organic recovery error:', error);
    const message = error instanceof Error ? error.message : 'Failed to dispatch organic recovery.';
    return { success: false, error: message };
  }
}

export async function confirmFacilityArrival(missionId: string, otp?: string) {
  const session = await getSession();
  if (!session || (session.role !== 'NGO' && session.role !== 'ADMIN')) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const res = await organicRecoveryService.confirmFacilityArrival(session.userId, missionId, otp);
    revalidatePath('/ngo/recovery');
    revalidatePath('/admin');
    return res;
  } catch (error) {
    console.error('Confirm facility arrival error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify facility arrival.';
    return { success: false, error: message };
  }
}

export async function seedDemoExpiredDonations() {
  const session = await getSession();
  if (!session || (session.role !== 'NGO' && session.role !== 'ADMIN')) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const items = await organicRecoveryService.seedDemoExpiredDonations(session.userId);
    revalidatePath('/ngo/recovery');
    revalidatePath('/admin');
    return { success: true, count: items.length };
  } catch (error) {
    console.error('Seed demo expired donations error:', error);
    const message = error instanceof Error ? error.message : 'Failed to seed expired donations.';
    return { success: false, error: message };
  }
}
