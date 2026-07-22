'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { NgoAvailability } from '@prisma/client';

import { haversineDistance } from '@/lib/geo';

// CO2 and Water impact factors (from FAO guidelines in the report)
const IMPACT_FACTORS: Record<string, { co2: number; water: number }> = {
  'grains': { co2: 1.2, water: 2500 },
  'vegetables': { co2: 0.5, water: 300 },
  'fruits': { co2: 0.7, water: 900 },
  'dairy': { co2: 3.2, water: 1000 },
  'meat': { co2: 7.0, water: 15000 },
  'mixed': { co2: 2.5, water: 1500 }, // Default average for prepared meals
};

function isFoodTypeMatching(donation: any, acceptedTypesStr: string): boolean {
  if (!acceptedTypesStr) return false;
  const acceptedTypes = acceptedTypesStr.split(',').map(t => t.trim());
  
  const category = donation.foodCategory.toLowerCase(); // mixed, grains, vegetables, fruits, dairy, meat
  const dietary = donation.vegNonVegMixed; // VEG, NON_VEG, MIXED

  if (category === 'mixed') {
    if (dietary === 'VEG') {
      return acceptedTypes.includes('COOKED_VEG');
    } else {
      return acceptedTypes.includes('COOKED_NON_VEG');
    }
  }
  
  if (category === 'grains') {
    return acceptedTypes.includes('DRY_RATION') || acceptedTypes.includes('PACKAGED_FOOD');
  }
  
  if (category === 'vegetables' || category === 'fruits') {
    return acceptedTypes.includes('FRUITS_VEG');
  }
  
  if (category === 'dairy') {
    return acceptedTypes.includes('PACKAGED_FOOD') || acceptedTypes.includes('COOKED_VEG') || acceptedTypes.includes('COOKED_NON_VEG');
  }
  
  if (category === 'meat') {
    return acceptedTypes.includes('COOKED_NON_VEG');
  }

  return false;
}

export async function createDonation(formData: any) {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    return { success: false, error: 'Unauthorized. Only Donors can create donations.' };
  }

  const {
    title,
    description,
    foodCategory,
    vegNonVegMixed,
    quantity,
    quantityUnit,
    estimatedServings,
    preparationTime,
    pickupAvailableAt,
    pickupDeadlineAt,
    pickupAddress,
    pickupLatitude,
    pickupLongitude,
    specialNotes,
  } = formData;

  try {
    const donor = await prisma.donorProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!donor) {
      return { success: false, error: 'Donor profile not found.' };
    }

    const donation = await prisma.donation.create({
      data: {
        donorId: donor.id,
        title,
        description,
        foodCategory,
        vegNonVegMixed,
        quantity,
        quantityUnit,
        estimatedServings: parseInt(estimatedServings) || null,
        preparationTime: preparationTime ? new Date(preparationTime) : null,
        pickupAvailableAt: new Date(pickupAvailableAt),
        pickupDeadlineAt: new Date(pickupDeadlineAt),
        pickupAddress,
        pickupLatitude: parseFloat(pickupLatitude),
        pickupLongitude: parseFloat(pickupLongitude),
        specialNotes,
        status: 'AVAILABLE',
      },
    });

    // Create initial status history entry
    await prisma.donationStatusHistory.create({
      data: {
        donationId: donation.id,
        previousStatus: 'AVAILABLE',
        newStatus: 'AVAILABLE',
        changedBy: session.userId,
        reason: 'Donation created',
      },
    });

    // Notify nearby verified & available NGOs
    const verifiedNgos = await prisma.nGOProfile.findMany({
      where: {
        status: 'VERIFIED',
        availability: 'AVAILABLE',
      },
    });

    const lat = parseFloat(pickupLatitude);
    const lng = parseFloat(pickupLongitude);

    const notificationsToCreate = [];
    for (const ngo of verifiedNgos) {
      // 1. Quick bounding box pre-filter
      const latChange = ngo.serviceRadiusKm / 111.0;
      const lngChange = ngo.serviceRadiusKm / (111.0 * Math.cos((ngo.baseLatitude * Math.PI) / 180));
      const minLat = ngo.baseLatitude - latChange;
      const maxLat = ngo.baseLatitude + latChange;
      const minLng = ngo.baseLongitude - lngChange;
      const maxLng = ngo.baseLongitude + lngChange;

      if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
        continue; // skip if outside bounding box
      }

      // 2. Exact Haversine distance check
      const distance = haversineDistance(lat, lng, ngo.baseLatitude, ngo.baseLongitude);
      if (distance <= ngo.serviceRadiusKm) {
        // 3. Accepted Food Category check
        if (isFoodTypeMatching(donation, ngo.acceptedFoodTypes)) {
          notificationsToCreate.push({
            userId: ngo.userId,
            type: 'NEW_DONATION',
            title: 'New Donation Nearby',
            message: `A new donation "${title}" is available within your service radius (${distance.toFixed(1)} km away).`,
            relatedDonationId: donation.id,
            relatedNgoId: ngo.id,
          });
        }
      }
    }

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate,
      });
    }

    revalidatePath('/donor');
    return { success: true, donationId: donation.id };
  } catch (error: any) {
    console.error('Create donation error:', error);
    return { success: false, error: error.message || 'Failed to create donation.' };
  }
}

