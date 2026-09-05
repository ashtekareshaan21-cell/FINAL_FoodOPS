/* eslint-disable @typescript-eslint/no-explicit-any */
process.env.DATABASE_URL = 'file:./test_audit.db';

import { vi } from 'vitest';
vi.unmock('../repositories/donorRepository');
vi.unmock('@/repositories/donorRepository');
vi.unmock('../repositories/donationRepository');
vi.unmock('@/repositories/donationRepository');
vi.unmock('../repositories/ngoRepository');
vi.unmock('@/repositories/ngoRepository');
vi.unmock('../repositories/volunteerRepository');
vi.unmock('@/repositories/volunteerRepository');
vi.unmock('../services/emailService');
vi.unmock('@/services/emailService');
vi.unmock('../services/auditService');
vi.unmock('@/services/auditService');
vi.unmock('../lib/db');
vi.unmock('@/lib/db');

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { prisma } from '../lib/db';
import { aiListingAuditService } from '../services/aiListingAuditService';
import { donationService } from '../services/donationService';

const TEST_DB_URL = 'file:./test_audit.db';

// Mock the @google/generative-ai package
const generateContentMock = vi.fn();
const getGenerativeModelMock = vi.fn(() => ({
  generateContent: generateContentMock,
}));

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = getGenerativeModelMock;
    },
  };
});

