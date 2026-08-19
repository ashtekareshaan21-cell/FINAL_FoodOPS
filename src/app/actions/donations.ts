'use server';

import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { NgoAvailability } from '@prisma/client';
import { donationService } from '@/services/donationService';
import { matchingService } from '@/services/matchingService';
import { matchingDiagnosticsService } from '@/services/matchingDiagnosticsService';
import { prisma } from '@/lib/db';
import { donorRepository } from '@/repositories/donorRepository';
import { aiListingAuditService } from '@/services/aiListingAuditService';

export interface CreateDonationInput {
  title: string;
  description: string;
  foodCategory: string;
  vegNonVegMixed: string;
  quantity: string;
  quantityUnit: string;
  estimatedServings?: string | number | null;
  preparationTime?: string | Date | null;
  pickupAvailableAt: string | Date;
  pickupDeadlineAt: string | Date;
  pickupAddress: string;
  pickupLatitude: string | number;
  pickupLongitude: string | number;
  specialNotes?: string | null;
  auditId?: string | null;
}

function validateDateTimeTimezone(name: string, val: string | Date | null | undefined) {
  if (!val) return;
  if (typeof val === 'string') {
    // Check if it ends with 'Z' or has a timezone offset like +05:30 or -08:00
    const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(val);
    if (!hasTz) {
      throw new Error(`Incoming datetime parameter "${name}" must have an explicit timezone offset or Z suffix. Got: "${val}"`);
    }
  }
}

export async function analyzeListingAction(base64Image: string, mimeType: string) {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    return { success: false, error: 'Unauthorized. Only Donors can perform audits.' };
  }

  try {
    const donor = await donorRepository.findByUserId(session.userId);
    if (!donor) {
      return { success: false, error: 'Donor profile not found.' };
    }

    const audit = await aiListingAuditService.runAudit(base64Image, mimeType, donor.id);
    return { success: true, auditId: audit.id, audit };
  } catch (error) {
    console.error('analyzeListingAction error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze listing image.';
    return { success: false, error: message };
  }
}

export async function createDonation(formData: CreateDonationInput) {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    return { success: false, error: 'Unauthorized. Only Donors can create donations.' };
  }

  try {
    validateDateTimeTimezone('pickupAvailableAt', formData.pickupAvailableAt);
    validateDateTimeTimezone('pickupDeadlineAt', formData.pickupDeadlineAt);
    validateDateTimeTimezone('preparationTime', formData.preparationTime);

    const donation = await donationService.createDonation(session.userId, formData);
    revalidatePath('/donor');
    return { success: true, donationId: donation.id };
  } catch (error) {
    console.error('Create donation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create donation.';
    return { success: false, error: message };
  }
}

export async function getDonorDonations() {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    throw new Error('Unauthorized');
  }
  return donationService.getDonorDonations(session.userId);
}

export async function getNearbyAvailableDonations() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }
  return matchingService.getNearbyAvailableDonations(session.userId);
}

export async function getNearbyDonationsDiagnostics() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }
  return matchingService.getNearbyDonationsDiagnostics(session.userId);
}

export async function acceptDonation(donationId: string) {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    return { success: false, error: 'Unauthorized. Only NGOs can accept donations.' };
  }

  try {
    const donation = await donationService.acceptDonation(session.userId, donationId);
    revalidatePath('/ngo');
    return { success: true, donation };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('Accept donation error:', message);
    if (message === 'DONATION_ALREADY_ACCEPTED') {
      return { success: false, error: 'This donation has already been accepted by another NGO.' };
    }
    if (message === 'DONATION_EXPIRED') {
      return { success: false, error: 'This donation has expired and can no longer be accepted.' };
    }
    if (message === 'DONATION_OUT_OF_RANGE') {
      return { success: false, error: 'This donation is outside your service radius.' };
    }
    return { success: false, error: 'Acceptance failed. Please try again.' };
  }
}


export async function getNgoAcceptedDonations() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }
  return donationService.getNgoAcceptedDonations(session.userId);
}

export async function getNgoHistory() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }
  return donationService.getNgoHistory(session.userId);
}

