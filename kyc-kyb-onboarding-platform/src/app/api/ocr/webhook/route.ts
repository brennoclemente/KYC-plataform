import { NextRequest, NextResponse } from 'next/server';
import { PrismaDocumentRepository } from '../../../../infrastructure/database/repositories/PrismaDocumentRepository';
import { TextractOCRService } from '../../../../infrastructure/ocr/TextractOCRService';

// This endpoint can be used to manually trigger OCR re-processing for a document.
// POST body: { documentId: string }
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.OCR_WEBHOOK_SECRET;
  if (webhookSecret) {
    const providedSecret = request.headers.get('x-webhook-secret');
    if (providedSecret !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  let body: { documentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { documentId } = body;
  if (!documentId) {
    return NextResponse.json({ error: 'documentId is required.' }, { status: 400 });
  }

  try {
    const documentRepository = new PrismaDocumentRepository();
    const document = await documentRepository.findById(documentId);

    if (!document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    await documentRepository.updateOcrStatus(documentId, 'PROCESSING');

    const ocrService = new TextractOCRService();
    const result = await ocrService.analyzeDocument(document.s3Key);

    await documentRepository.updateOcrResult(documentId, {
      ocrStatus: 'COMPLETED',
      ocrRawText: result.ocrRawText,
      ocrStructuredData: result.ocrStructuredData,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
