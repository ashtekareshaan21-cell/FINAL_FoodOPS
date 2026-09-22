import { GoogleGenerativeAI } from '@google/generative-ai';
import * as crypto from 'crypto';

export interface OCRResult {
  success: boolean;
  hasReadableText: boolean;
  text: string;
  lines: string[];
  detectedLabels: string[];
  confidence: 'high' | 'medium' | 'low';
  message?: string;
  source: 'ocr';
  status: 'SUCCESS' | 'FAILED' | 'API_KEY_MISSING' | 'EMPTY_RESULT';
  error?: string;
}

const STRICT_OCR_PROMPT = `You are a strict, high-accuracy optical character recognition (OCR) engine.
Extract ONLY text that is visibly and legibly present in the provided image.

STRICT RULES:
1. Extract ONLY visible text printed or handwritten on packages, labels, containers, or tags.
2. Do NOT infer, guess, autocomplete, correct, translate, or invent text.
3. Preserve the visible text as closely as possible to what is actually printed.
4. If a word, number, or character is partially visible, obscured, or uncertain, mark it as [UNCLEAR] rather than guessing.
5. If there is NO readable packaging or printed text visible in the image, return an empty text string ("") and empty arrays.
6. Do NOT provide product descriptions, food safety conclusions, nutritional claims, expiry predictions, or any information that is not visibly readable.
7. Return strictly valid JSON with this schema:
{
  "text": "Full extracted visible text preserving linebreaks, or empty string if no readable text",
  "lines": ["each individual line of visible text exactly as seen"],
  "detectedLabels": ["specific short printed words, dates, batch numbers, or brand terms visibly seen"],
  "hasReadableText": true,
  "confidence": "high"
}
Note: "confidence" must be strictly one of "high", "medium", or "low" representing visual character legibility.
No markdown formatting, code blocks, or text outside the JSON object.`;

export function validateMagicNumbers(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // JPEG: [0xFF, 0xD8, 0xFF]
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  if (buffer.length >= 8) {
    const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    let isPng = true;
    for (let i = 0; i < 8; i++) {
      if (buffer[i] !== pngHeader[i]) {
        isPng = false;
        break;
      }
    }
    if (isPng) return true;
  }

  // WebP: RIFF and WEBP
  if (buffer.length >= 12) {
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    if (isRiff && isWebp) return true;
  }

  return false;
}

