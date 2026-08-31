import { donationRepository } from '@/repositories/donationRepository';
import { ngoRepository } from '@/repositories/ngoRepository';
import crypto from 'crypto';
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
  async runLazyExpiryCheck() {
    const expiredDonations = await prisma.donation.findMany({
      where: {
        status: {
          in: ['AVAILABLE', 'ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_IN_PROGRESS'],
        },
        pickupDeadlineAt: {
          lte: new Date(),
        },
      },
    });

    for (const donation of expiredDonations) {
      try {
        await prisma.$transaction(async (tx) => {
          const fresh = await tx.donation.findUnique({ where: { id: donation.id } });
          if (!fresh || !['AVAILABLE', 'ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_IN_PROGRESS'].includes(fresh.status)) {
            return;
          }

          const parsedWeight = parseFloat(fresh.quantity.replace(/[^\d.]/g, ''));
          const weightKg = isNaN(parsedWeight) || parsedWeight <= 0 ? 10.0 : parsedWeight;

          await tx.donation.update({
            where: { id: fresh.id },
            data: {
              status: 'EXPIRED',
              cancelledAt: new Date(),
              cancelledBy: 'SYSTEM_LAZY_ENGINE',
              cancelReason: 'SLA Expiration - Recovery Required',
            },
          });

          await tx.donationStatusHistory.create({
            data: {
              donationId: fresh.id,
              previousStatus: fresh.status,
              newStatus: 'EXPIRED',
              changedBy: 'SYSTEM_LAZY_ENGINE',
              reason: 'SLA Expiration - Recovery Required',
            },
          });

          await auditService.log(tx, {
            userId: 'SYSTEM_LAZY_ENGINE',
            role: 'ADMIN',
            action: 'DONATION_EXPIRED',
            entityType: 'Donation',
            entityId: fresh.id,
            previousValues: { status: fresh.status },
            newValues: { status: 'EXPIRED', cancelReason: 'SLA Expiration - Recovery Required' },
          });

          const co2EquivalentKg = weightKg * 1.8;

          await tx.impactRecord.create({
            data: {
              donationId: fresh.id,
              foodWeightKg: weightKg,
              estimatedServings: 0,
              co2EquivalentKg,
              waterSavedLiters: 0,
              calculationMethod: 'BIOGAS_RECOVERY_2026',
              factorsUsed: `biogas_recovery: co2=1.8, water=0, yield=0.25kwh/kg`,
            },
          });
        });
      } catch (err) {
        console.error(`Lazy expiry check failed for donation ${donation.id}:`, err);
      }
    }
  },

  async generateDeliveryOtp(userId: string, assignmentId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const assignment = await prisma.volunteerAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        volunteer: true,
        ngo: {
          include: {
            user: true,
          },
        },
        donation: true,
      },
    });

    if (!assignment) throw new Error('Assignment not found');

    let isAuthorized = false;
    if (user.role === 'ADMIN') {
      isAuthorized = true;
    } else if (user.role === 'NGO') {
      isAuthorized = assignment.ngo.userId === userId;
    }

    if (!isAuthorized) {
      throw new Error('Unauthorized to generate delivery OTP for this assignment.');
    }

    if (assignment.donation.status !== 'PICKED_UP' && assignment.donation.status !== 'DELIVERY_IN_PROGRESS') {
      throw new Error('Donation must be picked up before delivery can be verified.');
    }

    const otpVal = crypto.randomInt(100000, 999999).toString();
    const hash = crypto.createHash('sha256').update(otpVal).digest('hex');

    await prisma.volunteerAssignment.update({
      where: { id: assignmentId },
      data: {
        pickupOtpHash: hash,
        pickupOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        pickupOtpAttempts: 0,
      },
    });

    const ngoEmail = assignment.ngo.user.email;
    const donationTitle = assignment.donation.title;
    await emailService.sendPickupOtpEmail(ngoEmail, donationTitle, otpVal);

    return {
      success: true,
      otp: otpVal,
      message: 'Delivery Verification OTP generated successfully and sent to NGO email.',
    };
  },

  async createDonation(userId: string, input: CreateDonationInput & { auditId?: string | null }) {
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
      auditId,
    } = input;

    const parsedLat = typeof pickupLatitude === 'string' ? parseFloat(pickupLatitude) : pickupLatitude;
    const parsedLng = typeof pickupLongitude === 'string' ? parseFloat(pickupLongitude) : pickupLongitude;

    const normalizedCategory = normalizeFoodCategory(foodCategory);
    const validCategories = ['mixed', 'grains', 'bakery', 'vegetables', 'fruits', 'dairy', 'meat'];
    if (!validCategories.includes(normalizedCategory)) {
      throw new Error(`Invalid food category: "${foodCategory}". Normalized: "${normalizedCategory}"`);
    }

    const donation = await prisma.$transaction(async (tx) => {
      // 1. If auditId is provided, validate it first
      let auditRecord = null;
      if (auditId) {
        auditRecord = await tx.foodListingAudit.findUnique({
          where: { id: auditId },
        });

        if (!auditRecord) {
          throw new Error('Audit record not found.');
        }

        if (auditRecord.donorId !== donor.id) {
          throw new Error('Unauthorized: Audit does not belong to this donor.');
        }

        if (auditRecord.donationId !== null) {
          throw new Error('AUDIT_ALREADY_ATTACHED');
        }
      }

      // 2. Create the donation
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

      // 3. Link audit if valid
      if (auditId && auditRecord) {
        await tx.foodListingAudit.update({
          where: { id: auditId },
          data: { donationId: newDonation.id },
        });

        await auditService.log(tx, {
          userId,
          role: 'DONOR',
          action: 'AI_LISTING_AUDITED',
          entityType: 'Donation',
          entityId: newDonation.id,
          newValues: {
            auditId: auditRecord.id,
            status: auditRecord.status,
            foodCategory: auditRecord.foodCategory,
            confidence: auditRecord.confidence,
            provider: auditRecord.provider,
            model: auditRecord.model,
          },
        });
      }

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
    await this.runLazyExpiryCheck();
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
    await this.runLazyExpiryCheck();
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
    await this.runLazyExpiryCheck();
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

  async updateAssignmentStatus(userId: string, assignmentId: string, action: string, otp?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const assignmentCheck = await prisma.volunteerAssignment.findUnique({
      where: { id: assignmentId },
      include: { volunteer: true },
    });
    if (!assignmentCheck) throw new Error('Assignment not found');

    if (action === 'CONFIRM_PICKUP') {
      // 1. Authorization check: assigned volunteer or ADMIN only
      if (user.role !== 'ADMIN' && assignmentCheck.volunteer.userId !== userId) {
        throw new Error('UNAUTHORIZED_OWNER');
      }

      // 2. Verification checks
      if (!otp) {
        throw new Error('OTP is required for confirming pickup.');
      }
      if (!assignmentCheck.pickupOtpHash || !assignmentCheck.pickupOtpExpiresAt) {
        throw new Error('No active OTP found. Please generate an OTP first.');
      }
      if (new Date() > new Date(assignmentCheck.pickupOtpExpiresAt)) {
        throw new Error('OTP has expired.');
      }
      if (assignmentCheck.pickupOtpAttempts >= 3) {
        throw new Error('Maximum verification attempts exceeded. Please generate a new OTP.');
      }

      const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
      const buf1 = Buffer.from(assignmentCheck.pickupOtpHash, 'hex');
      const buf2 = Buffer.from(inputHash, 'hex');

      if (buf1.length !== buf2.length || !crypto.timingSafeEqual(buf1, buf2)) {
        await prisma.volunteerAssignment.update({
          where: { id: assignmentId },
          data: { pickupOtpAttempts: { increment: 1 } },
        });
        throw new Error('Invalid OTP.');
      }
    }

    if (action === 'CONFIRM_DELIVERY') {
      // 1. Authorization check: assigned volunteer or ADMIN only
      if (user.role !== 'ADMIN' && assignmentCheck.volunteer.userId !== userId) {
        throw new Error('UNAUTHORIZED_OWNER');
      }

      // 2. Verification checks
      if (!otp) {
        throw new Error('OTP is required for confirming delivery.');
      }
      if (!assignmentCheck.pickupOtpHash || !assignmentCheck.pickupOtpExpiresAt) {
        throw new Error('No active delivery verification OTP found. Please ask NGO to generate one.');
      }
      if (new Date() > new Date(assignmentCheck.pickupOtpExpiresAt)) {
        throw new Error('Delivery OTP has expired.');
      }
      if (assignmentCheck.pickupOtpAttempts >= 3) {
        throw new Error('Maximum verification attempts exceeded. Please generate a new OTP.');
      }

      const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
      const buf1 = Buffer.from(assignmentCheck.pickupOtpHash, 'hex');
      const buf2 = Buffer.from(inputHash, 'hex');

      if (buf1.length !== buf2.length || !crypto.timingSafeEqual(buf1, buf2)) {
        await prisma.volunteerAssignment.update({
          where: { id: assignmentId },
          data: { pickupOtpAttempts: { increment: 1 } },
        });
        throw new Error('Invalid OTP.');
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const txUser = await tx.user.findUnique({ where: { id: userId } });
      if (!txUser) throw new Error('User not found');

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
        updates.pickupOtpHash = null;
        updates.pickupOtpExpiresAt = null;
        updates.pickupOtpAttempts = 0;
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
        updates.pickupOtpHash = null;
        updates.pickupOtpExpiresAt = null;
        updates.pickupOtpAttempts = 0;
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

  async escalateDonation(userId: string, donationId: string) {
    await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });
      if (!donation) throw new Error('Donation not found');

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      validateStateTransition(donation.status, 'RECOVERY_ESCALATED', 'ESCALATE', {
        actorRole: user.role,
        actorId: userId,
        isOwner: user.role === 'ADMIN',
      });

      await tx.donation.update({
        where: { id: donationId },
        data: { status: 'RECOVERY_ESCALATED' },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: donation.status,
          newStatus: 'RECOVERY_ESCALATED',
          changedBy: userId,
          reason: 'Donation escalated to recovery verification',
        },
      });

      await auditService.log(tx, {
        userId,
        role: user.role,
        action: 'RECOVERY_ESCALATED',
        entityType: 'Donation',
        entityId: donationId,
        previousValues: { status: donation.status },
        newValues: { status: 'RECOVERY_ESCALATED' },
      });
    });
    return true;
  },

  async resolveOrganicDonation(userId: string, donationId: string) {
    await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });
      if (!donation) throw new Error('Donation not found');

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      validateStateTransition(donation.status, 'ORGANIC_RECOVERY', 'RESOLVE_ORGANIC', {
        actorRole: user.role,
        actorId: userId,
        isOwner: user.role === 'ADMIN',
      });

      await tx.donation.update({
        where: { id: donationId },
        data: { status: 'ORGANIC_RECOVERY' },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: donation.status,
          newStatus: 'ORGANIC_RECOVERY',
          changedBy: userId,
          reason: 'Donation resolved via organic recovery pathways',
        },
      });

      await auditService.log(tx, {
        userId,
        role: user.role,
        action: 'ORGANIC_RECOVERY',
        entityType: 'Donation',
        entityId: donationId,
        previousValues: { status: donation.status },
        newValues: { status: 'ORGANIC_RECOVERY' },
      });
    });
    return true;
  },

  async generatePickupOtp(userId: string, assignmentId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const assignment = await prisma.volunteerAssignment.findUnique({
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

    let isAuthorized = false;
    if (user.role === 'ADMIN') {
      isAuthorized = true;
    } else if (user.role === 'VOLUNTEER') {
      isAuthorized = assignment.volunteer.userId === userId;
    } else if (user.role === 'DONOR') {
      isAuthorized = assignment.donation.donor.userId === userId;
    } else if (user.role === 'NGO') {
      isAuthorized = assignment.ngo.userId === userId;
    }

    if (!isAuthorized) {
      throw new Error('Unauthorized to generate OTP for this assignment.');
    }

    const otpVal = crypto.randomInt(100000, 999999).toString();
    const hash = crypto.createHash('sha256').update(otpVal).digest('hex');

    await prisma.volunteerAssignment.update({
      where: { id: assignmentId },
      data: {
        pickupOtpHash: hash,
        pickupOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        pickupOtpAttempts: 0,
      },
    });

    const donorEmail = assignment.donation.donor.user.email;
    const donationTitle = assignment.donation.title;
    await emailService.sendPickupOtpEmail(donorEmail, donationTitle, otpVal);

    if (user.role === 'VOLUNTEER') {
      return {
        success: true,
        message: 'A secure handover OTP has been generated and sent to the donor.',
      };
    } else {
      return {
        success: true,
        otp: otpVal,
        message: 'OTP generated successfully.',
      };
    }
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
