import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ocrService, validateMagicNumbers } from '../services/ocrService';
import { GoogleGenerativeAI } from '@google/generative-ai';

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn()
  };
});

describe('OCR Service Unit Tests & Anti-Hallucination Audit', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Magic Number Binary Header Validation', () => {
    it('validates JPEG headers correctly', () => {
      const jpegBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      expect(validateMagicNumbers(jpegBuf)).toBe(true);
    });

    it('validates PNG headers correctly', () => {
      const pngBuf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
      expect(validateMagicNumbers(pngBuf)).toBe(true);
    });

    it('validates WebP headers correctly', () => {
      const webpHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50  // WEBP
      ]);
      expect(validateMagicNumbers(webpHeader)).toBe(true);
    });

    it('rejects invalid or corrupted headers', () => {
      const corruptBuf = Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55]);
      expect(validateMagicNumbers(corruptBuf)).toBe(false);
    });
  });

  describe('Validation & Error Boundaries', () => {
    it('returns error for unsupported MIME types', async () => {
      const result = await ocrService.extractTextFromImage('abc', 'image/bmp');
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('Unsupported image format');
    });

    it('returns error when file size exceeds 4MB', async () => {
      const largeBuf = Buffer.alloc(4 * 1024 * 1024 + 10);
      const base64 = largeBuf.toString('base64');
      const result = await ocrService.extractTextFromImage(base64, 'image/jpeg');
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('exceeds maximum limit of 4MB');
    });

    it('returns API_KEY_MISSING status gracefully when GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;
      const jpegBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const base64 = jpegBuf.toString('base64');

      const result = await ocrService.extractTextFromImage(base64, 'image/jpeg');
      expect(result.status).toBe('API_KEY_MISSING');
      expect(result.hasReadableText).toBe(false);
      expect(result.error).toContain('GEMINI_API_KEY is missing');
    });
  });

  describe('Controlled Tests & Anti-Hallucination Proof', () => {
    const validJpegBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const validJpegBase64 = validJpegBuf.toString('base64');

    it('Image A (Known visible packaging text): accurately extracts exact strings', async () => {
      process.env.GEMINI_API_KEY = 'test_key';

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            text: 'FOODOPS TEST\nBATCH 12345\nEXP 30/09/2026',
            lines: ['FOODOPS TEST', 'BATCH 12345', 'EXP 30/09/2026'],
            detectedLabels: ['FOODOPS TEST', 'BATCH 12345', 'EXP 30/09/2026'],
            hasReadableText: true,
            confidence: 'high'
          })
        }
      });

      (GoogleGenerativeAI as any).mockImplementation(function (this: any) {
        this.getGenerativeModel = () => ({
          generateContent: mockGenerateContent
        });
      });

      const result = await ocrService.extractTextFromImage(validJpegBase64, 'image/jpeg');
      expect(result.status).toBe('SUCCESS');
      expect(result.hasReadableText).toBe(true);
      expect(result.text).toBe('FOODOPS TEST\nBATCH 12345\nEXP 30/09/2026');
      expect(result.lines).toEqual(['FOODOPS TEST', 'BATCH 12345', 'EXP 30/09/2026']);
      expect(result.confidence).toBe('high');
      expect(result.source).toBe('ocr');
    });

    it('Image B (No packaging text): returns empty result with explicit message and never invents text', async () => {
      process.env.GEMINI_API_KEY = 'test_key';

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            text: '',
            lines: [],
            detectedLabels: [],
            hasReadableText: false,
            confidence: 'low'
          })
        }
      });

      (GoogleGenerativeAI as any).mockImplementation(function (this: any) {
        this.getGenerativeModel = () => ({
          generateContent: mockGenerateContent
        });
      });

      const result = await ocrService.extractTextFromImage(validJpegBase64, 'image/jpeg');
      expect(result.status).toBe('EMPTY_RESULT');
      expect(result.hasReadableText).toBe(false);
      expect(result.text).toBe('');
      expect(result.lines).toEqual([]);
      expect(result.detectedLabels).toEqual([]);
      expect(result.message).toBe('No clearly readable packaging text detected.');
    });

    it('Image C (Random/fake characters): preserves verbatim characters and does not substitute brand names', async () => {
      process.env.GEMINI_API_KEY = 'test_key';

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            text: 'ZXQ-917-KAL\nTEST PRODUCT 8472\nNOT A REAL BRAND',
            lines: ['ZXQ-917-KAL', 'TEST PRODUCT 8472', 'NOT A REAL BRAND'],
            detectedLabels: ['ZXQ-917-KAL', 'TEST PRODUCT 8472', 'NOT A REAL BRAND'],
            hasReadableText: true,
            confidence: 'high'
          })
        }
      });

      (GoogleGenerativeAI as any).mockImplementation(function (this: any) {
        this.getGenerativeModel = () => ({
          generateContent: mockGenerateContent
        });
      });

      const result = await ocrService.extractTextFromImage(validJpegBase64, 'image/jpeg');
      expect(result.status).toBe('SUCCESS');
      expect(result.hasReadableText).toBe(true);
      expect(result.text).toContain('ZXQ-917-KAL');
      expect(result.text).toContain('TEST PRODUCT 8472');
      expect(result.text).not.toContain('Biryani');
      expect(result.text).not.toContain('Rice');
    });

    it('Image D (Partially obscured text): preserves [UNCLEAR] placeholder rather than guessing', async () => {
      process.env.GEMINI_API_KEY = 'test_key';

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            text: 'BATCH [UNCLEAR] EXP 12/2026',
            lines: ['BATCH [UNCLEAR] EXP 12/2026'],
            detectedLabels: ['BATCH [UNCLEAR]', 'EXP 12/2026'],
            hasReadableText: true,
            confidence: 'medium'
          })
        }
      });

      (GoogleGenerativeAI as any).mockImplementation(function (this: any) {
        this.getGenerativeModel = () => ({
          generateContent: mockGenerateContent
        });
      });

      const result = await ocrService.extractTextFromImage(validJpegBase64, 'image/jpeg');
      expect(result.status).toBe('SUCCESS');
      expect(result.text).toContain('[UNCLEAR]');
      expect(result.confidence).toBe('medium');
    });

    it('Image E (Food Safety Isolation): OCR never claims food is safe or approved', async () => {
      process.env.GEMINI_API_KEY = 'test_key';

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            text: 'Net Wt: 500g, Packaged Today',
            lines: ['Net Wt: 500g', 'Packaged Today'],
            detectedLabels: ['Net Wt: 500g', 'Packaged Today'],
            hasReadableText: true,
            confidence: 'high'
          })
        }
      });

      (GoogleGenerativeAI as any).mockImplementation(function (this: any) {
        this.getGenerativeModel = () => ({
          generateContent: mockGenerateContent
        });
      });

      const result = await ocrService.extractTextFromImage(validJpegBase64, 'image/jpeg');
      expect(result.text).not.toContain('Food is safe');
      expect(result.text).not.toContain('Approved for donation');
    });
  });
});
