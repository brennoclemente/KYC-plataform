import { NextRequest, NextResponse } from 'next/server';
import { PrismaDocumentRepository } from '../../../../infrastructure/database/repositories/PrismaDocumentRepository';
import { ProcessOCRResultUseCase } from '../../../../application/use-cases/ocr/ProcessOCRResultUseCase';
import { TextractOCRService } from '../../../../infrastructure/ocr/TextractOCRService';
import { TextractJobResult } from '../../../../infrastructure/ocr/TextractOCRService';

export async function POST(request: NextRequest) {
  // Validate shared secret if configured
  const webhookSecret = process.env.OCR_WEBHOOK_SECRET;
  if (webhookSecret) {
    const providedSecret = request.headers.get('x-webhook-secret');
    if (providedSecret !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  let body: { documentId?: string; jobId?: string; jobResult?: TextractJobResult };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { documentId, jobId, jobResult: providedJobResult } = body;

  if (!documentId) {
    return NextResponse.json({ error: 'documentId is required.' }, { status: 400 });
  }

  if (!providedJobResult && !jobId) {
    return NextResponse.json(
      { error: 'Either jobResult or jobId must be provided.' },
      { status: 400 },
    );
  }

  try {
    let jobResult: TextractJobResult;

    if (providedJobResult) {
      jobResult = providedJobResult;
    } else {
      const textractService = new TextractOCRService();
      jobResult = await textractService.getJobResult(jobId!);
    }

    const documentRepository = new PrismaDocumentRepository();
    const processOCRResultUseCase = new ProcessOCRResultUseCase(documentRepository);

    await processOCRResultUseCase.execute({ documentId, jobResult });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('OCR webhook error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
