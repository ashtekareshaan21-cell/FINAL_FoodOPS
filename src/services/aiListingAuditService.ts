import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const VALID_CATEGORIES = ['mixed', 'grains', 'bakery', 'vegetables', 'fruits', 'dairy', 'meat'];

const PROMPT_TEXT = `Analyze this food listing image. Return a JSON object with the following fields:
- foodCategory: must be one of: "mixed", "grains", "bakery", "vegetables", "fruits", "dairy", "meat"
- estimatedServings: estimated number of servings as an integer
- estimatedQuantityKg: estimated quantity in kilograms as a float/number
- packagingObservation: description of how the food is packaged (e.g., plastic box, cardboard, wrapped)
- visualObservations: array of strings containing observations about the food's appearance, freshness, and composition
- warnings: array of strings with any potential food safety concerns or visual warnings (e.g., leaking container, potential allergens seen, signs of damage)
- confidence: a number between 0 and 100 representing your confidence level in these estimates.

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
  async runAudit(base64Image: string, mimeType: string, donorId: string) {
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

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    // 2. Check API Key presence
    if (!process.env.GEMINI_API_KEY) {
      return prisma.foodListingAudit.create({
        data: {
          donorId,
          status: 'AI_UNAVAILABLE',
          provider: 'google',
          model: modelName,
        },
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
            mimeType: mimeType,
          },
        },
        PROMPT_TEXT,
      ]);

      const text = response.response.text();
      if (!text) {
        throw new Error('Empty response from AI model.');
      }

      const data = JSON.parse(text);

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
      console.error('Gemini API listing audit failed:', error);
      return prisma.foodListingAudit.create({
        data: {
          donorId,
          status: 'FAILED',
          provider: 'google',
          model: modelName,
        },
      });
    }
  },
};