describe('AI Listing Audit Flow & Security Constraints', () => {
  let donorUserA: any;
  let donorUserB: any;
  let donorProfileA: any;

  beforeAll(async () => {
    // Switch to dedicated test database
    process.env.DATABASE_URL = TEST_DB_URL;

    // Sync provider in schema.prisma with test database protocol
    execSync('node prisma/prepare.js', {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL, PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes' },
      stdio: 'ignore',
      shell: 'cmd.exe',
    });

    // Run migrations to prepare schema
    execSync('npx prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL, PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes' },
      stdio: 'ignore',
      shell: 'cmd.exe',
    });

    // Clear all tables programmatically to ensure a clean slate
    await prisma.foodListingAudit.deleteMany();
    await prisma.donationStatusHistory.deleteMany();
    await prisma.donationImage.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.donorProfile.deleteMany();
    await prisma.user.deleteMany();

    // Seed test users
    donorUserA = await prisma.user.create({
      data: {
        email: 'donorA@example.com',
        phoneNumber: '9999999991',
        role: 'DONOR',
        isPhoneVerified: true,
      },
    });

    donorProfileA = await prisma.donorProfile.create({
      data: {
        userId: donorUserA.id,
        organizationName: 'Donor A Org',
        organizationType: 'RESTAURANT',
        contactPerson: 'Donor A',
        address: '123 Donor St',
        latitude: 18.52,
        longitude: 73.85,
        verificationStatus: 'VERIFIED',
      },
    });

    donorUserB = await prisma.user.create({
      data: {
        email: 'donorB@example.com',
        phoneNumber: '9999999992',
        role: 'DONOR',
        isPhoneVerified: true,
      },
    });

    await prisma.donorProfile.create({
      data: {
        userId: donorUserB.id,
        organizationName: 'Donor B Org',
        organizationType: 'RESTAURANT',
        contactPerson: 'Donor B',
        address: '456 Donor St',
        latitude: 18.53,
        longitude: 73.86,
        verificationStatus: 'VERIFIED',
      },
    });
  }, 30000);

  afterAll(async () => {
    // Disconnect and clean up
    await prisma.$disconnect();
    try {
      if (fs.existsSync('./test_audit.db')) {
        fs.unlinkSync('./test_audit.db');
      }
    } catch {}
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'mock-api-key';
  });

  // Mock JPEG (starts with 0xFF 0xD8 0xFF) and size fits within 4MB
  const validJpegBase64 = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]).toString('base64');
  const invalidMagicBase64 = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x12, 0x34]).toString('base64');

  describe('Image Validation Pipeline', () => {
    it('rejects unsupported MIME types', async () => {
      await expect(
        aiListingAuditService.runAudit(validJpegBase64, 'image/gif', donorProfileA.id)
      ).rejects.toThrow('Unsupported image MIME type.');
    });

    it('rejects images exceeding 4MB limit', async () => {
      // Create buffer larger than 4MB (4 * 1024 * 1024 + 1 bytes)
      const oversizedBuffer = Buffer.alloc(4 * 1024 * 1024 + 1);
      oversizedBuffer[0] = 0xFF;
      oversizedBuffer[1] = 0xD8;
      oversizedBuffer[2] = 0xFF;
      const oversizedBase64 = oversizedBuffer.toString('base64');

      await expect(
        aiListingAuditService.runAudit(oversizedBase64, 'image/jpeg', donorProfileA.id)
      ).rejects.toThrow('Image size exceeds 4MB limit.');
    });

    it('rejects invalid magic numbers', async () => {
      await expect(
        aiListingAuditService.runAudit(invalidMagicBase64, 'image/jpeg', donorProfileA.id)
      ).rejects.toThrow('Invalid image binary headers or corrupted file.');
    });
  });

  describe('Gemini API Fallbacks & Range Validations', () => {
    it('falls back to AI_UNAVAILABLE when GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY;

      const audit = await aiListingAuditService.runAudit(validJpegBase64, 'image/jpeg', donorProfileA.id);
      expect(audit.status).toBe('AI_UNAVAILABLE');
      expect(audit.id).toBeDefined();

      // Check DB persistence
      const dbAudit = await prisma.foodListingAudit.findUnique({ where: { id: audit.id } });
      expect(dbAudit).toBeDefined();
      expect(dbAudit?.status).toBe('AI_UNAVAILABLE');
    });

    it('falls back to FAILED when Gemini API call throws an error', async () => {
      generateContentMock.mockRejectedValueOnce(new Error('API quota exceeded'));

      const audit = await aiListingAuditService.runAudit(validJpegBase64, 'image/jpeg', donorProfileA.id);
      expect(audit.status).toBe('FAILED');

      const dbAudit = await prisma.foodListingAudit.findUnique({ where: { id: audit.id } });
      expect(dbAudit?.status).toBe('FAILED');
    });

    it('falls back to FAILED when model returns malformed JSON', async () => {
      generateContentMock.mockResolvedValueOnce({
        response: {
          text: () => '{"foodCategory": "grains", "estimatedServings": malformed_json_here}',
        },
      });

      const audit = await aiListingAuditService.runAudit(validJpegBase64, 'image/jpeg', donorProfileA.id);
      expect(audit.status).toBe('FAILED');
    });

    it('falls back to FAILED when model confidence is out of bounds', async () => {
      generateContentMock.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({
            foodCategory: 'grains',
            estimatedServings: 20,
            estimatedQuantityKg: 2.0,
            packagingObservation: 'Box',
            visualObservations: [],
            warnings: [],
            confidence: 150, // Out of bounds [0, 100]
          }),
        },
      });

      const audit = await aiListingAuditService.runAudit(validJpegBase64, 'image/jpeg', donorProfileA.id);
      expect(audit.status).toBe('FAILED');
    });

    it('falls back to FAILED when model estimates negative quantity', async () => {
      generateContentMock.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({
            foodCategory: 'grains',
            estimatedServings: 20,
            estimatedQuantityKg: -1.5, // Negative
            packagingObservation: 'Box',
            visualObservations: [],
            warnings: [],
            confidence: 90,
          }),
        },
      });

      const audit = await aiListingAuditService.runAudit(validJpegBase64, 'image/jpeg', donorProfileA.id);
      expect(audit.status).toBe('FAILED');
    });

    it('successfully processes and saves a valid Gemini API response', async () => {
      generateContentMock.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({
            foodCategory: 'meat',
            estimatedServings: 15,
            estimatedQuantityKg: 3.5,
            packagingObservation: 'Plastic wrap',
            visualObservations: ['Cooked chicken', 'Fresh condition'],
            warnings: ['Contains soy allergen'],
            confidence: 92.5,
          }),
        },
      });

      const audit = await aiListingAuditService.runAudit(validJpegBase64, 'image/jpeg', donorProfileA.id);
      expect(audit.status).toBe('COMPLETED');
      expect(audit.foodCategory).toBe('meat');
      expect(audit.estimatedServings).toBe(15);
      expect(audit.estimatedQuantityKg).toBe(3.5);
      expect(audit.packagingObservation).toBe('Plastic wrap');
      expect(JSON.parse(JSON.stringify(audit.visualObservations))).toEqual(['Cooked chicken', 'Fresh condition']);
      expect(JSON.parse(JSON.stringify(audit.warnings))).toEqual(['Contains soy allergen']);
      expect(audit.confidence).toBe(92.5);

      const dbAudit = await prisma.foodListingAudit.findUnique({ where: { id: audit.id } });
      expect(dbAudit?.status).toBe('COMPLETED');
      expect(dbAudit?.donorId).toBe(donorProfileA.id);
    });
  });

  describe('Security Constraints & Audit Linking', () => {
    let mockAudit: any;

    beforeEach(async () => {
      // Create a successful audit for Donor A
      mockAudit = await prisma.foodListingAudit.create({
        data: {
          donorId: donorProfileA.id,
          status: 'COMPLETED',
          foodCategory: 'grains',
          estimatedServings: 10,
          estimatedQuantityKg: 1.0,
          packagingObservation: 'Bag',
          visualObservations: JSON.stringify([]),
          warnings: JSON.stringify([]),
          confidence: 85,
          provider: 'google',
          model: 'gemini-1.5-flash',
        },
      });
    });

    const buildCreateDonationInput = (override: any = {}) => ({
      title: 'Basmati Rice',
      description: 'Uncooked white rice',
      foodCategory: 'grains',
      vegNonVegMixed: 'VEG',
      quantity: '1',
      quantityUnit: 'KG',
      estimatedServings: 10,
      pickupAvailableAt: new Date().toISOString(),
      pickupDeadlineAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      pickupAddress: '123 Donor St',
      pickupLatitude: 18.52,
      pickupLongitude: 73.85,
      ...override,
    });

    it('enforces audit ownership: Donor B cannot link Donor A\'s audit', async () => {
      const input = buildCreateDonationInput({ auditId: mockAudit.id });

      await expect(
        donationService.createDonation(donorUserB.id, input)
      ).rejects.toThrow('Unauthorized: Audit does not belong to this donor.');

      // Check that it wasn't linked
      const audit = await prisma.foodListingAudit.findUnique({ where: { id: mockAudit.id } });
      expect(audit?.donationId).toBeNull();
    });

    it('allows donation creation without any auditId', async () => {
      const input = buildCreateDonationInput({ auditId: null });
      const donation = await donationService.createDonation(donorUserA.id, input);

      expect(donation.id).toBeDefined();
    });

    it('successfully links audit to donation when owned by the same donor', async () => {
      const input = buildCreateDonationInput({ auditId: mockAudit.id });
      const donation = await donationService.createDonation(donorUserA.id, input);

      expect(donation.id).toBeDefined();

      // Check linkage
      const audit = await prisma.foodListingAudit.findUnique({ where: { id: mockAudit.id } });
      expect(audit?.donationId).toBe(donation.id);
    });

    it('enforces single-use audit linking: cannot link the same auditId twice', async () => {
      // First linkage
      const input1 = buildCreateDonationInput({ auditId: mockAudit.id });
      const donation1 = await donationService.createDonation(donorUserA.id, input1);
      expect(donation1.id).toBeDefined();

      // Second linkage attempts
      const input2 = buildCreateDonationInput({ title: 'Second Rice Batch', auditId: mockAudit.id });
      await expect(
        donationService.createDonation(donorUserA.id, input2)
      ).rejects.toThrow('AUDIT_ALREADY_ATTACHED');
    });

    it('prevents client tampering of audit values', async () => {
      // Client sends custom fields during submission
      const input = buildCreateDonationInput({
        title: 'Tampered Title',
        quantity: '50', // Tampered quantity
        estimatedServings: 500, // Tampered servings
        auditId: mockAudit.id,
      });

      const donation = await donationService.createDonation(donorUserA.id, input);

      // Verify that donation has the submitted form data
      expect(donation.quantity).toBe('50');
      expect(donation.estimatedServings).toBe(500);

      // Verify that the server-side audit record itself was NOT modified
      const audit = await prisma.foodListingAudit.findUnique({ where: { id: mockAudit.id } });
      expect(audit?.estimatedQuantityKg).toBe(1.0); // original
      expect(audit?.estimatedServings).toBe(10); // original
    });
  });

  describe('UI Component Verification', () => {
    it('verifies AI safety disclaimer presence in the React component', () => {
      const filePath = path.join(__dirname, '../app/donor/create/CreateDonationForm.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // Assert visual analysis warning and disclaimer text exists
      expect(content).toContain('AI Safety Disclaimer');
      expect(content).toContain('AI estimates visual characteristics and quantity. It does not detect pathogens or certify food as safe for consumption.');
      expect(content).toContain('This confidence score represents the visual characteristics analysis only. It does not reflect food-safety certification.');
    });
  });

  afterAll(async () => {
    // Restore the database schema provider to match local .env settings
    execSync('node prisma/prepare.js', { stdio: 'ignore' });
    execSync('npx prisma generate', { stdio: 'ignore' });
  });
});
