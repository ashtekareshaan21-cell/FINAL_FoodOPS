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

    // Aggregate impact
    const impactAgg = await prisma.impactRecord.aggregate({
      _sum: {
        co2EquivalentKg: true,
        waterSavedLiters: true,
        foodWeightKg: true,
      },
    });

    return {
      totalDonors,
      totalNgos,
      verifiedNgos,
      pendingNgos,
      totalVolunteers,
      totalDonations,
      completedRescues,
      co2SavedKg: impactAgg._sum.co2EquivalentKg || 0,
      waterSavedLiters: impactAgg._sum.waterSavedLiters || 0,
      foodWeightKg: impactAgg._sum.foodWeightKg || 0,
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
