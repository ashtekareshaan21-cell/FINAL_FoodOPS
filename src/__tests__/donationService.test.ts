/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { donationService } from '../services/donationService';
import { donationRepository } from '../repositories/donationRepository';
import { ngoRepository } from '../repositories/ngoRepository';
import { donorRepository } from '../repositories/donorRepository';
import { volunteerRepository } from '../repositories/volunteerRepository';
import { emailService } from '../services/emailService';
import { prisma } from '../lib/db';

vi.mock('../repositories/donationRepository');
vi.mock('../repositories/ngoRepository');
vi.mock('../repositories/donorRepository');
vi.mock('../repositories/volunteerRepository');
vi.mock('../services/emailService');
vi.mock('../services/auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue({} as any),
  },
}));
vi.mock('../lib/db', () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('donationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDonation', () => {
    it('creates a donation and registers notifications successfully', async () => {
      const mockDonor = { id: 'donor_1', userId: 'user_donor', verificationStatus: 'VERIFIED' };
      vi.mocked(donorRepository.findByUserId).mockResolvedValue(mockDonor as any);
      
      const mockCreatedDonation = {
        id: 'donation_1',
        donorId: 'donor_1',
        title: 'Fresh Bread',
        foodCategory: 'bakery',
        vegNonVegMixed: 'VEG',
        pickupLatitude: 18.5,
        pickupLongitude: 73.8,
        status: 'AVAILABLE',
        pickupDeadlineAt: new Date(Date.now() + 3600000),
      };

      vi.spyOn(prisma, '$transaction').mockResolvedValue(mockCreatedDonation as any);

      const mockNGOs = [
        {
          id: 'ngo_1',
          userId: 'user_ngo_1',
          status: 'VERIFIED',
          availability: 'AVAILABLE',
          baseLatitude: 18.502,
          baseLongitude: 73.802,
          serviceRadiusKm: 5,
          acceptedFoodTypes: 'BAKERY,PACKAGED_FOOD',
        },
      ];

      vi.mocked(ngoRepository.findMany).mockResolvedValue(mockNGOs as any);

      const input = {
        title: 'Fresh Bread',
        description: 'Warm out of the oven',
        foodCategory: 'bakery',
        vegNonVegMixed: 'VEG',
        quantity: '5',
        quantityUnit: 'kg',
        estimatedServings: 15,
        preparationTime: new Date(),
        pickupAvailableAt: new Date(),
        pickupDeadlineAt: new Date(Date.now() + 3600000),
        pickupAddress: '456 Baker St',
        pickupLatitude: 18.5,
        pickupLongitude: 73.8,
        specialNotes: '',
      };

      const result = await donationService.createDonation('user_donor', input);

      expect(donorRepository.findByUserId).toHaveBeenCalledWith('user_donor');
      expect(ngoRepository.findMany).toHaveBeenCalled();
      expect(donationRepository.createManyNotifications).toHaveBeenCalled();
      expect(result.id).toBe('donation_1');
    });

    it('rejects donation creation if donor account is pending verification', async () => {
      const unverifiedDonor = { id: 'donor_unverified', userId: 'user_unverified', verificationStatus: 'PENDING_VERIFICATION' };
      vi.mocked(donorRepository.findByUserId).mockResolvedValue(unverifiedDonor as any);

      const input = {
        title: 'Pending Food',
        description: 'Test food',
        foodCategory: 'mixed',
        vegNonVegMixed: 'VEG',
        quantity: '10',
        quantityUnit: 'kg',
        pickupAvailableAt: new Date(),
        pickupDeadlineAt: new Date(Date.now() + 3600000),
        pickupAddress: '123 Main St',
        pickupLatitude: 18.5,
        pickupLongitude: 73.8,
      };

      await expect(donationService.createDonation('user_unverified', input)).rejects.toThrow(
        'Account pending verification. You must be a verified donor to publish listings.'
      );
    });
  });

  describe('acceptDonation', () => {
    it('allows an NGO to claim an available donation', async () => {
      const mockNgo = {
        id: 'ngo_1',
        userId: 'user_ngo',
        status: 'VERIFIED',
        baseLatitude: 18.5,
        baseLongitude: 73.8,
        serviceRadiusKm: 5,
        organizationName: 'Food Rescue NGO',
      };
      vi.mocked(ngoRepository.findByUserId).mockResolvedValue(mockNgo as any);

      const mockDonation = {
        id: 'donation_1',
        status: 'AVAILABLE',
        pickupDeadlineAt: new Date(Date.now() + 3600000),
        pickupLatitude: 18.5,
        pickupLongitude: 73.8,
        title: 'Hot Meals',
        donor: {
          user: {
            email: 'donor@example.com',
          },
        },
      };

      vi.spyOn(prisma, '$transaction').mockResolvedValue({
        updated: { ...mockDonation, status: 'ACCEPTED', acceptedNgoId: 'ngo_1' },
        donorEmail: 'donor@example.com',
        title: 'Hot Meals',
      } as any);

      const result = await donationService.acceptDonation('user_ngo', 'donation_1');

      expect(ngoRepository.findByUserId).toHaveBeenCalledWith('user_ngo');
      expect(emailService.sendDonationAcceptedEmail).toHaveBeenCalledWith(
        'donor@example.com',
        'Hot Meals',
        'Food Rescue NGO'
      );
      expect(result.status).toBe('ACCEPTED');
    });
  });
});
