import { donationRepository } from '@/repositories/donationRepository';
import { ngoRepository } from '@/repositories/ngoRepository';
import { donorRepository } from '@/repositories/donorRepository';
import { volunteerRepository } from '@/repositories/volunteerRepository';
import { emailService } from './emailService';
import { prisma } from '@/lib/db';
import { NgoAvailability, Prisma } from '@prisma/client';
import { CreateDonationInput } from '@/app/actions/donations';
import { normalizeFoodCategory, matchingService } from './matchingService';
import { auditService } from './auditService';
import { validateStateTransition, DonationOperation } from './donationStateMachine';

const IMPACT_FACTORS: Record<string, { co2: number; water: number }> = {
  'grains': { co2: 1.2, water: 2500 },
  'vegetables': { co2: 0.5, water: 300 },
  'fruits': { co2: 0.7, water: 900 },
  'dairy': { co2: 3.2, water: 1000 },
  'meat': { co2: 7.0, water: 15000 },
  'bakery': { co2: 1.5, water: 1200 },
  'mixed': { co2: 2.5, water: 1500 },
};

export const donationService = {
  async createDonation(userId: string, input: CreateDonationInput) {
    const donor = await donorRepository.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found.');

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
    } = input;

    const parsedLat = typeof pickupLatitude === 'string' ? parseFloat(pickupLatitude) : pickupLatitude;
    const parsedLng = typeof pickupLongitude === 'string' ? parseFloat(pickupLongitude) : pickupLongitude;

    const normalizedCategory = normalizeFoodCategory(foodCategory);
    const validCategories = ['mixed', 'grains', 'bakery', 'vegetables', 'fruits', 'dairy', 'meat'];
    if (!validCategories.includes(normalizedCategory)) {
      throw new Error(`Invalid food category: "${foodCategory}". Normalized: "${normalizedCategory}"`);
    }

    const donation = await prisma.$transaction(async (tx) => {
      const newDonation = await tx.donation.create({
        data: {
          donorId: donor.id,
          title,
          description,
          foodCategory: normalizedCategory,
          vegNonVegMixed,
          quantity,
          quantityUnit,
          estimatedServings: typeof estimatedServings === 'string' ? parseInt(estimatedServings) || null : estimatedServings || null,
          preparationTime: preparationTime ? new Date(preparationTime) : null,
          pickupAvailableAt: new Date(pickupAvailableAt),
          pickupDeadlineAt: new Date(pickupDeadlineAt),
          pickupAddress,
          pickupLatitude: parsedLat,
          pickupLongitude: parsedLng,
          specialNotes,
          status: 'AVAILABLE',
        },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId: newDonation.id,
          previousStatus: 'AVAILABLE',
          newStatus: 'AVAILABLE',
          changedBy: userId,
          reason: 'Donation created',
        },
      });

      await auditService.log(tx, {
        userId,
        role: 'DONOR',
        action: 'DONATION_CREATED',
        entityType: 'Donation',
        entityId: newDonation.id,
        newValues: { status: 'AVAILABLE', title: newDonation.title },
      });

      return newDonation;
    });

    // Notify eligible verified NGOs
    const ngos = await ngoRepository.findMany({
      where: {
        status: 'VERIFIED',
        NOT: { availability: 'OFFLINE' },
      },
    });

    const notifications: Prisma.NotificationCreateManyInput[] = [];

    for (const ngo of ngos) {
      const matchRes = matchingService.matchDonationToNgo(donation, ngo);

      if (matchRes.result) {
        notifications.push({
          userId: ngo.userId,
          type: 'NEW_DONATION',
          title: 'New Donation Nearby',
          message: `A new donation "${title}" is available within your service radius (${matchRes.distanceKm.toFixed(1)} km away).`,
          relatedDonationId: donation.id,
          relatedNgoId: ngo.id,
        });
      }
    }

    if (notifications.length > 0) {
      await donationRepository.createManyNotifications(notifications);
    }

    return donation;
  },

  async getDonorDonations(userId: string) {
    const donor = await donorRepository.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');

    return donationRepository.findMany({
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
  },

  async getNearbyAvailableDonations(userId: string) {
    return matchingService.getNearbyAvailableDonations(userId);
  },

  async acceptDonation(userId: string, donationId: string) {
    const ngo = await ngoRepository.findByUserId(userId);
    if (!ngo) throw new Error('NGO profile not found.');
    if (ngo.status !== 'VERIFIED') {
      throw new Error('NGO account is not verified.');
    }
    if (ngo.availability === 'OFFLINE') {
      throw new Error('NGO is offline.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
        include: {
          donor: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!donation) throw new Error('DONATION_NOT_FOUND');

      const matchRes = matchingService.matchDonationToNgo(donation, ngo);
      if (!matchRes.checks.statusPassed) {
        throw new Error('DONATION_ALREADY_ACCEPTED');
      }
      if (!matchRes.checks.expiryPassed) {
        throw new Error('DONATION_EXPIRED');
      }
      if (!matchRes.checks.distancePassed) {
        throw new Error('DONATION_OUT_OF_RANGE');
      }
      if (!matchRes.result) {
        throw new Error(`DONATION_NOT_MATCHED: ${matchRes.reasons.join(', ')}`);
      }

      // Validate state transition through machine
      validateStateTransition(donation.status, 'ACCEPTED', 'CLAIM', {
        actorRole: 'NGO',
        actorId: userId,
        isOwner: false,
      });

      // Atomic conditional update
      const affected = await tx.donation.updateMany({
        where: {
          id: donationId,
          status: 'AVAILABLE',
        },
        data: {
          status: 'ACCEPTED',
          acceptedNgoId: ngo.id,
        },
      });

      if (affected.count === 0) {
        throw new Error('DONATION_ALREADY_ACCEPTED');
      }

      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: 'AVAILABLE',
          newStatus: 'ACCEPTED',
          changedBy: userId,
          reason: 'NGO accepted donation',
        },
      });

      await auditService.log(tx, {
        userId,
        role: 'NGO',
        action: 'DONATION_CLAIMED',
        entityType: 'Donation',
        entityId: donationId,
        previousValues: { status: 'AVAILABLE' },
        newValues: { status: 'ACCEPTED', acceptedNgoId: ngo.id },
      });

      return { updated: { ...donation, status: 'ACCEPTED' as const, acceptedNgoId: ngo.id }, donorEmail: donation.donor.user.email, title: donation.title };
    });

    // Notify Donor by Email
    if (result.donorEmail) {
      await emailService.sendDonationAcceptedEmail(result.donorEmail, result.title, ngo.organizationName);
    }

    return result.updated;
  },

  async getNgoAcceptedDonations(userId: string) {
    const ngo = await ngoRepository.findByUserId(userId);
    if (!ngo) throw new Error('NGO profile not found');

    return donationRepository.findMany({
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
  },

  async getNgoHistory(userId: string) {
    const ngo = await ngoRepository.findByUserId(userId);
    if (!ngo) throw new Error('NGO profile not found');

    return donationRepository.findMany({
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
  },

  async assignVolunteer(userId: string, donationId: string, volunteerId: string) {
    const ngo = await ngoRepository.findByUserId(userId);
    if (!ngo) throw new Error('NGO profile not found');

    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
        include: {
          donor: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!donation || donation.acceptedNgoId !== ngo.id) {
        throw new Error('Donation not owned by this NGO');
      }

      const volunteer = await tx.volunteer.findUnique({
        where: { id: volunteerId },
      });

      if (!volunteer) throw new Error('Volunteer not found');
      if (volunteer.ngoId !== ngo.id) {
        throw new Error('Volunteer does not belong to this NGO');
      }

      validateStateTransition(donation.status, 'VOLUNTEER_ASSIGNED', 'ASSIGN_VOLUNTEER', {
        actorRole: 'NGO',
        actorId: userId,
        isOwner: donation.acceptedNgoId === ngo.id,
      });

      await tx.volunteerAssignment.deleteMany({
        where: { donationId },
      });

      await tx.volunteerAssignment.create({
        data: {
          donationId,
          volunteerId,
          ngoId: ngo.id,
          status: 'ASSIGNED',
        },
      });

      await tx.donation.update({
        where: { id: donationId },
        data: { status: 'VOLUNTEER_ASSIGNED' },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: donation.status,
          newStatus: 'VOLUNTEER_ASSIGNED',
          changedBy: userId,
          reason: `Assigned volunteer to rescue`,
        },
      });

      await auditService.log(tx, {
        userId,
        role: 'NGO',
        action: 'VOLUNTEER_ASSIGNED',
        entityType: 'Donation',
        entityId: donationId,
        previousValues: { status: donation.status },
        newValues: { status: 'VOLUNTEER_ASSIGNED', volunteerId },
      });

      return { volunteerName: volunteer.name, donorEmail: donation.donor.user.email, title: donation.title };
    });

    if (result.donorEmail) {
      await emailService.sendVolunteerAssignedEmail(result.donorEmail, result.title, result.volunteerName);
    }

    return true;
  },

  async getVolunteerAssignments(userId: string) {
    const volunteer = await volunteerRepository.findByUserId(userId);
    if (!volunteer) throw new Error('Volunteer profile not found');

    return volunteerRepository.findManyAssignments({
      where: {
        volunteerId: volunteer.id,
        status: {
          in: ['ASSIGNED', 'STARTED', 'ARRIVED'],
        },
      },
      include: {
        donation: {
          include: {
            donor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  },

  async updateAssignmentStatus(userId: string, assignmentId: string, action: string) {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const assignment = await tx.volunteerAssignment.findUnique({
        where: { id: assignmentId },
        include: { 
          volunteer: true,
          ngo: true,
          donation: {
            include: {
              donor: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!assignment) throw new Error('Assignment not found');

      // Ownership and affiliation control
      let isOwner = false;
      if (user.role === 'VOLUNTEER') {
        isOwner = assignment.volunteer.userId === userId;
      } else if (user.role === 'NGO') {
        isOwner = assignment.ngo.userId === userId;
      }
      if (!isOwner && user.role !== 'ADMIN') {
        throw new Error('UNAUTHORIZED_OWNER');
      }

      let nextAssignmentStatus = assignment.status;
      let nextDonationStatus = assignment.donation.status;
      let operation: DonationOperation | null = null;
      let auditAction = '';

      const updates: Prisma.VolunteerAssignmentUpdateInput = {};
      const donationUpdates: Prisma.DonationUpdateInput = {};
      let isCompleted = false;

      if (action === 'START_PICKUP') {
        operation = 'START_PICKUP';
        nextAssignmentStatus = 'STARTED';
        nextDonationStatus = 'PICKUP_IN_PROGRESS';
        updates.startedAt = new Date();
        auditAction = 'PICKUP_STARTED';
      } else if (action === 'ARRIVE_AT_DONOR') {
        if (assignment.status !== 'STARTED') throw new Error('Invalid state transition');
        nextAssignmentStatus = 'ARRIVED';
        updates.arrivedAt = new Date();
        auditAction = 'ARRIVED_AT_DONOR';
      } else if (action === 'CONFIRM_PICKUP') {
        operation = 'CONFIRM_PICKUP';
        nextAssignmentStatus = 'ARRIVED';
        nextDonationStatus = 'PICKED_UP';
        updates.pickupConfirmedAt = new Date();
        auditAction = 'PICKUP_CONFIRMED';
      } else if (action === 'START_DELIVERY') {
        operation = 'START_DELIVERY';
        nextDonationStatus = 'DELIVERY_IN_PROGRESS';
        updates.deliveryStartedAt = new Date();
        auditAction = 'DELIVERY_STARTED';
      } else if (action === 'CONFIRM_DELIVERY') {
        operation = 'CONFIRM_DELIVERY';
        nextAssignmentStatus = 'COMPLETED';
        nextDonationStatus = 'COMPLETED';
        updates.deliveryConfirmedAt = new Date();
        isCompleted = true;
        auditAction = 'DONATION_COMPLETED';

        const weightKg = parseFloat(assignment.donation.quantity) || 10.0;
        const category = assignment.donation.foodCategory.toLowerCase();
        const factor = IMPACT_FACTORS[category] || IMPACT_FACTORS['mixed'];

        const co2Saved = weightKg * factor.co2;
        const waterSaved = weightKg * factor.water;
        const servings = assignment.donation.estimatedServings || Math.round(weightKg / 0.3);

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

      if (operation) {
        validateStateTransition(assignment.donation.status, nextDonationStatus, operation, {
          actorRole: user.role,
          actorId: userId,
          isOwner,
        });
      }

      await tx.volunteerAssignment.update({
        where: { id: assignmentId },
        data: {
          status: nextAssignmentStatus,
          ...updates,
        },
      });

      await tx.donation.update({
        where: { id: assignment.donationId },
        data: {
          status: nextDonationStatus,
          ...donationUpdates,
        },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId: assignment.donationId,
          previousStatus: assignment.donation.status,
          newStatus: nextDonationStatus,
          changedBy: userId,
          reason: `Volunteer performed action: ${action}`,
        },
      });

      await auditService.log(tx, {
        userId,
        role: user.role,
        action: auditAction,
        entityType: 'Donation',
        entityId: assignment.donationId,
        previousValues: { status: assignment.donation.status },
        newValues: { status: nextDonationStatus },
      });

      if (action === 'CONFIRM_DELIVERY') {
        await auditService.log(tx, {
          userId,
          role: user.role,
          action: 'DELIVERY_CONFIRMED',
          entityType: 'Donation',
          entityId: assignment.donationId,
        });
      }

      return { 
        nextDonationStatus, 
        isCompleted, 
        donorEmail: assignment.donation.donor.user.email, 
        title: assignment.donation.title 
      };
    });

    if (result.isCompleted && result.donorEmail) {
      await emailService.sendDonationCompletedEmail(result.donorEmail, result.title);
    }

    return result.nextDonationStatus;
  },

  async divertDonationToBiogas(userId: string, donationId: string, reason: string) {
    await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) throw new Error('Donation not found');

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      let isOwner = false;
      if (user.role === 'NGO') {
        const ngo = await tx.nGOProfile.findUnique({
          where: { userId },
        });
        if (!ngo || donation.acceptedNgoId !== ngo.id) {
          throw new Error('This donation is not assigned to your NGO.');
        }
        isOwner = true;
      }

      validateStateTransition(donation.status, 'EXPIRED', 'DIVERT', {
        actorRole: user.role,
        actorId: userId,
        isOwner: user.role === 'ADMIN' ? true : isOwner,
      });

      const parsedWeight = parseFloat(donation.quantity.replace(/[^\d.]/g, ''));
      const weightKg = isNaN(parsedWeight) || parsedWeight <= 0 ? 10.0 : parsedWeight;

      await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'EXPIRED',
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancelReason: `Spoiled / Diverted to Biogas Recovery: ${reason}`,
        },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: donation.status,
          newStatus: 'EXPIRED',
          changedBy: userId,
          reason: `Diverted to Biogas Recovery: ${reason}`,
        },
      });

      await auditService.log(tx, {
        userId,
        role: user.role,
        action: 'DONATION_EXPIRED',
        entityType: 'Donation',
        entityId: donationId,
        previousValues: { status: donation.status },
        newValues: { status: 'EXPIRED', cancelReason: `Spoiled / Diverted to Biogas Recovery: ${reason}` },
      });

      const co2EquivalentKg = weightKg * 1.8;

      await tx.impactRecord.create({
        data: {
          donationId,
          foodWeightKg: weightKg,
          estimatedServings: 0,
          co2EquivalentKg,
          waterSavedLiters: 0,
          calculationMethod: 'BIOGAS_RECOVERY_2026',
          factorsUsed: `biogas_recovery: co2=1.8, water=0, yield=0.25kwh/kg`,
        },
      });
    });

    return true;
  },

  async updateNgoSettings(
    userId: string, 
    data: {
      baseAddress: string;
      baseLatitude: number;
      baseLongitude: number;
      serviceRadiusKm: number;
      availability: NgoAvailability;
      acceptedFoodTypes: string[];
    }
  ) {
    const ngo = await ngoRepository.findByUserId(userId);
    if (!ngo) throw new Error('NGO profile not found.');

    const currentAvailability = ngo.availability;
    const newAvailability = data.availability;
    const isAvailabilityChanged = currentAvailability !== newAvailability;

    await ngoRepository.updateSettings(userId, {
      baseAddress: data.baseAddress,
      baseLatitude: data.baseLatitude,
      baseLongitude: data.baseLongitude,
      serviceRadiusKm: data.serviceRadiusKm,
      availability: newAvailability,
      availabilityUpdatedAt: isAvailabilityChanged ? new Date() : ngo.availabilityUpdatedAt,
      acceptedFoodTypes: data.acceptedFoodTypes.join(','),
    });

    return true;
  },
};
