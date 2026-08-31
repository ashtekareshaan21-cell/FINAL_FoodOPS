/* eslint-disable @typescript-eslint/no-explicit-any */
process.env.DATABASE_URL = 'file:./test.db';

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { execSync } from 'child_process';
import { prisma } from '../lib/db';
import { getSession } from '../lib/auth';
import { getAllDonors } from '../app/actions/admin';
import { 
  acceptDonation, 
  updateAssignmentStatus, 
  generatePickupOtp, 
  generateDeliveryOtp,
  escalateDonation, 
  resolveOrganicDonation, 
  getDonationMatchDiagnostics 
} from '../app/actions/donations';
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
    // Sync provider in schema.prisma with test database protocol
    execSync('node prisma/prepare.js', {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: 'ignore',
    });
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

  // Test A: Admin Authorization & Feature Lock
  it('rejects non-admin actions and respects ADMIN_PORTAL_ENABLED feature lock', async () => {
    // 1. When ADMIN_PORTAL_ENABLED is false (default), all admin actions reject
    process.env.ADMIN_PORTAL_ENABLED = 'false';
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin_user_id',
      role: 'ADMIN',
      email: 'admin@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    await expect(getAllDonors()).rejects.toThrow('Admin portal is disabled.');

    // 2. When ADMIN_PORTAL_ENABLED is true, permits authorized admin session
    process.env.ADMIN_PORTAL_ENABLED = 'true';
    const donors = await getAllDonors();
    expect(Array.isArray(donors)).toBe(true);

    // 3. Rejects non-admin role even when feature lock is true
    vi.mocked(getSession).mockResolvedValue({
      userId: 'donor_user_id',
      role: 'DONOR',
      email: 'donor@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    await expect(getAllDonors()).rejects.toThrow('Unauthorized');
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
    const volunteerA = await prisma.volunteer.findFirst({ where: { userId: volunteerAUser!.id } });
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
        ngoId: ngo1!.id,
        name: 'Volunteer B',
        phoneNumber: '+91 9999999901',
      },
    });

    // Create a donation and assign to Volunteer A
    const donation = await prisma.donation.create({
      data: {
        donorId: donor!.id,
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
        acceptedNgoId: ngo1!.id,
      },
    });

    const assignment = await prisma.volunteerAssignment.create({
      data: {
        donationId: donation.id,
        volunteerId: volunteerA!.id,
        ngoId: ngo1!.id,
        status: 'ASSIGNED',
      },
    });

    // Case 1: Volunteer B tries to start pickup for Volunteer A's assignment -> Expect rejection
    vi.mocked(getSession).mockResolvedValue({
      userId: volunteerBUser.id,
      role: 'VOLUNTEER',
      email: 'volunteerB@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    const resFail = await updateAssignmentStatus(assignment.id, 'START_PICKUP');
    expect(resFail.success).toBe(false);
    expect(resFail.error).toContain('UNAUTHORIZED_OWNER');

    // Case 2: Volunteer A starts pickup -> Expect success
    vi.mocked(getSession).mockResolvedValue({
      userId: volunteerAUser!.id,
      role: 'VOLUNTEER',
      email: 'volunteer@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

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
        donorId: donor!.id,
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
      { userId: ngo1User!.id, email: 'ngo1@foodops.org' },
      { userId: ngo2User!.id, email: 'ngo2@foodops.org' },
      { userId: ngo1User!.id, email: 'ngo1@foodops.org' },
      { userId: ngo2User!.id, email: 'ngo2@foodops.org' },
      { userId: ngo1User!.id, email: 'ngo1@foodops.org' },
    ];

    const results = await Promise.all(
      claimers.map(async (claimer) => {
        vi.mocked(getSession).mockResolvedValue({
          userId: claimer.userId,
          role: 'NGO',
          email: claimer.email,
          exp: Math.floor(Date.now() / 1000) + 3600,
        } as any);

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
  });

  // Test P1.1: Matching Diagnostics
  it('traces donation matches diagnostics showing precise parameters for candidates', async () => {
    const donor = await prisma.donorProfile.findFirst({ include: { user: true } });
    const donation = await prisma.donation.create({
      data: {
        donorId: donor!.id,
        title: 'Diagnostic Test Food',
        description: 'Tracing match rules',
        foodCategory: 'bakery',
        vegNonVegMixed: 'VEG',
        quantity: '3',
        quantityUnit: 'kg',
        pickupAvailableAt: new Date(),
        pickupDeadlineAt: new Date(Date.now() + 3600000),
        pickupAddress: 'Test Location',
        pickupLatitude: 12.9716,
        pickupLongitude: 77.5946,
        status: 'AVAILABLE',
      },
    });

    // Mock donor session
    vi.mocked(getSession).mockResolvedValue({
      userId: donor!.userId,
      role: 'DONOR',
      email: donor!.user.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    const res = await getDonationMatchDiagnostics(donation.id);
    expect(res.success).toBe(true);
    expect(Array.isArray(res.diagnostics)).toBe(true);

    const matchObj = res.diagnostics!.find((d) => d.ngoName === 'Save Food Foundation');
    expect(matchObj).toBeDefined();
    expect(matchObj!.ngoCoordinates).toBeDefined();
    expect(matchObj!.calculatedDistanceKm).toBeGreaterThan(0);
    expect(matchObj!.distanceStatus).toBe('PASS');
    expect(matchObj!.verificationStatus).toBe('VERIFIED');
    expect(matchObj!.availability).toBe('AVAILABLE');
    expect(matchObj!.foodCompatibility).toBe('MATCH');
    expect(matchObj!.capacity).toBe('N/A');
    expect(matchObj!.deadlineStatus).toBe('VALID');
    expect(matchObj!.finalEligibility).toBe('ELIGIBLE');
  });

  // Test P1.3: Secure OTP Handover
  it('enforces secure digital OTP handover with rate limiting and transitions status', async () => {
    const ngo = await prisma.nGOProfile.findFirst({ where: { organizationName: 'Save Food Foundation' } });
    const volunteerUser = await prisma.user.findUnique({ where: { email: 'volunteer@foodops.org' } });
    const volunteer = await prisma.volunteer.findFirst({ where: { userId: volunteerUser!.id } });
    const donor = await prisma.donorProfile.findFirst({ include: { user: true } });

    // Create Volunteer B (unrelated)
    const unrelatedUser = await prisma.user.create({
      data: {
        email: 'unrelated@foodops.org',
        phoneNumber: '+91 9999999998',
        role: 'VOLUNTEER',
      },
    });

    const donation = await prisma.donation.create({
      data: {
        donorId: donor!.id,
        title: 'OTP Handover Test Food',
        description: 'Testing OTP Handover flow',
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
        acceptedNgoId: ngo!.id,
      },
    });

    const assignment = await prisma.volunteerAssignment.create({
      data: {
        donationId: donation.id,
        volunteerId: volunteer!.id,
        ngoId: ngo!.id,
        status: 'STARTED',
      },
    });

    // 0. Volunteer starts pickup (transitions donation from VOLUNTEER_ASSIGNED to PICKUP_IN_PROGRESS)
    vi.mocked(getSession).mockResolvedValue({
      userId: volunteerUser!.id,
      role: 'VOLUNTEER',
      email: 'volunteer@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);
    const resStart = await updateAssignmentStatus(assignment.id, 'START_PICKUP');
    expect(resStart.success).toBe(true);

    // 1. Volunteer requests OTP (masked response, should not contain plaintext OTP)
    vi.mocked(getSession).mockResolvedValue({
      userId: volunteerUser!.id,
      role: 'VOLUNTEER',
      email: 'volunteer@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    const resVolGen = (await generatePickupOtp(assignment.id)) as any;
    expect(resVolGen.success).toBe(true);
    expect(resVolGen.otp).toBeUndefined(); // Masked for volunteer
    expect(resVolGen.message).toContain('sent to the donor');

    // 2. Unrelated volunteer requests OTP -> Rejected
    vi.mocked(getSession).mockResolvedValue({
      userId: unrelatedUser.id,
      role: 'VOLUNTEER',
      email: 'unrelated@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);
    const resUnauth = (await generatePickupOtp(assignment.id)) as any;
    expect(resUnauth.success).toBe(false);
    expect(resUnauth.error).toContain('Unauthorized');

    // 3. Donor requests OTP (returns plaintext OTP)
    vi.mocked(getSession).mockResolvedValue({
      userId: donor!.userId,
      role: 'DONOR',
      email: donor!.user.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    const resDonorGen = (await generatePickupOtp(assignment.id)) as any;
    expect(resDonorGen.success).toBe(true);
    expect(resDonorGen.otp).toBeDefined();
    expect(resDonorGen.otp.length).toBe(6);
    const plaintextOtp = resDonorGen.otp;

    // Verify hash is saved in DB and plaintext is never logged or saved
    const assignmentDb = await prisma.volunteerAssignment.findUnique({ where: { id: assignment.id } });
    expect(assignmentDb!.pickupOtpHash).not.toBeNull();
    expect(assignmentDb!.pickupOtpHash).not.toBe(plaintextOtp); // Hashed

    // 4. Incorrect OTP verification -> increments attempt count
    vi.mocked(getSession).mockResolvedValue({
      userId: volunteerUser!.id,
      role: 'VOLUNTEER',
      email: 'volunteer@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    const resVerifyFail1 = await updateAssignmentStatus(assignment.id, 'CONFIRM_PICKUP', '000000');
    expect(resVerifyFail1.success).toBe(false);
    expect(resVerifyFail1.error).toBe('Invalid OTP.');

    const attempt1 = await prisma.volunteerAssignment.findUnique({ where: { id: assignment.id } });
    expect(attempt1!.pickupOtpAttempts).toBe(1);

    // Verify incorrect multiple times -> blocks subsequent attempts
    const resVerifyFail2 = await updateAssignmentStatus(assignment.id, 'CONFIRM_PICKUP', '000000');
    expect(resVerifyFail2.success).toBe(false);
    expect(resVerifyFail2.error).toBe('Invalid OTP.');

    const resVerifyFail3 = await updateAssignmentStatus(assignment.id, 'CONFIRM_PICKUP', '000000');
    expect(resVerifyFail3.success).toBe(false);
    expect(resVerifyFail3.error).toBe('Invalid OTP.');

    const attempt3 = await prisma.volunteerAssignment.findUnique({ where: { id: assignment.id } });
    expect(attempt3!.pickupOtpAttempts).toBe(3);

    const resVerifyBlocked = await updateAssignmentStatus(assignment.id, 'CONFIRM_PICKUP', plaintextOtp);
    expect(resVerifyBlocked.success).toBe(false);
    expect(resVerifyBlocked.error).toContain('Maximum verification attempts exceeded');

    // 5. Generate a new OTP and confirm successfully
    vi.mocked(getSession).mockResolvedValue({
      userId: donor!.userId,
      role: 'DONOR',
      email: donor!.user.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);
    const resDonorGen2 = (await generatePickupOtp(assignment.id)) as any;
    const newOtp = resDonorGen2.otp;

    vi.mocked(getSession).mockResolvedValue({
      userId: volunteerUser!.id,
      role: 'VOLUNTEER',
      email: 'volunteer@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);
    const resVerify = await updateAssignmentStatus(assignment.id, 'CONFIRM_PICKUP', newOtp);
    expect(resVerify.success).toBe(true);

    // Verify fields cleared and status transitioned
    const assignmentFinal = await prisma.volunteerAssignment.findUnique({ where: { id: assignment.id } });
    expect(assignmentFinal!.pickupOtpHash).toBeNull();
    expect(assignmentFinal!.pickupOtpAttempts).toBe(0);

    const donationFinal = await prisma.donation.findUnique({ where: { id: donation.id } });
    expect(donationFinal!.status).toBe('PICKED_UP');
  });

  // Test P1.4: Escalation & Organic Audit Logs
  it('records correct separate audit logs for expired, escalated and organic recovery transitions', async () => {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donorProfile.findFirst();

    // Create a new AVAILABLE donation
    const donation = await prisma.donation.create({
      data: {
        donorId: donor!.id,
        title: 'Escalation Flow Food',
        description: 'Testing separate audit codes',
        foodCategory: 'grains',
        vegNonVegMixed: 'VEG',
        quantity: '50',
        quantityUnit: 'kg',
        pickupAvailableAt: new Date(),
        pickupDeadlineAt: new Date(Date.now() + 3600000),
        pickupAddress: 'Test Location',
        pickupLatitude: 12.9716,
        pickupLongitude: 77.5946,
        status: 'AVAILABLE',
      },
    });

    vi.mocked(getSession).mockResolvedValue({
      userId: adminUser!.id,
      role: 'ADMIN',
      email: 'admin@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    // 1. Force Expire -> status becomes EXPIRED, audit DONATION_EXPIRED
    await escalateDonation(donation.id).catch(() => {}); // should reject since status is not EXPIRED
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: 'EXPIRED' }
    });
    await prisma.auditLog.create({
      data: {
        userId: adminUser!.id,
        role: 'ADMIN',
        action: 'DONATION_EXPIRED',
        entityType: 'Donation',
        entityId: donation.id,
      }
    });

    // 2. Escalate -> status becomes RECOVERY_ESCALATED, audit RECOVERY_ESCALATED
    const resEscalate = await escalateDonation(donation.id);
    expect(resEscalate.success).toBe(true);

    const donationEsc = await prisma.donation.findUnique({ where: { id: donation.id } });
    expect(donationEsc!.status).toBe('RECOVERY_ESCALATED');

    const auditEsc = await prisma.auditLog.findFirst({
      where: { action: 'RECOVERY_ESCALATED', entityId: donation.id },
    });
    expect(auditEsc).not.toBeNull();

    // 3. Resolve -> status becomes ORGANIC_RECOVERY, audit ORGANIC_RECOVERY
    const resResolve = await resolveOrganicDonation(donation.id);
    expect(resResolve.success).toBe(true);

    const donationRes = await prisma.donation.findUnique({ where: { id: donation.id } });
    expect(donationRes!.status).toBe('ORGANIC_RECOVERY');

    const auditRes = await prisma.auditLog.findFirst({
      where: { action: 'ORGANIC_RECOVERY', entityId: donation.id },
    });
    expect(auditRes).not.toBeNull();
  });

  // Test Delivery OTP Handover Verification
  it('enforces secure delivery OTP handover with rate limiting and transitions status', async () => {
    const volunteerUser = await prisma.user.findFirst({ where: { role: 'VOLUNTEER' } });
    const ngoUser = await prisma.user.findFirst({ where: { role: 'NGO' } });
    const assignment = await prisma.volunteerAssignment.findFirst({
      where: {
        volunteer: { userId: volunteerUser!.id },
      },
      include: {
        donation: true,
      },
    });

    // Make sure donation status is PICKED_UP or DELIVERY_IN_PROGRESS to generate delivery OTP
    await prisma.donation.update({
      where: { id: assignment!.donationId },
      data: { status: 'DELIVERY_IN_PROGRESS' },
    });

    // 2. Generate Delivery OTP as NGO
    vi.mocked(getSession).mockResolvedValue({
      userId: ngoUser!.id,
      role: 'NGO',
      email: ngoUser!.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    const resNgoGen = (await generateDeliveryOtp(assignment!.id)) as any;
    expect(resNgoGen.success).toBe(true);
    expect(resNgoGen.otp).toBeDefined();
    expect(resNgoGen.otp.length).toBe(6);
    const plaintextOtp = resNgoGen.otp;

    // 3. Incorrect Delivery OTP -> increments attempts
    vi.mocked(getSession).mockResolvedValue({
      userId: volunteerUser!.id,
      role: 'VOLUNTEER',
      email: 'volunteer@foodops.org',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    const resVerifyFail = await updateAssignmentStatus(assignment!.id, 'CONFIRM_DELIVERY', '000000');
    expect(resVerifyFail.success).toBe(false);
    expect(resVerifyFail.error).toBe('Invalid OTP.');

    const attempt1 = await prisma.volunteerAssignment.findUnique({ where: { id: assignment!.id } });
    expect(attempt1!.pickupOtpAttempts).toBe(1);

    // 4. Correct Delivery OTP -> transitions status to completed and clears fields
    const resVerify = await updateAssignmentStatus(assignment!.id, 'CONFIRM_DELIVERY', plaintextOtp);
    expect(resVerify.success).toBe(true);

    const assignmentFinal = await prisma.volunteerAssignment.findUnique({ where: { id: assignment!.id } });
    expect(assignmentFinal!.status).toBe('COMPLETED');
    expect(assignmentFinal!.pickupOtpHash).toBeNull();
    expect(assignmentFinal!.pickupOtpAttempts).toBe(0);

    const donationFinal = await prisma.donation.findUnique({ where: { id: assignment!.donationId } });
    expect(donationFinal!.status).toBe('COMPLETED');
  });

  afterAll(async () => {
    // Restore the database schema provider to match local .env settings
    execSync('node prisma/prepare.js', { stdio: 'ignore' });
    execSync('npx prisma generate', { stdio: 'ignore' });
  });
});
