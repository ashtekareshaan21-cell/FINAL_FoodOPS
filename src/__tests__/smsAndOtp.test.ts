import { describe, it, expect, vi, beforeEach } from 'vitest';
import { smsService } from '../services/smsService';
import { authService } from '../services/authService';
import { prisma } from '../lib/db';
import crypto from 'crypto';

vi.mock('../services/auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    oTPAttempt: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('SMS Service & Hashed OTP Verification (Point 1 & Blocker B2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('smsService phone formatting', () => {
    it('formats a standard 10-digit Indian mobile number to E.164 with 91 country code', () => {
      expect(smsService.formatIndianPhone('9876543210')).toBe('919876543210');
      expect(smsService.formatIndianPhone('+91 98765 43210')).toBe('919876543210');
      expect(smsService.formatIndianPhone('91-9876543210')).toBe('919876543210');
    });
  });

  describe('smsService SHA-256 hashing and timing-safe comparison', () => {
    it('hashes 6-digit OTP into a 64-character SHA-256 hex digest', () => {
      const otp = '482910';
      const hash = smsService.hashOtp(otp);
      expect(hash).toHaveLength(64);
      expect(hash).toBe(crypto.createHash('sha256').update(otp).digest('hex'));
    });

    it('verifies the correct OTP matches the stored SHA-256 hash', () => {
      const otp = '654321';
      const hash = smsService.hashOtp(otp);
      expect(smsService.verifyOtpHash(otp, hash)).toBe(true);
      expect(smsService.verifyOtpHash('000000', hash)).toBe(false);
      expect(smsService.verifyOtpHash('654320', hash)).toBe(false);
    });

    it('handles backwards-compatible plaintext verification if present', () => {
      expect(smsService.verifyOtpHash('123456', '123456')).toBe(true);
      expect(smsService.verifyOtpHash('999999', '123456')).toBe(false);
    });
  });

  describe('smsService fail-honest and test mode behavior', () => {
    it('operates in test mode with clear server console log when credentials are unset in non-production', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('MSG91_AUTH_KEY', '');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const result = await smsService.sendOtp('9876543210', '123456');

      expect(result.success).toBe(true);
      expect(result.testMode).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SMS TEST MODE]')
      );

      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it('fails honestly in production when MSG91_AUTH_KEY is missing without marking verified', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('MSG91_AUTH_KEY', '');

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await smsService.sendOtp('9876543210', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMS could not be sent, try again');
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
      vi.unstubAllEnvs();
    });
  });

  describe('authService.sendDonorPhoneOtp integration', () => {
    it('invalidates prior unverified OTPs and stores only the SHA-256 hash', async () => {
      const mockUser = {
        id: 'donor_user_1',
        phoneNumber: '+919876543210',
        role: 'DONOR',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.oTPAttempt.findFirst).mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.oTPAttempt.updateMany).mockResolvedValue({ count: 1 } as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.oTPAttempt.create).mockResolvedValue({ id: 'otp_1' } as any);

      const res = await authService.sendDonorPhoneOtp('donor_user_1');

      expect(res.success).toBe(true);
      expect((res as Record<string, unknown>).devOtp).toBeUndefined(); // Must never return devOtp
      expect(prisma.oTPAttempt.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'donor_user_1',
          purpose: 'DONOR_PHONE_VERIFICATION',
          isUsed: false,
        },
        data: { isUsed: true },
      });

      // Verify the stored OTP was a 64-char SHA-256 hash
      const createCall = vi.mocked(prisma.oTPAttempt.create).mock.calls[0][0];
      expect(createCall.data.otp).toHaveLength(64);
      expect(createCall.data.purpose).toBe('DONOR_PHONE_VERIFICATION');
    });

    it('enforces 60-second cooldown rate limit', async () => {
      const mockUser = { id: 'donor_user_1', phoneNumber: '+919876543210', role: 'DONOR' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.oTPAttempt.findFirst).mockResolvedValue({ id: 'recent_otp' } as any);

      await expect(authService.sendDonorPhoneOtp('donor_user_1')).rejects.toThrow(
        'Please wait 60 seconds before requesting another OTP.'
      );
    });
  });

  describe('authService.verifyDonorPhoneOtp integration', () => {
    it('verifies correct OTP against stored SHA-256 hash and updates user.isPhoneVerified', async () => {
      const mockUser = { id: 'donor_user_1', role: 'DONOR' };
      const rawOtp = '583921';
      const storedHash = smsService.hashOtp(rawOtp);

      const mockAttempt = {
        id: 'attempt_1',
        userId: 'donor_user_1',
        otp: storedHash,
        attemptCount: 0,
        isUsed: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.oTPAttempt.findFirst).mockResolvedValue(mockAttempt as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.oTPAttempt.update).mockResolvedValue({} as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const result = await authService.verifyDonorPhoneOtp('donor_user_1', rawOtp);

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'donor_user_1' },
        data: { isPhoneVerified: true },
      });
      expect(prisma.oTPAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt_1' },
        data: expect.objectContaining({ isUsed: true }),
      });
    });

    it('rejects incorrect OTP and increments attempt count', async () => {
      const mockUser = { id: 'donor_user_1', role: 'DONOR' };
      const rawOtp = '583921';
      const storedHash = smsService.hashOtp(rawOtp);

      const mockAttempt = {
        id: 'attempt_1',
        userId: 'donor_user_1',
        otp: storedHash,
        attemptCount: 1,
        isUsed: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.oTPAttempt.findFirst).mockResolvedValue(mockAttempt as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.oTPAttempt.update).mockResolvedValue({} as any);

      await expect(authService.verifyDonorPhoneOtp('donor_user_1', '000000')).rejects.toThrow(
        'Invalid OTP code.'
      );

      expect(prisma.oTPAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt_1' },
        data: expect.objectContaining({
          attemptCount: { increment: 1 },
        }),
      });
    });

    it('locks out when attemptCount >= 5', async () => {
      const mockUser = { id: 'donor_user_1', role: 'DONOR' };
      const mockAttempt = {
        id: 'attempt_1',
        userId: 'donor_user_1',
        otp: 'hash',
        attemptCount: 5,
        isUsed: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.oTPAttempt.findFirst).mockResolvedValue(mockAttempt as any);

      await expect(authService.verifyDonorPhoneOtp('donor_user_1', '123456')).rejects.toThrow(
        'Too many invalid attempts. Please request a new OTP.'
      );
    });
  });
});
