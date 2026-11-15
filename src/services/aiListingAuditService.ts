import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const VALID_CATEGORIES = ['mixed', 'grains', 'bakery', 'vegetables', 'fruits', 'dairy', 'meat'];

const PROMPT_TEXT = `Analyze this food listing image for surplus food rescue redistribution. Return a JSON object with the following fields:
- foodCategory: must be one of: "mixed", "grains", "bakery", "vegetables", "fruits", "dairy", "meat"
- estimatedServings: estimated number of servings as an integer
- estimatedQuantityKg: estimated quantity in kilograms as a float/number
- packagingObservation: description of how the food is packaged (e.g., plastic box, stainless steel vessel, foil wrap, unpackaged)
- visualObservations: array of strings containing factual visual observations about appearance, coloration, and apparent condition
- warnings: array of strings with potential food safety red flags or concerns. CRITICAL FOOD SAFETY AUDIT: If the food shows any visible sign of mold, fungal growth, discoloration, rot, insect damage, foreign objects, slime, structural decay, or unhygienic storage, you MUST include a warning starting with "[CRITICAL SAFETY]" (e.g. "[CRITICAL SAFETY] Visible mold or fungal growth detected on food surface. Unfit for human redistribution.").
- confidence: a number between 0 and 100 representing your confidence in this analysis (significantly reduce confidence if the image is blurry, ambiguous, or spoiled).

You must strictly output valid JSON matching this schema, with no markdown formatting or extra text outside the JSON object.`;

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
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // RIFF
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50; // WEBP
    if (isRiff && isWebp) return true;
  }

  return false;
}

export const aiListingAuditService = {
  async runAudit(base64Image: string, mimeType: string, donorId: string, ocrText?: string) {
    // 1. Validation on inputs
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      throw new Error('Unsupported image MIME type.');
    }

    const buffer = Buffer.from(base64Image, 'base64');

    if (buffer.length > 4 * 1024 * 1024) {
      throw new Error('Image size exceeds 4MB limit.');
    }

    if (!validateMagicNumbers(buffer)) {
      throw new Error('Invalid image binary headers or corrupted file.');
    }

    const candidateModels = Array.from(new Set([
      process.env.GEMINI_MODEL,
      'gemini-flash-latest',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ].filter(Boolean))) as string[];

    // 2. Check API Key presence - honest status if unconfigured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      return prisma.foodListingAudit.create({
        data: {
          donorId,
          status: 'AI_UNAVAILABLE',
          provider: 'google',
          model: candidateModels[0] || 'gemini-1.5-flash',
        },
      });
    }

    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const effectivePrompt = ocrText && ocrText.trim().length > 0
          ? `OPTIONAL VISIBLE TEXT EXTRACTED FROM PACKAGING VIA OCR: "${ocrText.trim()}"\n\n${PROMPT_TEXT}`
          : PROMPT_TEXT;

        const response = await model.generateContent([
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          effectivePrompt,
        ]);

        const text = response.response.text();
        if (!text) {
          throw new Error('Empty response from AI model.');
        }

        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const data = JSON.parse(cleaned);

        // Validate schema and range
        if (typeof data.foodCategory !== 'string' || !VALID_CATEGORIES.includes(data.foodCategory.toLowerCase())) {
          throw new Error('Invalid or missing foodCategory.');
        }
        if (typeof data.estimatedServings !== 'number' || data.estimatedServings < 0) {
          throw new Error('Invalid estimatedServings.');
        }
        if (typeof data.estimatedQuantityKg !== 'number' || data.estimatedQuantityKg < 0) {
          throw new Error('Invalid estimatedQuantityKg.');
        }
        if (typeof data.packagingObservation !== 'string') {
          throw new Error('Invalid packagingObservation.');
        }
        if (!Array.isArray(data.visualObservations) || data.visualObservations.some((x: unknown) => typeof x !== 'string')) {
          throw new Error('Invalid visualObservations.');
        }
        if (!Array.isArray(data.warnings) || data.warnings.some((x: unknown) => typeof x !== 'string')) {
          throw new Error('Invalid warnings.');
        }
        if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
          throw new Error('Invalid confidence score.');
        }

        return await prisma.foodListingAudit.create({
          data: {
            donorId,
            status: 'COMPLETED',
            foodCategory: data.foodCategory.toLowerCase(),
            estimatedServings: Math.round(data.estimatedServings),
            estimatedQuantityKg: parseFloat(data.estimatedQuantityKg),
            packagingObservation: data.packagingObservation,
            visualObservations: data.visualObservations,
            warnings: data.warnings,
            confidence: parseFloat(data.confidence),
            provider: 'google',
            model: modelName,
          },
        });
      } catch (error) {
        lastError = error;
        console.warn(`Gemini model "${modelName}" failed, trying next candidate...`, error instanceof Error ? error.message : error);
      }
    }

    // If all candidate models fail or encountered quota/network errors,
    // record honest FAILED status rather than fabricating audit observations.
    console.warn('All Gemini candidate models failed to produce an audit. Recording status as FAILED.', lastError instanceof Error ? lastError.message : lastError);
    return prisma.foodListingAudit.create({
      data: {
        donorId,
        status: 'FAILED',
        provider: 'google',
        model: candidateModels[0] || 'gemini-1.5-flash',
      },
    });
  },
};


