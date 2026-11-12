import { ngoRepository } from '@/repositories/ngoRepository';
import { donorRepository } from '@/repositories/donorRepository';
import { volunteerRepository } from '@/repositories/volunteerRepository';
import { donationRepository } from '@/repositories/donationRepository';
import { emailService } from './emailService';
import { prisma } from '@/lib/db';
import { auditService } from './auditService';
import { validateStateTransition } from './donationStateMachine';
import { dynamicImpactEngine } from './dynamicImpactEngine';

export const adminService = {
  async getPendingNgos() {
    return ngoRepository.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async verifyNgo(adminUserId: string, ngoId: string) {
    const ngo = await ngoRepository.findById(ngoId);
    if (!ngo) throw new Error('NGO profile not found.');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.nGOProfile.update({
        where: { id: ngoId },
        data: {
          status: 'VERIFIED',
          verificationApprovedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: ngo.userId },
        data: { verificationStatus: 'VERIFIED' },
      });

      await tx.verificationRequest.updateMany({
        where: { userId: ngo.userId, status: 'PENDING_VERIFICATION' },
        data: { status: 'VERIFIED', reviewedAt: new Date(), reviewerId: adminUserId },
      });

      return res;
    });

    if (ngo.user?.email) {
      await emailService.sendNGOApprovedEmail(ngo.user.email, ngo.organizationName);
    }

    await auditService.log(prisma, {
      userId: adminUserId,
      role: 'ADMIN',
      action: 'NGO_APPROVED',
      entityType: 'NGOProfile',
      entityId: ngoId,
      newValues: { status: 'VERIFIED' },
    });

    return updated;
  },

  async rejectNgo(adminUserId: string, ngoId: string, reason: string) {
    const ngo = await ngoRepository.findById(ngoId);
    if (!ngo) throw new Error('NGO profile not found.');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.nGOProfile.update({
        where: { id: ngoId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          verificationRejectedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: ngo.userId },
        data: { verificationStatus: 'REJECTED' },
      });

      await tx.verificationRequest.updateMany({
        where: { userId: ngo.userId, status: 'PENDING_VERIFICATION' },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewerId: adminUserId, rejectionReason: reason },
      });

      return res;
    });

    await auditService.log(prisma, {
      userId: adminUserId,
      role: 'ADMIN',
      action: 'NGO_REJECTED',
      entityType: 'NGOProfile',
      entityId: ngoId,
      newValues: { status: 'REJECTED', rejectionReason: reason },
    });

    return updated;
  },

  async verifyDonor(adminUserId: string, donorId: string) {
    const donor = await prisma.donorProfile.findUnique({ where: { id: donorId } });
    if (!donor) throw new Error('Donor profile not found.');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.donorProfile.update({
        where: { id: donorId },
        data: {
          verificationStatus: 'VERIFIED',
          verificationApprovedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: donor.userId },
        data: { verificationStatus: 'VERIFIED', isPhoneVerified: true },
      });

      await tx.verificationRequest.updateMany({
        where: { userId: donor.userId, status: 'PENDING_VERIFICATION' },
        data: { status: 'VERIFIED', reviewedAt: new Date(), reviewerId: adminUserId },
      });

      return res;
    });

    await auditService.log(prisma, {
      userId: adminUserId,
      role: 'ADMIN',
      action: 'DONOR_APPROVED',
      entityType: 'DonorProfile',
      entityId: donorId,
      newValues: { status: 'VERIFIED' },
    });

    return updated;
  },

  async rejectDonor(adminUserId: string, donorId: string, reason: string) {
    const donor = await prisma.donorProfile.findUnique({ where: { id: donorId } });
    if (!donor) throw new Error('Donor profile not found.');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.donorProfile.update({
        where: { id: donorId },
        data: {
          verificationStatus: 'REJECTED',
          rejectionReason: reason,
        },
      });

      await tx.user.update({
        where: { id: donor.userId },
        data: { verificationStatus: 'REJECTED' },
      });

      await tx.verificationRequest.updateMany({
        where: { userId: donor.userId, status: 'PENDING_VERIFICATION' },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewerId: adminUserId, rejectionReason: reason },
      });

      return res;
    });

    await auditService.log(prisma, {
      userId: adminUserId,
      role: 'ADMIN',
      action: 'DONOR_REJECTED',
      entityType: 'DonorProfile',
      entityId: donorId,
      newValues: { status: 'REJECTED', rejectionReason: reason },
    });

    return updated;
  },

  async verifyVolunteer(adminUserId: string, volunteerId: string) {
    const volunteer = await prisma.volunteer.findUnique({ where: { id: volunteerId } });
    if (!volunteer) throw new Error('Volunteer profile not found.');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.volunteer.update({
        where: { id: volunteerId },
        data: {
          verificationStatus: 'VERIFIED',
          rejectionReason: null,
        },
      });

      await tx.user.update({
        where: { id: volunteer.userId },
        data: { verificationStatus: 'VERIFIED', isPhoneVerified: true },
      });

      await tx.verificationRequest.updateMany({
        where: { userId: volunteer.userId, status: 'PENDING_VERIFICATION' },
        data: { status: 'VERIFIED', reviewedAt: new Date(), reviewerId: adminUserId },
      });

      return res;
    });

    await auditService.log(prisma, {
      userId: adminUserId,
      role: 'ADMIN',
      action: 'VOLUNTEER_APPROVED',
      entityType: 'Volunteer',
      entityId: volunteerId,
      newValues: { status: 'VERIFIED' },
    });

    return updated;
  },

  async rejectVolunteer(adminUserId: string, volunteerId: string, reason: string) {
    const volunteer = await prisma.volunteer.findUnique({ where: { id: volunteerId } });
    if (!volunteer) throw new Error('Volunteer profile not found.');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.volunteer.update({
        where: { id: volunteerId },
        data: {
          verificationStatus: 'REJECTED',
          rejectionReason: reason,
        },
      });

      await tx.user.update({
        where: { id: volunteer.userId },
        data: { verificationStatus: 'REJECTED' },
      });

      await tx.verificationRequest.updateMany({
        where: { userId: volunteer.userId, status: 'PENDING_VERIFICATION' },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewerId: adminUserId, rejectionReason: reason },
      });

      return res;
    });

    await auditService.log(prisma, {
      userId: adminUserId,
      role: 'ADMIN',
      action: 'VOLUNTEER_REJECTED',
      entityType: 'Volunteer',
      entityId: volunteerId,
      newValues: { status: 'REJECTED', rejectionReason: reason },
    });

    return updated;
  },



  async getAdminStats() {
    const totalDonors = await donorRepository.count();
    const totalNgos = await ngoRepository.count();
    const verifiedNgos = await ngoRepository.count({ where: { status: 'VERIFIED' } });
    const pendingNgos = await ngoRepository.count({ where: { status: 'PENDING_VERIFICATION' } });
    const totalVolunteers = await volunteerRepository.count();
    const totalDonations = await donationRepository.count();
    // Section 15 rule: Only COMPLETED rescues increment real completed rescue counters.
    const completedRescues = await donationRepository.count({
      where: {
        status: 'COMPLETED',
      },
    });
    const activeRescues = await donationRepository.count({
      where: {
        status: {
          in: ['ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_IN_PROGRESS', 'PICKED_UP', 'DELIVERY_IN_PROGRESS'],
        },
      },
    });

    const completedDonations = await prisma.donation.findMany({
      where: { status: 'COMPLETED' },
      select: { id: true },
    });
    const completedDonationIds = completedDonations.map((d) => d.id);

    // Aggregate rescue impact (direct food delivery only — never merged with organic recovery weight)
    const rescueImpact =
      completedDonationIds.length > 0
        ? await donationRepository.aggregateImpact({
            where: {
              donationId: {
                in: completedDonationIds,
              },
              NOT: {
                OR: [
                  { calculationMethod: 'BIOGAS_RECOVERY_2026' },
                  { calculationMethod: { contains: 'RECOVERY' } },
                  { calculationMethod: { contains: 'ANAEROBIC' } },
                  { calculationMethod: { contains: 'AEROBIC' } },
                  { calculationMethod: { contains: 'CIRCULAR' } },
                ],
              },
            },
            _sum: {
              co2EquivalentKg: true,
              waterSavedLiters: true,
              foodWeightKg: true,
            },
          })
        : { _sum: { co2EquivalentKg: 0, waterSavedLiters: 0, foodWeightKg: 0 } };

    // Aggregate dynamic recovery impact (biogas, biomethanation, composting, goshala) as its own separate line
    const recoveryImpact = await donationRepository.aggregateImpact({
      where: {
        OR: [
          { calculationMethod: 'BIOGAS_RECOVERY_2026' },
          { calculationMethod: { contains: 'RECOVERY' } },
          { calculationMethod: { contains: 'ANAEROBIC' } },
          { calculationMethod: { contains: 'AEROBIC' } },
          { calculationMethod: { contains: 'CIRCULAR' } },
        ],
      },
      _sum: {
        co2EquivalentKg: true,
        waterSavedLiters: true,
        foodWeightKg: true,
      },
    });

    const rescueWeight = rescueImpact._sum?.foodWeightKg || 0;
    const divertedWeight = recoveryImpact._sum?.foodWeightKg || 0;

    // Aggregate live clean energy generated from recovery missions
    const missionEnergy = await prisma.organicRecoveryMission.aggregate({
      _sum: { cleanEnergyKwh: true },
    });
    const liveCleanEnergyKwh =
      (missionEnergy._sum?.cleanEnergyKwh || 0) +
      (divertedWeight > 0 && !missionEnergy._sum?.cleanEnergyKwh ? divertedWeight * 1.15 : 0);

    return {
      totalDonors,
      totalNgos,
      verifiedNgos,
      pendingNgos,
      totalVolunteers,
      totalDonations,
      completedRescues,
      activeRescues,
      co2SavedKg: rescueImpact._sum?.co2EquivalentKg || 0,
      waterSavedLiters: rescueImpact._sum?.waterSavedLiters || 0,
      foodWeightKg: rescueWeight,
      divertedWeightKg: divertedWeight,
      biogasGeneratedKwh: Number(liveCleanEnergyKwh.toFixed(1)),
    };
  },

  async getAllDonors() {
    return donorRepository.findMany({
      include: {
        user: true,
        _count: {
          select: { donations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAllNgos() {
    return ngoRepository.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAllVolunteers() {
    return volunteerRepository.findMany({
      include: {
        user: true,
        ngo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAllDonations() {
    return donationRepository.findMany({
      include: {
        donor: true,
        acceptedNgo: true,
        assignment: {
          include: {
            volunteer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getRecoveryDonations() {
    return donationRepository.findMany({
      where: {
        status: {
          in: ['EXPIRED', 'RECOVERY_ESCALATED', 'ORGANIC_RECOVERY'],
        },
      },
      include: {
        donor: true,
        acceptedNgo: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getAllImpactRecords() {
    return prisma.impactRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAllVerificationRequests() {
    return prisma.verificationRequest.findMany({
      include: {
        user: true,
        documents: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  },

  async forceExpireDonation(userId: string, donationId: string) {
    await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) throw new Error('Donation not found');

      validateStateTransition(donation.status, 'EXPIRED', 'FORCE_EXPIRE', {
        actorRole: 'ADMIN',
        actorId: userId,
        isOwner: false,
      });

      const parsedWeight = parseFloat(donation.quantity.replace(/[^\d.]/g, ''));
      const weightKg = isNaN(parsedWeight) || parsedWeight <= 0 ? 10.0 : parsedWeight;

      await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'EXPIRED',
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancelReason: 'Admin Force Expired / Diverted to Biogas Recovery',
        },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: donation.status,
          newStatus: 'EXPIRED',
          changedBy: userId,
          reason: 'Admin force expired and diverted to biogas recovery',
        },
      });

      await auditService.log(tx, {
        userId,
        role: 'ADMIN',
        action: 'DONATION_EXPIRED',
        entityType: 'Donation',
        entityId: donationId,
        previousValues: { status: donation.status },
        newValues: { status: 'EXPIRED', cancelReason: 'Admin Force Expired / Diverted to Biogas Recovery' },
      });

      const recoveryImpact = dynamicImpactEngine.calculateRecoveryImpact({
        foodWeightKg: weightKg,
        title: donation.title,
        description: donation.description,
        wasteCategory: donation.foodCategory,
        vegNonVeg: donation.vegNonVegMixed,
        facilityType: 'BIOMETHANATION',
        facilityName: 'Municipal Anaerobic Recovery Plant',
      });

      await tx.impactRecord.create({
        data: {
          donationId,
          foodWeightKg: weightKg,
          estimatedServings: 0,
          co2EquivalentKg: recoveryImpact.netCo2SavedKg,
          waterSavedLiters: recoveryImpact.waterSavedLiters,
          calculationMethod: recoveryImpact.calculationMethod,
          factorsUsed: recoveryImpact.factorsUsed,
        },
      });
    });

    return true;
  },
};