export async function getDonorDonations() {
  const session = await getSession();
  if (!session || session.role !== 'DONOR') {
    throw new Error('Unauthorized');
  }

  const donor = await prisma.donorProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!donor) throw new Error('Donor profile not found');

  return prisma.donation.findMany({
    where: { donorId: donor.id },
    orderBy: { createdAt: 'desc' },
    include: {
      acceptedNgo: true,
      assignment: {
        include: {
          volunteer: true,
        },
      },
    },
  });
}

export async function getNearbyAvailableDonations() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }

  const ngo = await prisma.nGOProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!ngo) throw new Error('NGO profile not found');
  if (ngo.status !== 'VERIFIED' || ngo.availability !== 'AVAILABLE') {
    return []; // Return empty if not verified or currently offline/busy
  }

  // Bounding Box Optimization
  const latChange = ngo.serviceRadiusKm / 111.0;
  const lngChange = ngo.serviceRadiusKm / (111.0 * Math.cos((ngo.baseLatitude * Math.PI) / 180));
  const minLat = ngo.baseLatitude - latChange;
  const maxLat = ngo.baseLatitude + latChange;
  const minLng = ngo.baseLongitude - lngChange;
  const maxLng = ngo.baseLongitude + lngChange;

  // Fetch available donations within the bounding box that haven't expired
  const availableDonations = await prisma.donation.findMany({
    where: {
      status: 'AVAILABLE',
      pickupDeadlineAt: { gt: new Date() },
      pickupLatitude: { gte: minLat, lte: maxLat },
      pickupLongitude: { gte: minLng, lte: maxLng },
    },
    include: {
      donor: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter based on food category match and exact Haversine distance
  return availableDonations
    .filter((donation) => isFoodTypeMatching(donation, ngo.acceptedFoodTypes))
    .map((donation) => {
      const distance = haversineDistance(
        donation.pickupLatitude,
        donation.pickupLongitude,
        ngo.baseLatitude,
        ngo.baseLongitude
      );
      return { ...donation, distance };
    })
    .filter((d) => d.distance <= ngo.serviceRadiusKm)
    .sort((a, b) => a.distance - b.distance);
}

// NGO accepts donation - CRITICAL ATOMIC LOCKING IMPLEMENTATION
export async function acceptDonation(donationId: string) {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    return { success: false, error: 'Unauthorized. Only NGOs can accept donations.' };
  }

  const ngo = await prisma.nGOProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!ngo) {
    return { success: false, error: 'NGO profile not found.' };
  }

  if (ngo.status !== 'VERIFIED') {
    return { success: false, error: 'NGO account is not verified. You cannot accept donations.' };
  }

  try {
    // Execute a Prisma interactive transaction.
    // In SQLite, the transaction takes a database write lock, preventing race conditions.
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Read the donation status.
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) {
        throw new Error('DONATION_NOT_FOUND');
      }

      // Step 2: Check availability. If already claimed, abort.
      if (donation.status !== 'AVAILABLE') {
        throw new Error('DONATION_ALREADY_ACCEPTED');
      }

      // Check if expired
      if (new Date() > donation.pickupDeadlineAt) {
        throw new Error('DONATION_EXPIRED');
      }

      // Double check distance bounds
      const distance = haversineDistance(
        donation.pickupLatitude,
        donation.pickupLongitude,
        ngo.baseLatitude,
        ngo.baseLongitude
      );

      if (distance > ngo.serviceRadiusKm) {
        throw new Error('DONATION_OUT_OF_RANGE');
      }

      // Step 3: Mutate status atomically.
      const updatedDonation = await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'ACCEPTED',
          acceptedNgoId: ngo.id,
        },
      });

      // Step 4: Write status history.
      await tx.donationStatusHistory.create({
        data: {
          donationId: donation.id,
          previousStatus: 'AVAILABLE',
          newStatus: 'ACCEPTED',
          changedBy: session.userId,
          reason: 'Donation accepted by NGO',
        },
      });

      // Step 5: Write audit log.
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'ACCEPT_DONATION',
          entityType: 'Donation',
          entityId: donationId,
          newValues: JSON.stringify({ status: 'ACCEPTED', acceptedNgoId: ngo.id }),
        },
      });

      return updatedDonation;
    });

    revalidatePath('/ngo');
    return { success: true, donation: result };
  } catch (error: any) {
    console.error('Accept donation error:', error.message);
    if (error.message === 'DONATION_ALREADY_ACCEPTED') {
      return { success: false, error: 'This donation has already been accepted by another NGO.' };
    }
    if (error.message === 'DONATION_EXPIRED') {
      return { success: false, error: 'This donation has expired and can no longer be accepted.' };
    }
    if (error.message === 'DONATION_OUT_OF_RANGE') {
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

  const ngo = await prisma.nGOProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!ngo) throw new Error('NGO profile not found');

  return prisma.donation.findMany({
    where: {
      acceptedNgoId: ngo.id,
      status: {
        in: [
          'ACCEPTED',
          'VOLUNTEER_ASSIGNED',
          'PICKUP_IN_PROGRESS',
          'PICKED_UP',
          'DELIVERY_IN_PROGRESS',
          'DELIVERED',
        ],
      },
    },
    include: {
      donor: true,
      assignment: {
        include: {
          volunteer: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getNgoHistory() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }

  const ngo = await prisma.nGOProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!ngo) throw new Error('NGO profile not found');

  return prisma.donation.findMany({
    where: {
      acceptedNgoId: ngo.id,
      status: {
        in: ['COMPLETED', 'CANCELLED'],
      },
    },
    include: {
      donor: true,
      assignment: {
        include: {
          volunteer: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

// Assign volunteer to an accepted donation
export async function assignVolunteer(donationId: string, volunteerId: string) {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    return { success: false, error: 'Unauthorized. Only NGOs can assign volunteers.' };
  }

  const ngo = await prisma.nGOProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!ngo) throw new Error('NGO profile not found');

  try {
    await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation || donation.acceptedNgoId !== ngo.id) {
        throw new Error('Donation not owned by this NGO');
      }

      if (donation.status !== 'ACCEPTED' && donation.status !== 'VOLUNTEER_ASSIGNED') {
        throw new Error('Donation is not in a assignable state');
      }

      // If there's an existing assignment, delete or cancel it
      await tx.volunteerAssignment.deleteMany({
        where: { donationId },
      });

      // Create new assignment record
      await tx.volunteerAssignment.create({
        data: {
          donationId,
          volunteerId,
          ngoId: ngo.id,
          status: 'ASSIGNED',
        },
      });

      // Update donation status
      await tx.donation.update({
        where: { id: donationId },
        data: { status: 'VOLUNTEER_ASSIGNED' },
      });

      // Create history record
      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: donation.status,
          newStatus: 'VOLUNTEER_ASSIGNED',
          changedBy: session.userId,
          reason: `Assigned volunteer to rescue`,
        },
      });
    });

    revalidatePath('/ngo');
    return { success: true };
  } catch (error: any) {
    console.error('Assign volunteer error:', error);
    return { success: false, error: error.message || 'Failed to assign volunteer.' };
  }
}

// Get active assignments for a volunteer
export async function getVolunteerAssignments() {
  const session = await getSession();
  if (!session || session.role !== 'VOLUNTEER') {
    throw new Error('Unauthorized');
  }

  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: session.userId },
  });

  if (!volunteer) throw new Error('Volunteer profile not found');

  return prisma.volunteerAssignment.findMany({
    where: {
      volunteerId: volunteer.id,
      status: {
        in: ['ASSIGNED', 'STARTED', 'ARRIVED'],
      },
    },
    include: {
      donation: {
        include: {
          donor: true,
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });
}

// Update assignment and donation state through the state machine
export async function updateAssignmentStatus(assignmentId: string, action: string) {
  const session = await getSession();
  if (!session || (session.role !== 'VOLUNTEER' && session.role !== 'NGO')) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.volunteerAssignment.findUnique({
        where: { id: assignmentId },
        include: { donation: true },
      });

      if (!assignment) throw new Error('Assignment not found');

      let nextAssignmentStatus = assignment.status;
      let nextDonationStatus = assignment.donation.status;
      const updates: any = {};
      const donationUpdates: any = {};

      if (action === 'START_PICKUP') {
        if (assignment.status !== 'ASSIGNED') throw new Error('Invalid state transition');
        nextAssignmentStatus = 'STARTED';
        nextDonationStatus = 'PICKUP_IN_PROGRESS';
        updates.startedAt = new Date();
      } else if (action === 'ARRIVE_AT_DONOR') {
        if (assignment.status !== 'STARTED') throw new Error('Invalid state transition');
        nextAssignmentStatus = 'ARRIVED';
        updates.arrivedAt = new Date();
      } else if (action === 'CONFIRM_PICKUP') {
        if (assignment.status !== 'ARRIVED') throw new Error('Invalid state transition');
        nextAssignmentStatus = 'ARRIVED'; // remain arrived in assignment status, or set custom
        nextDonationStatus = 'PICKED_UP';
        updates.pickupConfirmedAt = new Date();
      } else if (action === 'START_DELIVERY') {
        if (assignment.donation.status !== 'PICKED_UP') throw new Error('Invalid state transition');
        nextDonationStatus = 'DELIVERY_IN_PROGRESS';
        updates.deliveryStartedAt = new Date();
      } else if (action === 'CONFIRM_DELIVERY') {
        if (assignment.donation.status !== 'DELIVERY_IN_PROGRESS') throw new Error('Invalid state transition');
        nextAssignmentStatus = 'COMPLETED';
        nextDonationStatus = 'COMPLETED';
        updates.deliveryConfirmedAt = new Date();

        // Calculate impact metrics upon completion
        const weightKg = parseFloat(assignment.donation.quantity) || 10.0; // fallback if text isn't a clean number
        const category = assignment.donation.foodCategory.toLowerCase();
        const factor = IMPACT_FACTORS[category] || IMPACT_FACTORS['mixed'];

        const co2Saved = weightKg * factor.co2;
        const waterSaved = weightKg * factor.water;
        const servings = assignment.donation.estimatedServings || Math.round(weightKg / 0.3); // 300g per serving

        await tx.impactRecord.create({
          data: {
            donationId: assignment.donationId,
            foodWeightKg: weightKg,
            estimatedServings: servings,
            co2EquivalentKg: co2Saved,
            waterSavedLiters: waterSaved,
            calculationMethod: 'FAO_FACTORS_2026',
            factorsUsed: `${category}: co2=${factor.co2}, water=${factor.water}`,
          },
        });
      } else {
        throw new Error('Unknown action');
      }

      // Update assignment
      await tx.volunteerAssignment.update({
        where: { id: assignmentId },
        data: {
          status: nextAssignmentStatus,
          ...updates,
        },
      });

      // Update donation
      await tx.donation.update({
        where: { id: assignment.donationId },
        data: {
          status: nextDonationStatus,
          ...donationUpdates,
        },
      });

      // Write history
      await tx.donationStatusHistory.create({
        data: {
          donationId: assignment.donationId,
          previousStatus: assignment.donation.status,
          newStatus: nextDonationStatus,
          changedBy: session.userId,
          reason: `Volunteer performed action: ${action}`,
        },
      });

      return { nextDonationStatus };
    });

    revalidatePath('/volunteer');
    revalidatePath('/ngo');
    return { success: true, status: result.nextDonationStatus };
  } catch (error: any) {
    console.error('Update assignment status error:', error);
    return { success: false, error: error.message || 'Failed to update status.' };
  }
}

