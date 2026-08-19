import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { execSync } from 'child_process';
import { prisma } from '../lib/db';
import { getSession } from '../lib/auth';
import { getAllDonors } from '../app/actions/admin';
import { acceptDonation, updateAssignmentStatus } from '../app/actions/donations';
import { validateStateTransition } from '../services/donationStateMachine';
import * as fs from 'fs';

const TEST_DB_URL = 'file:./test.db';

// Mock getSession
vi.mock('../lib/auth', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getSession: vi.fn(),
  };
});

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('FoodOps 3.0 P0 Core Integrity & Concurrency', () => {
  beforeAll(async () => {
    // Force Prisma to connect to test database
    process.env.DATABASE_URL = TEST_DB_URL;

    try {
      if (fs.existsSync('./test.db')) {
        fs.unlinkSync('./test.db');
      }
    } catch {}

    console.log('Initializing isolated test database...');
    // Generate test database tables
    execSync('npx prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: 'ignore',
    });

    // Programmatically clear all tables to ensure clean slate
    await prisma.volunteerAssignment.deleteMany();
    await prisma.donationStatusHistory.deleteMany();
    await prisma.donationImage.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.volunteer.deleteMany();
    await prisma.nGOProfile.deleteMany();
    await prisma.donorProfile.deleteMany();
    await prisma.adminProfile.deleteMany();
    await prisma.user.deleteMany();

    console.log('Isolated test database initialized and cleared.');
  });

  afterAll(async () => {
    // Close connection and clean up
    await prisma.$disconnect();
    try {
      if (fs.existsSync('./test.db')) {
        fs.unlinkSync('./test.db');
      }
    } catch {}
  });

  // Test E: Seed Idempotency
  it('seeding twice does not duplicate records or throw errors', async () => {
    // Run seed first time
    execSync('node prisma/seed.js', {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: 'ignore',
    });

    const userCount1 = await prisma.user.count();
    const ngoCount1 = await prisma.nGOProfile.count();

    expect(userCount1).toBe(6);
    expect(ngoCount1).toBe(3);

    // Run seed second time
    execSync('node prisma/seed.js', {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: 'ignore',
    });

    const userCount2 = await prisma.user.count();
    const ngoCount2 = await prisma.nGOProfile.count();

    // Counts must remain completely stable
    expect(userCount2).toBe(userCount1);
    expect(ngoCount2).toBe(ngoCount1);
  });

  // Test A: Admin Authorization
  it('rejects non-admin actions and permits admin actions', async () => {
    // Mock non-admin session
    vi.mocked(getSession).mockResolvedValue({
      userId: 'donor_user_id',
      role: 'DONOR',
      email: 'donor@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    await expect(getAllDonors()).rejects.toThrow('Unauthorized');

    // Mock admin session
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin_user_id',
      role: 'ADMIN',
      email: 'admin@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const donors = await getAllDonors();
    expect(Array.isArray(donors)).toBe(true);
  });

  // Test C: State Machine
  it('donation state machine enforces valid state transitions and rejects invalid ones', () => {
    // Valid transition
    expect(() => {
      validateStateTransition('AVAILABLE', 'ACCEPTED', 'CLAIM', {
        actorRole: 'NGO',
        actorId: 'ngo_user_id',
        isOwner: false,
      });
    }).not.toThrow();

    // Invalid transition
    expect(() => {
      validateStateTransition('AVAILABLE', 'COMPLETED', 'CONFIRM_DELIVERY', {
        actorRole: 'VOLUNTEER',
        actorId: 'vol_user_id',
        isOwner: true,
      });
    }).toThrow('INVALID_STATE_TRANSITION');

    // Unauthorized role
    expect(() => {
      validateStateTransition('AVAILABLE', 'ACCEPTED', 'CLAIM', {
        actorRole: 'DONOR',
        actorId: 'donor_user_id',
        isOwner: false,
      });
    }).toThrow('UNAUTHORIZED_ROLE');
  });

  // Test B: Ownership Verification
  it('enforces volunteer and NGO assignment ownership', async () => {
    const ngo1 = await prisma.nGOProfile.findFirst({ where: { organizationName: 'Save Food Foundation' } });
    const volunteerAUser = await prisma.user.findUnique({ where: { email: 'volunteer@foodops.org' } });
    const volunteerA = await prisma.volunteer.findFirst({ where: { userId: volunteerAUser.id } });
    const donor = await prisma.donorProfile.findFirst();

    // Create Volunteer B user and profile
    const volunteerBUser = await prisma.user.create({
      data: {
        email: 'volunteerB@foodops.org',
        phoneNumber: '+91 9999999901',
        role: 'VOLUNTEER',
      },
    });
    await prisma.volunteer.create({
      data: {
        userId: volunteerBUser.id,
        ngoId: ngo1.id,
        name: 'Volunteer B',
        phoneNumber: '+91 9999999901',
      },
    });

    // Create a donation and assign to Volunteer A
    const donation = await prisma.donation.create({
      data: {
        donorId: donor.id,
        title: 'Ownership Test Food',
        description: 'Testing volunteer ownership',
        foodCategory: 'mixed',
        vegNonVegMixed: 'VEG',
        quantity: '5',
        quantityUnit: 'kg',
        pickupAvailableAt: new Date(),
        pickupDeadlineAt: new Date(Date.now() + 3600000),
        pickupAddress: 'Test Location',
        pickupLatitude: 12.9716,
        pickupLongitude: 77.5946,
        status: 'VOLUNTEER_ASSIGNED',
        acceptedNgoId: ngo1.id,
      },
    });

    const assignment = await prisma.volunteerAssignment.create({
      data: {
        donationId: donation.id,
        volunteerId: volunteerA.id,
        ngoId: ngo1.id,
        status: 'ASSIGNED',
      },
    });

    // Case 1: Volunteer B tries to start pickup for Volunteer A's assignment -> Expect rejection
    vi.mocked(getSession).mockResolvedValue({
      userId: volunteerBUser.id,
      role: 'VOLUNTEER',
      email: 'volunteerB@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const resFail = await updateAssignmentStatus(assignment.id, 'START_PICKUP');
    expect(resFail.success).toBe(false);
    expect(resFail.error).toContain('UNAUTHORIZED_OWNER');

    // Case 2: Volunteer A starts pickup -> Expect success
    vi.mocked(getSession).mockResolvedValue({
      userId: volunteerAUser.id,
      role: 'VOLUNTEER',
      email: 'volunteer@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const resSuccess = await updateAssignmentStatus(assignment.id, 'START_PICKUP');
    expect(resSuccess.success).toBe(true);
  });

  // Test D: Atomic Concurrency Claiming
  it('atomic claiming allows exactly one claimant to succeed under concurrent requests', async () => {
    const donor = await prisma.donorProfile.findFirst();
    const ngo1User = await prisma.user.findUnique({ where: { email: 'ngo1@foodops.org' } });
    const ngo2User = await prisma.user.findUnique({ where: { email: 'ngo2@foodops.org' } });

    // Create a new AVAILABLE donation
    const donation = await prisma.donation.create({
      data: {
        donorId: donor.id,
        title: 'Concurrent Race Test Food',
        description: 'Testing database level locking',
        foodCategory: 'mixed',
        vegNonVegMixed: 'VEG',
        quantity: '10',
        quantityUnit: 'kg',
        pickupAvailableAt: new Date(),
        pickupDeadlineAt: new Date(Date.now() + 3600000),
        pickupAddress: 'Test Location',
        pickupLatitude: 12.9716,
        pickupLongitude: 77.5946,
        status: 'AVAILABLE',
      },
    });

    // Create 5 concurrent claim attempts
    const claimers = [
      { userId: ngo1User.id, email: 'ngo1@foodops.org' },
      { userId: ngo2User.id, email: 'ngo2@foodops.org' },
      { userId: ngo1User.id, email: 'ngo1@foodops.org' },
      { userId: ngo2User.id, email: 'ngo2@foodops.org' },
      { userId: ngo1User.id, email: 'ngo1@foodops.org' },
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
    expect(finalDonation.status).toBe('ACCEPTED');
    expect(finalDonation.acceptedNgoId).not.toBeNull();
  });
});
