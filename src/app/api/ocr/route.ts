import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ocrService } from '@/services/ocrService';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'DONOR' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const contentType = req.headers.get('content-type') || '';
    
    let base64Image = '';
    let mimeType = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = (formData.get('image') || formData.get('file') || formData.get('foodImage')) as File | null;

      if (!file) {
        return NextResponse.json(
          {
            success: false,
            hasReadableText: false,
            text: '',
            lines: [],
            detectedLabels: [],
            confidence: 'low',
            source: 'ocr',
            status: 'FAILED',
            error: 'No image file provided in request.'
          },
          { status: 400 }
        );
      }

      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      base64Image = Buffer.from(arrayBuffer).toString('base64');
    } else if (contentType.includes('application/json')) {
      const json = await req.json();
      base64Image = json.base64Image || json.image || '';
      mimeType = json.mimeType || 'image/jpeg';
    } else {
      return NextResponse.json(
        {
          success: false,
          hasReadableText: false,
          text: '',
          lines: [],
          detectedLabels: [],
          confidence: 'low',
          source: 'ocr',
          status: 'FAILED',
          error: 'Content-Type must be multipart/form-data or application/json.'
        },
        { status: 400 }
      );
    }

    if (!base64Image) {
      return NextResponse.json(
        {
          success: false,
          hasReadableText: false,
          text: '',
          lines: [],
          detectedLabels: [],
          confidence: 'low',
          source: 'ocr',
          status: 'FAILED',
          error: 'Image data is empty.'
        },
        { status: 400 }
      );
    }

    const result = await ocrService.extractTextFromImage(base64Image, mimeType);

    if (result.status === 'FAILED') {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API /api/ocr error]', errorMessage);
    return NextResponse.json(
      {
        success: false,
        hasReadableText: false,
        text: '',
        lines: [],
        detectedLabels: [],
        confidence: 'low',
        source: 'ocr',
        status: 'FAILED',
        error: 'Failed to process image for text extraction.'
      },
      { status: 500 }
    );
  }
}
