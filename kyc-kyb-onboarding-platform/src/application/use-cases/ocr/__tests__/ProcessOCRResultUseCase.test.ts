import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessOCRResultUseCase } from '../ProcessOCRResultUseCase';
import { IDocumentRepository } from '../../../../domain/repositories/IDocumentRepository';
import { TextractJobResult } from '../../../../infrastructure/ocr/TextractOCRService';

function makeRepo(): IDocumentRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    updateOcrResult: vi.fn().mockResolvedValue(undefined),
    updateOcrStatus: vi.fn(),
    findByCompanyId: vi.fn(),
    findByPartnerId: vi.fn(),
  };
}

// Helper to build a minimal KEY_VALUE_SET block pair
function makeKeyValueBlocks(keyText: string, valueText: string, confidence: number) {
  const keyWordId = 'kw-1';
  const valueWordId = 'vw-1';
  const valueBlockId = 'val-block-1';

  const keyBlock = {
    Id: 'key-block-1',
    BlockType: 'KEY_VALUE_SET',
    EntityTypes: ['KEY'],
    Confidence: confidence * 100,
    Relationships: [
      { Type: 'CHILD', Ids: [keyWordId] },
      { Type: 'VALUE', Ids: [valueBlockId] },
    ],
  };

  const valueBlock = {
    Id: valueBlockId,
    BlockType: 'KEY_VALUE_SET',
    EntityTypes: ['VALUE'],
    Relationships: [{ Type: 'CHILD', Ids: [valueWordId] }],
  };

  const keyWord = { Id: keyWordId, BlockType: 'WORD', Text: keyText };
  const valueWord = { Id: valueWordId, BlockType: 'WORD', Text: valueText };

  return [keyBlock, valueBlock, keyWord, valueWord];
}

describe('ProcessOCRResultUseCase', () => {
  let repo: IDocumentRepository;
  let useCase: ProcessOCRResultUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new ProcessOCRResultUseCase(repo);
  });

  it('marks field as lowConfidence: true when confidence < 0.80', async () => {
    const blocks = makeKeyValueBlocks('Nome', 'João', 0.75);
    const jobResult: TextractJobResult = { status: 'SUCCEEDED', blocks: blocks as never };

    await useCase.execute({ documentId: 'doc-1', jobResult });

    expect(repo.updateOcrResult).toHaveBeenCalledWith('doc-1', expect.objectContaining({
      ocrStatus: 'COMPLETED',
      ocrStructuredData: expect.objectContaining({
        Nome: expect.objectContaining({ lowConfidence: true, confidence: 0.75 }),
      }),
    }));
  });

  it('marks field as lowConfidence: false when confidence >= 0.80', async () => {
    const blocks = makeKeyValueBlocks('CPF', '123.456.789-00', 0.95);
    const jobResult: TextractJobResult = { status: 'SUCCEEDED', blocks: blocks as never };

    await useCase.execute({ documentId: 'doc-2', jobResult });

    expect(repo.updateOcrResult).toHaveBeenCalledWith('doc-2', expect.objectContaining({
      ocrStatus: 'COMPLETED',
      ocrStructuredData: expect.objectContaining({
        CPF: expect.objectContaining({ lowConfidence: false, confidence: 0.95 }),
      }),
    }));
  });

  it('marks field as lowConfidence: false when confidence is exactly 0.80', async () => {
    const blocks = makeKeyValueBlocks('RG', '12.345.678-9', 0.80);
    const jobResult: TextractJobResult = { status: 'SUCCEEDED', blocks: blocks as never };

    await useCase.execute({ documentId: 'doc-3', jobResult });

    expect(repo.updateOcrResult).toHaveBeenCalledWith('doc-3', expect.objectContaining({
      ocrStructuredData: expect.objectContaining({
        RG: expect.objectContaining({ lowConfidence: false }),
      }),
    }));
  });

  it('persists FAILED ocrStatus when job status is FAILED', async () => {
    const jobResult: TextractJobResult = { status: 'FAILED', statusMessage: 'Unsupported document' };

    await useCase.execute({ documentId: 'doc-4', jobResult });

    expect(repo.updateOcrResult).toHaveBeenCalledWith('doc-4', expect.objectContaining({
      ocrStatus: 'FAILED',
      ocrRawText: null,
      ocrStructuredData: null,
    }));
  });

  it('persists COMPLETED ocrStatus with extracted data when job status is SUCCEEDED', async () => {
    const lineBlock = { Id: 'line-1', BlockType: 'LINE', Text: 'Linha de texto extraída' };
    const blocks = [...makeKeyValueBlocks('Campo', 'Valor', 0.90), lineBlock];
    const jobResult: TextractJobResult = { status: 'SUCCEEDED', blocks: blocks as never };

    await useCase.execute({ documentId: 'doc-5', jobResult });

    expect(repo.updateOcrResult).toHaveBeenCalledWith('doc-5', expect.objectContaining({
      ocrStatus: 'COMPLETED',
      ocrRawText: 'Linha de texto extraída',
      ocrStructuredData: expect.objectContaining({
        Campo: expect.objectContaining({ value: 'Valor' }),
      }),
    }));
  });

  it('does nothing when job status is IN_PROGRESS', async () => {
    const jobResult: TextractJobResult = { status: 'IN_PROGRESS' };

    await useCase.execute({ documentId: 'doc-6', jobResult });

    expect(repo.updateOcrResult).not.toHaveBeenCalled();
  });
});
