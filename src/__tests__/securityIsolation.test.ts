import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  mockGetSession,
  mockIsAdminPortalEnabled,
  mockOcrProcess,
  mockTraceDonationMatches,
  mockGetAdminStats,
  mockPrisma,
  mockFindNgoByUserId,
} = vi.hoisted(() => {
  const prismaObj: Record<string, any> = {
    user: { findUnique: vi.fn() },
    nGOProfile: { findUnique: vi.fn() },
    organicFacility: { count: vi.fn(), createMany: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    organicRecoveryMission: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    volunteer: { findUnique: vi.fn(), findMany: vi.fn() },
    volunteerAssignment: { deleteMany: vi.fn(), create: vi.fn() },
    donation: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    donationStatusHistory: { create: vi.fn() },
    impactRecord: { upsert: vi.fn() },
  };
  prismaObj.$transaction = vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(prismaObj));
  return {
    mockGetSession: vi.fn(),
    mockIsAdminPortalEnabled: vi.fn(() => true),
    mockOcrProcess: vi.fn(),
    mockTraceDonationMatches: vi.fn(),
    mockGetAdminStats: vi.fn(),
    mockPrisma: prismaObj,
    mockFindNgoByUserId: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({
  getSession: () => mockGetSession(),
  isAdminPortalEnabled: () => mockIsAdminPortalEnabled(),
}));

vi.mock('@/services/ocrService', () => ({
  ocrService: {
    extractTextFromImage: mockOcrProcess,
  },
}));

vi.mock('@/services/matchingDiagnosticsService', () => ({
  matchingDiagnosticsService: {
    traceDonationMatches: mockTraceDonationMatches,
  },
}));

vi.mock('@/services/adminService', () => ({
  adminService: {
    getAdminStats: mockGetAdminStats,
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/repositories/ngoRepository', () => ({
  ngoRepository: {
    findByUserId: mockFindNgoByUserId,
  },
}));

vi.mock('@/services/auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

import { NextRequest } from 'next/server';
import { POST as ocrPost } from '@/app/api/ocr/route';
import { getAdminStats } from '@/app/actions/admin';
import { getDonationMatchDiagnostics, getPublicImpactStats } from '@/app/actions/donations';
import { getOrganicRecoveryData } from '@/app/actions/organicRecovery';
import { seedDemoExpiredDonations } from '@/app/actions/organicRecovery';
import { seedDemoRescues } from '@/app/actions/ngo';
import { organicRecoveryService } from '@/services/organicRecoveryService';
import { ngoFleetService } from '@/services/ngoFleetService';

describe('Security & Multi-Tenant Isolation Regression Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockIsAdminPortalEnabled.mockReturnValue(true);
    mockPrisma.organicFacility.count.mockResolvedValue(5);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('API /api/ocr authentication & authorization', () => {
    it('returns 404 for unauthenticated callers without leaking route existence', async () => {
      mockGetSession.mockResolvedValue(null);
      const req = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ base64Image: 'abc', mimeType: 'image/png' }),
      });

      const res = await ocrPost(req);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Not found' });
      expect(mockOcrProcess).not.toHaveBeenCalled();
    });

    it('returns 404 for non-DONOR/non-ADMIN roles (NGO / VOLUNTEER)', async () => {
      mockGetSession.mockResolvedValue({ userId: 'ngo_user_1', role: 'NGO' });
      const req = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ base64Image: 'abc', mimeType: 'image/png' }),
      });

      const res = await ocrPost(req);
      expect(res.status).toBe(404);
      expect(mockOcrProcess).not.toHaveBeenCalled();
    });

    it('allows authenticated DONOR role', async () => {
      mockGetSession.mockResolvedValue({ userId: 'donor_user_1', role: 'DONOR' });
      mockOcrProcess.mockResolvedValue({
        success: true,
        hasReadableText: true,
        text: 'BEST BEFORE TOMORROW',
        lines: ['BEST BEFORE TOMORROW'],
        detectedLabels: [],
        confidence: 'high',
        source: 'ocr',
        status: 'VERIFIED',
      });

      const req = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ base64Image: 'abc', mimeType: 'image/png' }),
      });

      const res = await ocrPost(req);
      expect(res.status).toBe(200);
      expect(mockOcrProcess).toHaveBeenCalledOnce();
    });
  });

  describe('Admin & public stats isolation', () => {
    it('blocks getAdminStats() when unauthenticated or non-ADMIN', async () => {
      mockGetSession.mockResolvedValue(null);
      await expect(getAdminStats()).rejects.toThrow('Unauthorized');

      mockGetSession.mockResolvedValue({ userId: 'donor_1', role: 'DONOR' });
      await expect(getAdminStats()).rejects.toThrow('Unauthorized');
      expect(mockGetAdminStats).not.toHaveBeenCalled();
    });

    it('strips internal user/org counts from getPublicImpactStats()', async () => {
      mockGetAdminStats.mockResolvedValue({
        totalDonors: 99,
        totalNgos: 42,
        verifiedNgos: 40,
        pendingNgos: 2,
        totalVolunteers: 120,
        totalDonations: 350,
        completedRescues: 10,
        activeRescues: 3,
        co2SavedKg: 50,
        waterSavedLiters: 1000,
        foodWeightKg: 20,
        divertedWeightKg: 5,
        biogasGeneratedKwh: 8,
      });

      const stats = await getPublicImpactStats();
      expect(stats).toEqual({
        completedRescues: 10,
        activeRescues: 3,
        co2SavedKg: 50,
        waterSavedLiters: 1000,
        foodWeightKg: 20,
        divertedWeightKg: 5,
        biogasGeneratedKwh: 8,
      });
      expect(stats).not.toHaveProperty('totalDonors');
      expect(stats).not.toHaveProperty('totalNgos');
      expect(stats).not.toHaveProperty('pendingNgos');
    });
  });

  describe('IDOR protection across URL/action IDs', () => {
    it('returns non-disclosing Not found when Donor A requests Donor B donation diagnostics', async () => {
      mockGetSession.mockResolvedValue({ userId: 'donor_user_A', role: 'DONOR' });
      mockPrisma.donation.findUnique.mockResolvedValue({
        id: 'don_B',
        donor: { userId: 'donor_user_B' },
      });

      const res = await getDonationMatchDiagnostics('don_B');
      expect(res).toEqual({ success: false, error: 'Not found.' });
      expect(mockTraceDonationMatches).not.toHaveBeenCalled();
    });

    it('blocks NGO A from confirming facility arrival on NGO B organic recovery mission', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'ngo_user_A',
        role: 'NGO',
      });
      mockPrisma.nGOProfile.findUnique.mockResolvedValue({ id: 'ngo_profile_A', userId: 'ngo_user_A' });
      mockPrisma.organicRecoveryMission.findUnique.mockResolvedValue({
        id: 'mission_B',
        initiatedById: 'ngo_user_B',
        donationId: 'don_B',
        gateEntryOtp: '123456',
        facility: { name: 'Plant B', outputProduct: 'BIO_GAS' },
        donation: { acceptedNgoId: 'ngo_profile_B' },
      });

      await expect(
        organicRecoveryService.confirmFacilityArrival('ngo_user_A', 'mission_B', '123456')
      ).rejects.toThrow('Mission not found');
      expect(mockPrisma.organicRecoveryMission.update).not.toHaveBeenCalled();
    });

    it('blocks NGO A from dispatching NGO B donation or assigning NGO B volunteer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'ngo_user_A',
        role: 'NGO',
      });
      mockPrisma.nGOProfile.findUnique.mockResolvedValue({ id: 'ngo_profile_A', userId: 'ngo_user_A' });
      mockPrisma.organicFacility.findUnique.mockResolvedValue({
        id: 'fac_1',
        name: 'Katraj Plant',
        facilityType: 'BIOMETHANATION_PLANT',
        processingMethod: 'ANAEROBIC_DIGESTION',
      });
      mockPrisma.volunteer.findUnique.mockResolvedValue({
        id: 'vol_B',
        ngoId: 'ngo_profile_B',
        name: 'Rider B',
      });

      await expect(
        organicRecoveryService.dispatchOrganicRecovery('ngo_user_A', {
          donationId: 'don_B',
          facilityId: 'fac_1',
          assignedVolunteerId: 'vol_B',
        })
      ).rejects.toThrow('Volunteer not found');

      mockPrisma.donation.findUnique.mockResolvedValue({
        id: 'don_B',
        acceptedNgoId: 'ngo_profile_B',
        status: 'EXPIRED',
        quantity: '10',
        donor: { organizationName: 'Kitchen B' },
      });

      await expect(
        organicRecoveryService.dispatchOrganicRecovery('ngo_user_A', {
          donationId: 'don_B',
          facilityId: 'fac_1',
        })
      ).rejects.toThrow('Donation not found');
      expect(mockPrisma.organicRecoveryMission.upsert).not.toHaveBeenCalled();
    });

    it('scopes getOrganicRecoveryData() to the logged-in NGO only', async () => {
      mockGetSession.mockResolvedValue({ userId: 'ngo_user_A', role: 'NGO' });
      mockPrisma.nGOProfile.findUnique.mockResolvedValue({ id: 'ngo_profile_A', userId: 'ngo_user_A' });
      mockPrisma.organicFacility.findMany.mockResolvedValue([]);
      mockPrisma.organicRecoveryMission.findMany.mockResolvedValue([]);
      mockPrisma.donation.findMany.mockResolvedValue([]);

      await getOrganicRecoveryData();

      expect(mockPrisma.organicRecoveryMission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { initiatedById: 'ngo_user_A' },
              { donation: { acceptedNgoId: 'ngo_profile_A' } },
            ],
          },
        })
      );
      expect(mockPrisma.donation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            acceptedNgoId: 'ngo_profile_A',
          }),
        })
      );
    });

    it('rejects autoAllotDonations when any donationId in request belongs to another NGO', async () => {
      mockFindNgoByUserId.mockResolvedValue({ id: 'ngo_profile_A', userId: 'ngo_user_A' });
      mockPrisma.donation.findMany.mockResolvedValue([{ id: 'don_A', title: 'Owned', donor: {} }]);

      await expect(
        ngoFleetService.autoAllotDonations('ngo_user_A', {
          mode: 'RANDOM',
          donationIds: ['don_A', 'don_B_foreign'],
        })
      ).rejects.toThrow('One or more requested donations were not found.');
      expect(mockPrisma.volunteerAssignment.create).not.toHaveBeenCalled();
    });
  });

  describe('Production demo data / seeding blockers', () => {
    it('blocks seedDemoRescues and seedDemoExpiredDonations outside demo/test mode', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
      mockGetSession.mockResolvedValue({ userId: 'ngo_user_A', role: 'NGO' });

      const r1 = await seedDemoRescues();
      const r2 = await seedDemoExpiredDonations();
      expect(r1).toEqual({ success: false, error: 'Demo seeding is disabled outside demo mode.' });
      expect(r2).toEqual({ success: false, error: 'Demo seeding is disabled outside demo mode.' });
    });
  });
});
