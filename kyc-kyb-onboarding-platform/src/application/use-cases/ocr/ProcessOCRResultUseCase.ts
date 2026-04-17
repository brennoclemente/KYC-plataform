import { OcrField } from '../../../domain/entities/Document';
import { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository';

const LOW_CONFIDENCE_THRESHOLD = 0.80;

export interface OcrJobResult {
  status: 'SUCCEEDED' | 'FAILED' | 'IN_PROGRESS';
  blocks?: Array<{
    BlockType?: string;
    Text?: string;
    Confidence?: number;
    EntityTypes?: string[];
    Id?: string;
    Relationships?: Array<{ Type?: string; Ids?: string[] }>;
  }>;
  statusMessage?: string;
}

export interface ProcessOCRResultInput {
  documentId: string;
  jobResult: OcrJobResult;
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

    const ocrRawText = blocks
      .filter((b) => b.BlockType === 'LINE' && b.Text)
      .map((b) => b.Text!)
      .join('\n');

    const blockMap = new Map(blocks.map((b) => [b.Id, b]));

    const ocrStructuredData: Record<string, OcrField> = {};

    for (const block of blocks) {
      if (block.BlockType !== 'KEY_VALUE_SET') continue;
      if (!block.EntityTypes?.includes('KEY')) continue;

      const keyText = this.getBlockText(block, blockMap);
      if (!keyText) continue;

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
