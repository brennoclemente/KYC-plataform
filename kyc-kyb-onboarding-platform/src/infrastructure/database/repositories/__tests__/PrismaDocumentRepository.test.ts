import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaDocumentRepository } from '../PrismaDocumentRepository';
import type { DocumentType, OcrStatus } from '@prisma/client';

vi.mock('../../prisma-client', () => ({
  prisma: {
    document: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../prisma-client';

const mockRawDoc = {
  id: 'doc-1',
  companyId: 'company-1',
  partnerId: null,
  documentType: 'CONTRATO_SOCIAL' as DocumentType,
  s3Key: 'uploads/company-1/contrato.pdf',
  mimeType: 'application/pdf',
  ocrStatus: 'PENDING' as OcrStatus,
  ocrRawText: null,
  ocrStructuredData: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('PrismaDocumentRepository', () => {
  let repo: PrismaDocumentRepository;

  beforeEach(() => {
    repo = new PrismaDocumentRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document and return mapped result', async () => {
      vi.mocked(prisma.document.create).mockResolvedValue(mockRawDoc);

      const createData = {
        companyId: 'company-1',
        documentType: 'CONTRATO_SOCIAL' as const,
        s3Key: 'uploads/company-1/contrato.pdf',
        mimeType: 'application/pdf',
      };

      const result = await repo.create(createData);

      expect(prisma.document.create).toHaveBeenCalledWith({
        data: {
          companyId: 'company-1',
          partnerId: null,
          documentType: 'CONTRATO_SOCIAL',
          s3Key: 'uploads/company-1/contrato.pdf',
          mimeType: 'application/pdf',
        },
      });
      expect(result.id).toBe('doc-1');
      expect(result.documentType).toBe('CONTRATO_SOCIAL');
      expect(result.ocrStatus).toBe('PENDING');
    });

    it('should create a partner document with partnerId', async () => {
      const partnerDoc = { ...mockRawDoc, companyId: null, partnerId: 'partner-1', documentType: 'RG_FRENTE' as DocumentType };
      vi.mocked(prisma.document.create).mockResolvedValue(partnerDoc);

      await repo.create({
        partnerId: 'partner-1',
        documentType: 'RG_FRENTE',
        s3Key: 'uploads/partner-1/rg.jpg',
        mimeType: 'image/jpeg',
      });

      expect(prisma.document.create).toHaveBeenCalledWith({
        data: {
          companyId: null,
          partnerId: 'partner-1',
          documentType: 'RG_FRENTE',
          s3Key: 'uploads/partner-1/rg.jpg',
          mimeType: 'image/jpeg',
        },
      });
    });
  });

  describe('findById', () => {
    it('should return mapped document when found', async () => {
      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockRawDoc);

      const result = await repo.findById('doc-1');

      expect(prisma.document.findUnique).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
      expect(result).not.toBeNull();
      expect(result!.id).toBe('doc-1');
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateOcrResult', () => {
    it('should update OCR result fields', async () => {
      vi.mocked(prisma.document.update).mockResolvedValue({
        ...mockRawDoc,
        ocrStatus: 'COMPLETED' as OcrStatus,
        ocrRawText: 'extracted text',
        ocrStructuredData: { field: { value: 'val', confidence: 0.95, lowConfidence: false } },
      });

      await repo.updateOcrResult('doc-1', {
        ocrRawText: 'extracted text',
        ocrStructuredData: { field: { value: 'val', confidence: 0.95, lowConfidence: false } },
        ocrStatus: 'COMPLETED',
      });

      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: expect.objectContaining({
          ocrRawText: 'extracted text',
          ocrStatus: 'COMPLETED',
        }),
      });
    });
  });

  describe('findByCompanyId', () => {
    it('should return all documents for a company', async () => {
      const doc2 = { ...mockRawDoc, id: 'doc-2', documentType: 'CARTAO_CNPJ' as DocumentType };
      vi.mocked(prisma.document.findMany).mockResolvedValue([mockRawDoc, doc2]);

      const result = await repo.findByCompanyId('company-1');

      expect(prisma.document.findMany).toHaveBeenCalledWith({ where: { companyId: 'company-1' } });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no documents found', async () => {
      vi.mocked(prisma.document.findMany).mockResolvedValue([]);

      const result = await repo.findByCompanyId('company-no-docs');

      expect(result).toEqual([]);
    });
  });

  describe('findByPartnerId', () => {
    it('should return all documents for a partner', async () => {
      const partnerDoc = { ...mockRawDoc, id: 'doc-3', companyId: null, partnerId: 'partner-1', documentType: 'RG_FRENTE' as DocumentType };
      vi.mocked(prisma.document.findMany).mockResolvedValue([partnerDoc]);

      const result = await repo.findByPartnerId('partner-1');

      expect(prisma.document.findMany).toHaveBeenCalledWith({ where: { partnerId: 'partner-1' } });
      expect(result).toHaveLength(1);
      expect(result[0].partnerId).toBe('partner-1');
    });
  });
});
