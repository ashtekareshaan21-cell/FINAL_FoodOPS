'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getPendingNgos() {
  const session = await getSession();
  // For demo convenience, check if they are logged in. If there is no specific admin profile yet, we just allow verified admins
  if (!session) throw new Error('Unauthorized');

  return prisma.nGOProfile.findMany({
    where: { status: 'PENDING_VERIFICATION' },
    include: {
      user: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function verifyNgo(ngoId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.nGOProfile.update({
      where: { id: ngoId },
      data: {
        status: 'VERIFIED',
        verificationApprovedAt: new Date(),
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Verify NGO error:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectNgo(ngoId: string, reason: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.nGOProfile.update({
      where: { id: ngoId },
      data: {
        status: 'SUSPENDED',
        rejectionReason: reason,
        verificationRejectedAt: new Date(),
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Reject NGO error:', error);
    return { success: false, error: error.message };
  }
}

export async function getAdminStats() {
  try {
    const totalDonors = await prisma.donorProfile.count();
    const totalNgos = await prisma.nGOProfile.count();
    const verifiedNgos = await prisma.nGOProfile.count({ where: { status: 'VERIFIED' } });
    const pendingNgos = await prisma.nGOProfile.count({ where: { status: 'PENDING_VERIFICATION' } });
    const totalVolunteers = await prisma.volunteer.count();
    const totalDonations = await prisma.donation.count();
    const completedRescues = await prisma.donation.count({ where: { status: 'COMPLETED' } });

    // Aggregate rescue impact (non-biogas)
    const rescueImpact = await prisma.impactRecord.aggregate({
      where: {
        NOT: { calculationMethod: 'BIOGAS_RECOVERY_2026' }
      },
      _sum: {
        co2EquivalentKg: true,
        waterSavedLiters: true,
        foodWeightKg: true,
      },
    });

    // Aggregate biogas recovery impact
    const recoveryImpact = await prisma.impactRecord.aggregate({
      where: {
        calculationMethod: 'BIOGAS_RECOVERY_2026'
      },
      _sum: {
        co2EquivalentKg: true,
        foodWeightKg: true,
      },
    });

    const rescueWeight = rescueImpact._sum.foodWeightKg || 0;
    const divertedWeight = recoveryImpact._sum.foodWeightKg || 0;

    return {
      totalDonors,
      totalNgos,
      verifiedNgos,
      pendingNgos,
      totalVolunteers,
      totalDonations,
      completedRescues,
      co2SavedKg: (rescueImpact._sum.co2EquivalentKg || 0) + (recoveryImpact._sum.co2EquivalentKg || 0),
      waterSavedLiters: rescueImpact._sum.waterSavedLiters || 0,
      foodWeightKg: rescueWeight,
      divertedWeightKg: divertedWeight,
      biogasGeneratedKwh: divertedWeight * 0.25,
    };
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
  return prisma.donorProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllNgos() {
  return prisma.nGOProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllVolunteers() {
  return prisma.volunteer.findMany({
    include: {
      user: true,
      ngo: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllDonations() {
  return prisma.donation.findMany({
    include: {
      donor: true,
      acceptedNgo: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function forceExpireDonation(donationId: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Only Admins can force-expire donations.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) throw new Error('Donation not found');

      if (donation.status === 'COMPLETED' || donation.status === 'CANCELLED' || donation.status === 'EXPIRED') {
        throw new Error(`Cannot expire a donation with status ${donation.status}`);
      }

      // Parse quantity
      const parsedWeight = parseFloat(donation.quantity.replace(/[^\d.]/g, ''));
      const weightKg = isNaN(parsedWeight) || parsedWeight <= 0 ? 10.0 : parsedWeight;

      // Update donation status to EXPIRED
      await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'EXPIRED',
          cancelledAt: new Date(),
          cancelledBy: session.userId,
          cancelReason: 'Admin Force Expired / Diverted to Biogas Recovery',
        },
      });

      // Status history
      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: donation.status,
          newStatus: 'EXPIRED',
          changedBy: session.userId,
          reason: 'Admin force expired and diverted to biogas recovery',
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'FORCE_EXPIRE_DIVERT',
          entityType: 'Donation',
          entityId: donationId,
          newValues: JSON.stringify({ status: 'EXPIRED', cancelReason: 'Admin Force Expired / Diverted to Biogas Recovery' }),
        },
      });

      // Create ImpactRecord for recovery
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

      return { success: true };
    });

    revalidatePath('/admin');
    revalidatePath('/admin/data');
    revalidatePath('/ngo');
    return { success: true };
  } catch (error: any) {
    console.error('Force expire donation error:', error);
    return { success: false, error: error.message || 'Failed to force expire donation.' };
  }
}
