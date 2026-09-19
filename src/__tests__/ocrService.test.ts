import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ocrService, validateMagicNumbers } from '../services/ocrService';
import { GoogleGenerativeAI } from '@google/generative-ai';

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn()
  };
});

describe('OCR Service Unit Tests', () => {
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
      expect(result.error).toContain('GEMINI_API_KEY is missing');
    });
  });

  describe('Mocked Gemini API Execution', () => {
    it('successfully parses valid JSON response from Gemini model', async () => {
      process.env.GEMINI_API_KEY = 'test_key';
      const jpegBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const base64 = jpegBuf.toString('base64');

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            text: 'Chapati & Mix Veg Meal Box - Packaged 2:00 PM',
            detectedLabels: ['Chapati', 'Mix Veg', 'Packaged 2:00 PM'],
            confidence: 94
          })
        }
      });

      (GoogleGenerativeAI as any).mockImplementation(function (this: any) {
        this.getGenerativeModel = () => ({
          generateContent: mockGenerateContent
        });
      });

      const result = await ocrService.extractTextFromImage(base64, 'image/jpeg');
      expect(result.status).toBe('SUCCESS');
      expect(result.text).toBe('Chapati & Mix Veg Meal Box - Packaged 2:00 PM');
      expect(result.detectedLabels).toEqual(['Chapati', 'Mix Veg', 'Packaged 2:00 PM']);
      expect(result.confidence).toBe(94);
      expect(result.source).toBe('ocr');
    });

    it('handles empty OCR result gracefully without throwing', async () => {
      process.env.GEMINI_API_KEY = 'test_key';
      const jpegBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const base64 = jpegBuf.toString('base64');

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            text: '',
            detectedLabels: [],
            confidence: 0
          })
        }
      });

      (GoogleGenerativeAI as any).mockImplementation(function (this: any) {
        this.getGenerativeModel = () => ({
          generateContent: mockGenerateContent
        });
      });

      const result = await ocrService.extractTextFromImage(base64, 'image/jpeg');
      expect(result.status).toBe('EMPTY_RESULT');
      expect(result.text).toBe('');
      expect(result.detectedLabels).toEqual([]);
    });
  });
});
