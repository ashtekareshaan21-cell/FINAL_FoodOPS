if (process.env.PG_TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.PG_TEST_DATABASE_URL;
}

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../lib/db';
import { getSession } from '../lib/auth';
import { acceptDonation } from '../app/actions/donations';

const pgTestUrl = process.env.PG_TEST_DATABASE_URL;
const isCI = process.env.CI === 'true';

// Mock getSession and next/cache
vi.mock('../lib/auth', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getSession: vi.fn(),
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('PostgreSQL Concurrency Integration Validation', () => {
  if (!pgTestUrl) {
    if (isCI) {
      it('fails in CI because PG_TEST_DATABASE_URL is missing', () => {
        throw new Error('CRITICAL FAILURE: PG_TEST_DATABASE_URL is required in CI but is missing.');
      });
    } else {
      it.skip('Skipping PostgreSQL concurrency tests because PG_TEST_DATABASE_URL is not set.', () => {});
    }
    return;
  }

  beforeAll(async () => {
    // Set database URL to PostgreSQL test database before importing or running queries
    process.env.DATABASE_URL = pgTestUrl;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('verifies atomic claiming allows exactly one claimant to succeed under concurrent PostgreSQL requests', async () => {
    // 1. Programmatically clear test database tables
    await prisma.volunteerAssignment.deleteMany();
    await prisma.donationStatusHistory.deleteMany();
    await prisma.donationImage.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.volunteer.deleteMany();
    await prisma.nGOProfile.deleteMany();
    await prisma.donorProfile.deleteMany();
    await prisma.adminProfile.deleteMany();
    await prisma.user.deleteMany();

    const demoPasswordHash = 'hashed_password';

    // 2. Create users and profiles
    const donorUser = await prisma.user.create({
      data: {
        email: 'donor_pg@foodops.org',
        phoneNumber: '+91 8888888800',
        passwordHash: demoPasswordHash,
        role: 'DONOR',
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    const donor = await prisma.donorProfile.create({
      data: {
        userId: donorUser.id,
        organizationName: 'PG Donor Org',
        organizationType: 'BUSINESS',
        contactPerson: 'Donor Contact',
        address: 'PG Location',
        latitude: 12.9716,
        longitude: 77.5946,
      },
    });

    const ngo1User = await prisma.user.create({
      data: {
        email: 'ngo1_pg@foodops.org',
        phoneNumber: '+91 8888888801',
        passwordHash: demoPasswordHash,
        role: 'NGO',
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    await prisma.nGOProfile.create({
      data: {
        userId: ngo1User.id,
        organizationName: 'PG NGO 1',
        registrationNumber: 'FSSAI-8888888801',
        status: 'VERIFIED',
        baseAddress: 'PG NGO Location',
        baseLatitude: 12.9716,
        baseLongitude: 77.5946,
        serviceRadiusKm: 10,
        availability: 'AVAILABLE',
        acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG',
        contactPerson: 'NGO Contact',
        contactPhone: '+91 8888888801',
      },
    });

    const ngo2User = await prisma.user.create({
      data: {
        email: 'ngo2_pg@foodops.org',
        phoneNumber: '+91 8888888802',
        passwordHash: demoPasswordHash,
        role: 'NGO',
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    await prisma.nGOProfile.create({
      data: {
        userId: ngo2User.id,
        organizationName: 'PG NGO 2',
        registrationNumber: 'FSSAI-8888888802',
        status: 'VERIFIED',
        baseAddress: 'PG NGO Location 2',
        baseLatitude: 12.9716,
        baseLongitude: 77.5946,
        serviceRadiusKm: 10,
        availability: 'AVAILABLE',
        acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG',
        contactPerson: 'NGO Contact 2',
        contactPhone: '+91 8888888802',
      },
    });

    // Create a new AVAILABLE donation
    const donation = await prisma.donation.create({
      data: {
        donorId: donor.id,
        title: 'PG Concurrent Race Test Food',
        description: 'Testing PostgreSQL transaction consistency',
        foodCategory: 'mixed',
        vegNonVegMixed: 'VEG',
        quantity: '10',
        quantityUnit: 'kg',
        pickupAvailableAt: new Date(),
        pickupDeadlineAt: new Date(Date.now() + 3600000),
        pickupAddress: 'PG Location',
        pickupLatitude: 12.9716,
        pickupLongitude: 77.5946,
        status: 'AVAILABLE',
      },
    });

    // 5 concurrent claim attempts
    const claimers = [
      { userId: ngo1User.id, email: 'ngo1_pg@foodops.org' },
      { userId: ngo2User.id, email: 'ngo2_pg@foodops.org' },
      { userId: ngo1User.id, email: 'ngo1_pg@foodops.org' },
      { userId: ngo2User.id, email: 'ngo2_pg@foodops.org' },
      { userId: ngo1User.id, email: 'ngo1_pg@foodops.org' },
    ];

    const results = await Promise.all(
      claimers.map(async (claimer) => {
        vi.mocked(getSession).mockResolvedValue({
          userId: claimer.userId,
          role: 'NGO',
          email: claimer.email,
          exp: Math.floor(Date.now() / 1000) + 3600,
        });

        return acceptDonation(donation.id);
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    expect(successCount).toBe(1);
    expect(failCount).toBe(4);

    // Verify other attempts failed with the controlled error message
    const rejectedErrors = results.filter((r) => !r.success).map((r) => r.error);
    rejectedErrors.forEach((err) => {
      expect(err).toBe('This donation has already been accepted by another NGO.');
    });

    // Verify database record status
    const finalDonation = await prisma.donation.findUnique({ where: { id: donation.id } });
    expect(finalDonation!.status).toBe('ACCEPTED');
    expect(finalDonation!.acceptedNgoId).not.toBeNull();

    // Verify transaction consistency
    const finalLogs = await prisma.auditLog.findMany({
      where: { action: 'DONATION_CLAIMED', entityId: donation.id },
    });
    expect(finalLogs.length).toBe(1);

    const finalHistory = await prisma.donationStatusHistory.findMany({
      where: { donationId: donation.id },
    });
    expect(finalHistory.length).toBe(1);
  });
});
