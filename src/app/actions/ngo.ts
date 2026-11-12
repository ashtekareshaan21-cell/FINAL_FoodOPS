'use server';

import { getSession } from '@/lib/auth';
import { volunteerRepository } from '@/repositories/volunteerRepository';
import { ngoRepository } from '@/repositories/ngoRepository';
import { ngoFleetService } from '@/services/ngoFleetService';
import { revalidatePath } from 'next/cache';

export async function getNgoVolunteers() {
  const session = await getSession();
  if (!session) {
    return [];
  }

  if (session.role === 'ADMIN') {
    return volunteerRepository.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  if (session.role !== 'NGO') {
    return [];
  }

  const ngo = await ngoRepository.findByUserId(session.userId);
  if (!ngo) {
    return [];
  }

  return volunteerRepository.findMany({
    where: {
      ngoId: ngo.id,
      status: 'ACTIVE',
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get comprehensive volunteer fleet roster with live load metrics and stats
 */
export async function getNgoFleetRoster() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }

  return ngoFleetService.getFleetRosterWithStats(session.userId);
}

/**
 * Add / Register a volunteer directly to this NGO
 */
export async function addNgoVolunteer(data: {
  name: string;
  email: string;
  phoneNumber: string;
  vehicleInfo?: string;
  operatingArea?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    return { success: false, error: 'Unauthorized. Only NGOs can add volunteers.' };
  }

  try {
    const volunteer = await ngoFleetService.addVolunteerToNgo(session.userId, data);
    revalidatePath('/ngo/volunteers');
    revalidatePath('/ngo/active');
    revalidatePath('/ngo');
    return { success: true, volunteer };
  } catch (error) {
    console.error('Error adding volunteer:', error);
    const message = error instanceof Error ? error.message : 'Failed to register volunteer.';
    return { success: false, error: message };
  }
}

/**
 * Random or Round-Robin Batch Allotment of pending tasks to active volunteers
 */
export async function autoAllotTasks(options: {
  mode: 'RANDOM' | 'ROUND_ROBIN';
  donationIds?: string[];
}): Promise<{
  success: boolean;
  error?: string;
  count?: number;
  mode?: 'RANDOM' | 'ROUND_ROBIN';
  assignments?: {
    donationId: string;
    donationTitle: string;
    volunteerId: string;
    volunteerName: string;
  }[];
}> {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    return { success: false, error: 'Unauthorized. Only NGOs can allot tasks.' };
  }

  try {
    const result = await ngoFleetService.autoAllotDonations(session.userId, options);
    revalidatePath('/ngo/volunteers');
    revalidatePath('/ngo/active');
    revalidatePath('/ngo');
    return { success: true, ...result };
  } catch (error) {
    console.error('Error auto-allotting tasks:', error);
    const message = error instanceof Error ? error.message : 'Failed to allot tasks.';
    return { success: false, error: message };
  }
}

/**
 * Live stage advance action for concurrent rescue tracking and operations
 */
export async function advanceRescueStage(donationId: string) {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const result = await ngoFleetService.advanceRescueStage(session.userId, donationId);
    revalidatePath('/ngo/volunteers');
    revalidatePath('/ngo/active');
    revalidatePath('/ngo');
    return { success: true, ...result };
  } catch (error) {
    console.error('Error advancing rescue stage:', error);
    const message = error instanceof Error ? error.message : 'Failed to advance rescue stage.';
    return { success: false, error: message };
  }
}

/**
 * Instant demo rescue generator for immediate live testing
 */
export async function seedDemoRescues() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return { success: false, error: 'Demo seeding is disabled outside demo mode.' };
  }
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const donations = await ngoFleetService.seedDemoRescuesForNgo(session.userId);
    revalidatePath('/ngo/volunteers');
    revalidatePath('/ngo/active');
    revalidatePath('/ngo');
    return { success: true, count: donations.length };
  } catch (error) {
    console.error('Error seeding demo rescues:', error);
    const message = error instanceof Error ? error.message : 'Failed to seed demo rescues.';
    return { success: false, error: message };
  }
}

/**
 * Live polling endpoint data for real-time dynamic dashboard updates
 */
export async function getNgoLiveMonitoringFeed() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }

  return ngoFleetService.getLiveMonitoringFeed(session.userId);
}