export async function assignVolunteer(donationId: string, volunteerId: string) {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    return { success: false, error: 'Unauthorized. Only NGOs can assign volunteers.' };
  }

  try {
    await donationService.assignVolunteer(session.userId, donationId, volunteerId);
    revalidatePath('/ngo');
    return { success: true };
  } catch (error) {
    console.error('Assign volunteer error:', error);
    const message = error instanceof Error ? error.message : 'Failed to assign volunteer.';
    return { success: false, error: message };
  }
}

export async function getVolunteerAssignments() {
  const session = await getSession();
  if (!session || session.role !== 'VOLUNTEER') {
    throw new Error('Unauthorized');
  }
  return donationService.getVolunteerAssignments(session.userId);
}

export async function updateAssignmentStatus(assignmentId: string, action: string, otp?: string) {
  const session = await getSession();
  if (!session || (session.role !== 'VOLUNTEER' && session.role !== 'NGO')) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const nextDonationStatus = await donationService.updateAssignmentStatus(session.userId, assignmentId, action, otp);
    revalidatePath('/volunteer');
    revalidatePath('/ngo');
    return { success: true, status: nextDonationStatus };
  } catch (error) {
    console.error('Update assignment status error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update status.';
    return { success: false, error: message };
  }
}

export async function divertDonationToBiogas(donationId: string, reason: string) {
  const session = await getSession();
  if (!session || (session.role !== 'NGO' && session.role !== 'ADMIN')) {
    return { success: false, error: 'Unauthorized. Only NGOs or Admins can divert donations.' };
  }

  try {
    await donationService.divertDonationToBiogas(session.userId, donationId, reason);
    revalidatePath('/ngo');
    revalidatePath('/ngo/active');
    revalidatePath('/admin');
    revalidatePath('/admin/data');
    revalidatePath('/donor');
    return { success: true };
  } catch (error) {
    console.error('Divert donation to biogas error:', error);
    const message = error instanceof Error ? error.message : 'Failed to divert donation to biogas.';
    return { success: false, error: message };
  }
}

export async function updateNgoSettings(data: {
  baseAddress: string;
  baseLatitude: number;
  baseLongitude: number;
  serviceRadiusKm: number;
  availability: NgoAvailability;
  acceptedFoodTypes: string[];
}) {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    return { success: false, error: 'Unauthorized. Only NGOs can modify settings.' };
  }

  try {
    await donationService.updateNgoSettings(session.userId, data);
    revalidatePath('/ngo');
    return { success: true };
  } catch (error) {
    console.error('Update NGO settings error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update settings.';
    return { success: false, error: message };
  }
}

export async function getDonationMatchDiagnostics(donationId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  // Authorization checks
  if (session.role !== 'ADMIN') {
    if (session.role === 'DONOR') {
      const donation = await prisma.donation.findUnique({
        where: { id: donationId },
        include: { donor: true },
      });
      if (!donation || donation.donor.userId !== session.userId) {
        return { success: false, error: 'Unauthorized. You do not own this donation.' };
      }
    } else {
      return { success: false, error: 'Unauthorized' };
    }
  }

  try {
    const diagnostics = await matchingDiagnosticsService.traceDonationMatches(donationId);
    return { success: true, diagnostics };
  } catch (error) {
    console.error('Get donation match diagnostics error:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve diagnostics.';
    return { success: false, error: message };
  }
}

export async function escalateDonation(donationId: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Only Admins can escalate recovery.' };
  }

  try {
    await donationService.escalateDonation(session.userId, donationId);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Escalate donation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to escalate donation.';
    return { success: false, error: message };
  }
}

export async function resolveOrganicDonation(donationId: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Only Admins can resolve organic recovery.' };
  }

  try {
    await donationService.resolveOrganicDonation(session.userId, donationId);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Resolve organic recovery error:', error);
    const message = error instanceof Error ? error.message : 'Failed to resolve organic recovery.';
    return { success: false, error: message };
  }
}

export async function generatePickupOtp(assignmentId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const result = await donationService.generatePickupOtp(session.userId, assignmentId);
    revalidatePath('/volunteer');
    revalidatePath('/donor');
    return result;
  } catch (error) {
    console.error('Generate OTP error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate OTP.';
    return { success: false, error: message };
  }
}
