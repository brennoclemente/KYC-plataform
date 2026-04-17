import {
  TextractClient,
  DetectDocumentTextCommand,
  Block,
} from '@aws-sdk/client-textract';
import { OcrField } from '../../domain/entities/Document';

export interface TextractSyncResult {
  ocrRawText: string;
  ocrStructuredData: Record<string, OcrField>;
}

const LOW_CONFIDENCE_THRESHOLD = 0.80;

export class TextractOCRService {
  private readonly client: TextractClient;
  private readonly bucket: string;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    this.client = new TextractClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
    this.bucket = process.env.S3_BUCKET_NAME!;
  }

  /**
   * Synchronous OCR — processes the document immediately and returns results.
   * Uses DetectDocumentText which works for PDFs and images stored in S3.
   */
  async analyzeDocument(s3Key: string): Promise<TextractSyncResult> {
    const command = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: this.bucket,
          Name: s3Key,
        },
      },
    });

    const response = await this.client.send(command);
    const blocks: Block[] = response.Blocks ?? [];

    // Extract raw text from LINE blocks
    const ocrRawText = blocks
      .filter((b) => b.BlockType === 'LINE' && b.Text)
      .map((b) => b.Text!)
      .join('\n');

    // Extract key-value pairs from WORD blocks grouped by lines
    // DetectDocumentText doesn't return KEY_VALUE_SET, so we build
    // a simple line-based structure
    const ocrStructuredData: Record<string, OcrField> = {};
    const lines = blocks.filter((b) => b.BlockType === 'LINE' && b.Text);

    lines.forEach((line, index) => {
      const key = `Linha ${index + 1}`;
      const confidence = (line.Confidence ?? 0) / 100;
      ocrStructuredData[key] = {
        value: line.Text ?? '',
        confidence,
        lowConfidence: confidence < LOW_CONFIDENCE_THRESHOLD,
      };
    });

    return { ocrRawText, ocrStructuredData };
  }
}
