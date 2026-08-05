/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../services/authService';
import { userRepository } from '../repositories/userRepository';
import { donorRepository } from '../repositories/donorRepository';
import { ngoRepository } from '../repositories/ngoRepository';
import { volunteerRepository } from '../repositories/volunteerRepository';
import { hashPassword, verifyPassword } from '../lib/password';
import { prisma } from '../lib/db';

vi.mock('../repositories/userRepository');
vi.mock('../repositories/donorRepository');
vi.mock('../repositories/ngoRepository');
vi.mock('../repositories/volunteerRepository');
vi.mock('../lib/password');
vi.mock('../lib/db', () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerDonor', () => {
    it('registers a donor successfully', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(hashPassword).mockReturnValue('hashed_password');
      vi.mocked(userRepository.createUser).mockResolvedValue({
        id: 'user_1',
        email: 'donor@example.com',
        phoneNumber: '1234567890',
        passwordHash: 'hashed_password',
        role: 'DONOR',
        isPhoneVerified: true,
        isEmailVerified: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = {
        email: 'donor@example.com',
        password: 'password',
        phoneNumber: '1234567890',
        organizationName: 'Donor Corp',
        organizationType: 'BUSINESS',
        contactPerson: 'Alice',
        address: '123 Main St',
        latitude: 10,
        longitude: 20,
      };

      const result = await authService.registerDonor(input);

      expect(userRepository.findByEmail).toHaveBeenCalledWith('donor@example.com');
      expect(hashPassword).toHaveBeenCalledWith('password');
      expect(userRepository.createUser).toHaveBeenCalled();
      expect(donorRepository.createDonorProfile).toHaveBeenCalled();
      expect(result.id).toBe('user_1');
    });

    it('throws error if user already exists', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({ id: 'existing' } as any);

      const input = {
        email: 'donor@example.com',
        phoneNumber: '1234567890',
        organizationName: 'Donor Corp',
        organizationType: 'BUSINESS',
        contactPerson: 'Alice',
        address: '123 Main St',
        latitude: 10,
        longitude: 20,
      };

      await expect(authService.registerDonor(input)).rejects.toThrow('Email or Phone number already registered.');
    });
  });

  describe('login', () => {
    it('logs in a user successfully', async () => {
      const mockUser = {
        id: 'user_1',
        email: 'donor@example.com',
        passwordHash: 'hashed_password',
      };
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(verifyPassword).mockReturnValue(true);

      const result = await authService.login({ email: 'donor@example.com', password: 'password' });

      expect(userRepository.findByEmail).toHaveBeenCalledWith('donor@example.com');
      expect(verifyPassword).toHaveBeenCalledWith('password', 'hashed_password');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith('user_1');
      expect(result.id).toBe('user_1');
    });

    it('throws error for invalid password', async () => {
      const mockUser = {
        id: 'user_1',
        email: 'donor@example.com',
        passwordHash: 'hashed_password',
      };
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(verifyPassword).mockReturnValue(false);

      await expect(
        authService.login({ email: 'donor@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password.');
    });
  });
});
