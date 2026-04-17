import { OcrField } from '../../../domain/entities/Document';
import { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository';
import { TextractJobResult } from '../../../infrastructure/ocr/TextractOCRService';

const LOW_CONFIDENCE_THRESHOLD = 0.80;

export interface ProcessOCRResultInput {
  documentId: string;
  jobResult: TextractJobResult;
}

export class ProcessOCRResultUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute({ documentId, jobResult }: ProcessOCRResultInput): Promise<void> {
    if (jobResult.status === 'FAILED') {
      await this.documentRepository.updateOcrResult(documentId, {
        ocrStatus: 'FAILED',
        ocrRawText: null as unknown as string,
        ocrStructuredData: null as unknown as Record<string, OcrField>,
      });
      return;
    }

    if (jobResult.status !== 'SUCCEEDED') {
      return;
    }

    const blocks = jobResult.blocks ?? [];

    // Extract raw text from LINE blocks
    const ocrRawText = blocks
      .filter((b) => b.BlockType === 'LINE' && b.Text)
      .map((b) => b.Text!)
      .join('\n');

    // Build a map of blockId -> block for relationship lookups
    const blockMap = new Map(blocks.map((b) => [b.Id, b]));

    // Extract structured fields from KEY_VALUE_SET blocks
    const ocrStructuredData: Record<string, OcrField> = {};

    for (const block of blocks) {
      if (block.BlockType !== 'KEY_VALUE_SET') continue;
      if (!block.EntityTypes?.includes('KEY')) continue;

      // Get the key text by following CHILD relationships
      const keyText = this.getBlockText(block, blockMap);
      if (!keyText) continue;

      // Find the VALUE block via VALUE relationship
      const valueRelationship = block.Relationships?.find((r) => r.Type === 'VALUE');
      if (!valueRelationship?.Ids?.length) continue;

      const valueBlockId = valueRelationship.Ids[0];
      const valueBlock = blockMap.get(valueBlockId);
      if (!valueBlock) continue;

      const valueText = this.getBlockText(valueBlock, blockMap);
      const confidence = (block.Confidence ?? 0) / 100;

      ocrStructuredData[keyText] = {
        value: valueText ?? '',
        confidence,
        lowConfidence: confidence < LOW_CONFIDENCE_THRESHOLD,
      };
    }

    await this.documentRepository.updateOcrResult(documentId, {
      ocrStatus: 'COMPLETED',
      ocrRawText,
      ocrStructuredData,
    });
  }

  private getBlockText(
    block: { Relationships?: Array<{ Type?: string; Ids?: string[] }> },
    blockMap: Map<string | undefined, { BlockType?: string; Text?: string; Relationships?: Array<{ Type?: string; Ids?: string[] }> }>,
  ): string {
    const childRelationship = block.Relationships?.find((r) => r.Type === 'CHILD');
    if (!childRelationship?.Ids) return '';

    return childRelationship.Ids
      .map((id) => blockMap.get(id))
      .filter((b) => b?.BlockType === 'WORD' && b.Text)
      .map((b) => b!.Text!)
      .join(' ');
  }
}
