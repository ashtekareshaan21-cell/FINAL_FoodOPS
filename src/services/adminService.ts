import { ngoRepository } from '@/repositories/ngoRepository';
import { donorRepository } from '@/repositories/donorRepository';
import { volunteerRepository } from '@/repositories/volunteerRepository';
import { donationRepository } from '@/repositories/donationRepository';
import { emailService } from './emailService';
import { prisma } from '@/lib/db';
import { auditService } from './auditService';
import { validateStateTransition } from './donationStateMachine';

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
    const updated = await ngoRepository.updateStatus(ngoId, {
      status: 'VERIFIED',
      verificationApprovedAt: new Date(),
    });

    const ngo = await ngoRepository.findById(ngoId);
    if (ngo && ngo.user?.email) {
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
    const updated = await ngoRepository.updateStatus(ngoId, {
      status: 'SUSPENDED',
      rejectionReason: reason,
      verificationRejectedAt: new Date(),
    });

    await auditService.log(prisma, {
      userId: adminUserId,
      role: 'ADMIN',
      action: 'NGO_REJECTED',
      entityType: 'NGOProfile',
      entityId: ngoId,
      newValues: { status: 'SUSPENDED', rejectionReason: reason },
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
    const completedRescues = await donationRepository.count({ where: { status: 'COMPLETED' } });

    // Aggregate rescue impact (non-biogas)
    const rescueImpact = await donationRepository.aggregateImpact({
      where: {
        NOT: { calculationMethod: 'BIOGAS_RECOVERY_2026' },
      },
      _sum: {
        co2EquivalentKg: true,
        waterSavedLiters: true,
        foodWeightKg: true,
      },
    });

    // Aggregate biogas recovery impact
    const recoveryImpact = await donationRepository.aggregateImpact({
      where: {
        calculationMethod: 'BIOGAS_RECOVERY_2026',
      },
      _sum: {
        co2EquivalentKg: true,
        foodWeightKg: true,
      },
    });

    const rescueWeight = rescueImpact._sum?.foodWeightKg || 0;
    const divertedWeight = recoveryImpact._sum?.foodWeightKg || 0;

    return {
      totalDonors,
      totalNgos,
      verifiedNgos,
      pendingNgos,
      totalVolunteers,
      totalDonations,
      completedRescues,
      co2SavedKg: (rescueImpact._sum?.co2EquivalentKg || 0) + (recoveryImpact._sum?.co2EquivalentKg || 0),
      waterSavedLiters: rescueImpact._sum?.waterSavedLiters || 0,
      foodWeightKg: rescueWeight,
      divertedWeightKg: divertedWeight,
      biogasGeneratedKwh: divertedWeight * 0.25,
    };
  },

  async getAllDonors() {
    return donorRepository.findMany({
      include: { user: true },
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
      },
      orderBy: { createdAt: 'desc' },
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
};