export async function divertDonationToBiogas(donationId: string, reason: string) {
  const session = await getSession();
  if (!session || (session.role !== 'NGO' && session.role !== 'ADMIN')) {
    return { success: false, error: 'Unauthorized. Only NGOs or Admins can divert donations.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
        include: { acceptedNgo: true },
      });

      if (!donation) throw new Error('Donation not found');

      // If the caller is an NGO, make sure they are the accepted NGO for this donation
      if (session.role === 'NGO') {
        const ngo = await tx.nGOProfile.findUnique({
          where: { userId: session.userId },
        });
        if (!ngo || donation.acceptedNgoId !== ngo.id) {
          throw new Error('This donation is not assigned to your NGO.');
        }
      }

      // Check if it's already completed or cancelled
      if (donation.status === 'COMPLETED' || donation.status === 'CANCELLED' || donation.status === 'EXPIRED') {
        throw new Error(`Cannot divert a donation with status ${donation.status}`);
      }

      // Parse quantity to get weight in kg
      const parsedWeight = parseFloat(donation.quantity.replace(/[^\d.]/g, ''));
      const weightKg = isNaN(parsedWeight) || parsedWeight <= 0 ? 10.0 : parsedWeight;

      // Update donation status to EXPIRED (representing recovery)
      await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'EXPIRED',
          cancelledAt: new Date(),
          cancelledBy: session.userId,
          cancelReason: `Spoiled / Diverted to Biogas Recovery: ${reason}`,
        },
      });

      // Write status history
      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: donation.status,
          newStatus: 'EXPIRED',
          changedBy: session.userId,
          reason: `Diverted to Biogas Recovery: ${reason}`,
        },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'DIVERT_TO_BIOGAS',
          entityType: 'Donation',
          entityId: donationId,
          newValues: JSON.stringify({ status: 'EXPIRED', cancelReason: `Spoiled / Diverted to Biogas Recovery: ${reason}` }),
        },
      });

      // Create ImpactRecord for recovery
      // CO2 avoided factor = 1.8 kg CO2 per kg food waste diverted to biogas (avoided landfill methane + replacement energy)
      const co2EquivalentKg = weightKg * 1.8;

      await tx.impactRecord.create({
        data: {
          donationId,
          foodWeightKg: weightKg,
          estimatedServings: 0, // 0 servings since it is diverted to recovery
          co2EquivalentKg,
          waterSavedLiters: 0, // no water saved because it is not consumed
          calculationMethod: 'BIOGAS_RECOVERY_2026',
          factorsUsed: `biogas_recovery: co2=1.8, water=0, yield=0.25kwh/kg`,
        },
      });

      return { success: true };
    });

    revalidatePath('/ngo');
    revalidatePath('/ngo/active');
    revalidatePath('/admin');
    revalidatePath('/admin/data');
    revalidatePath('/donor');
    return { success: true };
  } catch (error: any) {
    console.error('Divert donation to biogas error:', error);
    return { success: false, error: error.message || 'Failed to divert donation to biogas.' };
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
    const ngo = await prisma.nGOProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!ngo) {
      return { success: false, error: 'NGO profile not found.' };
    }

    const currentAvailability = ngo.availability;
    const newAvailability = data.availability;
    const isAvailabilityChanged = currentAvailability !== newAvailability;

    await prisma.nGOProfile.update({
      where: { userId: session.userId },
      data: {
        baseAddress: data.baseAddress,
        baseLatitude: data.baseLatitude,
        baseLongitude: data.baseLongitude,
        serviceRadiusKm: data.serviceRadiusKm,
        availability: newAvailability,
        availabilityUpdatedAt: isAvailabilityChanged ? new Date() : ngo.availabilityUpdatedAt,
        acceptedFoodTypes: data.acceptedFoodTypes.join(','),
      },
    });

    revalidatePath('/ngo');
    return { success: true };
  } catch (error: any) {
    console.error('Update NGO settings error:', error);
    return { success: false, error: error.message || 'Failed to update settings.' };
  }
}