export const ocrService = {
  async extractTextFromImage(base64Image: string, mimeType: string): Promise<OCRResult> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const normalizedMime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;

    if (!allowedMimeTypes.includes(mimeType)) {
      return {
        success: false,
        hasReadableText: false,
        text: '',
        lines: [],
        detectedLabels: [],
        confidence: 'low',
        source: 'ocr',
        status: 'FAILED',
        error: 'Unsupported image format. Allowed formats: JPEG, PNG, WEBP.'
      };
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Image, 'base64');
    } catch {
      return {
        success: false,
        hasReadableText: false,
        text: '',
        lines: [],
        detectedLabels: [],
        confidence: 'low',
        source: 'ocr',
        status: 'FAILED',
        error: 'Invalid base64 image data.'
      };
    }

    if (buffer.length === 0) {
      return {
        success: false,
        hasReadableText: false,
        text: '',
        lines: [],
        detectedLabels: [],
        confidence: 'low',
        source: 'ocr',
        status: 'EMPTY_RESULT',
        error: 'Image file is empty (0 bytes).'
      };
    }

    if (buffer.length > 4 * 1024 * 1024) {
      return {
        success: false,
        hasReadableText: false,
        text: '',
        lines: [],
        detectedLabels: [],
        confidence: 'low',
        source: 'ocr',
        status: 'FAILED',
        error: 'Image size exceeds maximum limit of 4MB.'
      };
    }

    if (!validateMagicNumbers(buffer)) {
      return {
        success: false,
        hasReadableText: false,
        text: '',
        lines: [],
        detectedLabels: [],
        confidence: 'low',
        source: 'ocr',
        status: 'FAILED',
        error: 'Corrupted image file or invalid binary signature.'
      };
    }

    // Safe server-side telemetry (never logs API keys, auth headers, or raw base64 data)
    const imageFingerprint = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 12);
    console.log(`[OCR Pipeline] Request received: MIME=${normalizedMime}, Size=${buffer.length} bytes, Fingerprint=${imageFingerprint}`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return {
        success: false,
        hasReadableText: false,
        text: '',
        lines: [],
        detectedLabels: [],
        confidence: 'low',
        message: 'GEMINI_API_KEY is missing or not configured in environment.',
        source: 'ocr',
        status: 'API_KEY_MISSING',
        error: 'GEMINI_API_KEY is missing or not configured in environment.'
      };
    }

    const candidateModels = Array.from(new Set([
      process.env.GEMINI_MODEL,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ].filter(Boolean))) as string[];

    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[OCR Pipeline] Calling model "${modelName}" for image ${imageFingerprint}`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const response = await model.generateContent([
          {
            inlineData: {
              data: base64Image,
              mimeType: normalizedMime,
            },
          },
          STRICT_OCR_PROMPT,
        ]);

        const responseText = response.response.text();
        if (!responseText || responseText.trim() === '') {
          console.log(`[OCR Pipeline] Model "${modelName}" returned empty response for image ${imageFingerprint}`);
          return {
            success: true,
            hasReadableText: false,
            text: '',
            lines: [],
            detectedLabels: [],
            confidence: 'low',
            message: 'No clearly readable packaging text detected.',
            source: 'ocr',
            status: 'EMPTY_RESULT'
          };
        }

        let cleaned = responseText.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleaned);

        const rawText = typeof parsed.text === 'string' ? parsed.text.trim() : '';
        const rawLines = Array.isArray(parsed.lines)
          ? parsed.lines.filter((x: unknown) => typeof x === 'string' && x.trim().length > 0).map((x: string) => x.trim())
          : (rawText ? rawText.split('\n').map((l: string) => l.trim()).filter(Boolean) : []);
        const rawLabels = Array.isArray(parsed.detectedLabels)
          ? parsed.detectedLabels.filter((x: unknown) => typeof x === 'string' && x.trim().length > 0).map((x: string) => x.trim())
          : [];

        // Determine confidence: strict readability metric ("high" | "medium" | "low")
        let confidence: 'high' | 'medium' | 'low' = 'low';
        if (parsed.confidence === 'high' || parsed.confidence === 'medium' || parsed.confidence === 'low') {
          confidence = parsed.confidence;
        } else if (typeof parsed.confidence === 'number') {
          confidence = parsed.confidence >= 75 ? 'high' : (parsed.confidence >= 40 ? 'medium' : 'low');
        } else if (rawText.length > 0) {
          confidence = 'medium';
        }

        const hasReadableText = (Boolean(parsed.hasReadableText) || rawText.length > 0) && rawText.length > 0;

        if (!hasReadableText || (rawText === '' && rawLabels.length === 0)) {
          console.log(`[OCR Pipeline] No visible text found on image ${imageFingerprint}`);
          return {
            success: true,
            hasReadableText: false,
            text: '',
            lines: [],
            detectedLabels: [],
            confidence: 'low',
            message: 'No clearly readable packaging text detected.',
            source: 'ocr',
            status: 'EMPTY_RESULT'
          };
        }

        console.log(`[OCR Pipeline] Success for ${imageFingerprint}: ${rawText.length} chars, ${rawLines.length} lines, confidence=${confidence}`);
        return {
          success: true,
          hasReadableText: true,
          text: rawText,
          lines: rawLines,
          detectedLabels: rawLabels,
          confidence,
          source: 'ocr',
          status: 'SUCCESS'
        };
      } catch (err: unknown) {
        lastError = err;
        console.warn(`[OCR Pipeline] Model "${modelName}" failed for image ${imageFingerprint}:`, err instanceof Error ? err.message : err);
      }
    }

    const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown OCR processing error';
    console.error(`[OCR Pipeline] All models failed for image ${imageFingerprint}:`, errorMessage);

    return {
      success: false,
      hasReadableText: false,
      text: '',
      lines: [],
      detectedLabels: [],
      confidence: 'low',
      message: 'Could not scan packaging text from the image. You can enter details manually.',
      source: 'ocr',
      status: 'FAILED',
      error: errorMessage
    };
  }
};
