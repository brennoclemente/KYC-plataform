import { Document, OcrField, OcrStatus } from '../../../domain/entities/Document';
import {
  CreateDocumentData,
  IDocumentRepository,
  OcrResult,
} from '../../../domain/repositories/IDocumentRepository';
import { prisma } from '../prisma-client';

function mapDocument(raw: {
  id: string;
  companyId: string | null;
  partnerId: string | null;
  documentType: string;
  s3Key: string;
  mimeType: string;
  ocrStatus: string;
  ocrRawText: string | null;
  ocrStructuredData: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Document {
  return {
    id: raw.id,
    companyId: raw.companyId,
    partnerId: raw.partnerId,
    documentType: raw.documentType as Document['documentType'],
    s3Key: raw.s3Key,
    mimeType: raw.mimeType,
    ocrStatus: raw.ocrStatus as OcrStatus,
    ocrRawText: raw.ocrRawText,
    ocrStructuredData: raw.ocrStructuredData as Record<string, OcrField> | null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class PrismaDocumentRepository implements IDocumentRepository {
  async create(data: CreateDocumentData): Promise<Document> {
    const doc = await prisma.document.create({
      data: {
        companyId: data.companyId ?? null,
        partnerId: data.partnerId ?? null,
        documentType: data.documentType,
        s3Key: data.s3Key,
        mimeType: data.mimeType,
      },
    });
    return mapDocument(doc);
  }

  async findById(id: string): Promise<Document | null> {
    const doc = await prisma.document.findUnique({ where: { id } });
    return doc ? mapDocument(doc) : null;
  }

  async updateOcrResult(id: string, result: OcrResult): Promise<void> {
    await prisma.document.update({
      where: { id },
      data: {
        ocrRawText: result.ocrRawText,
        ocrStructuredData: result.ocrStructuredData,
        ocrStatus: result.ocrStatus,
      },
    });
  }

  async updateOcrStatus(id: string, status: OcrStatus): Promise<void> {
    await prisma.document.update({
      where: { id },
      data: { ocrStatus: status },
    });
  }

  async findByCompanyId(companyId: string): Promise<Document[]> {
    const docs = await prisma.document.findMany({ where: { companyId } });
    return docs.map(mapDocument);
  }

  async findByPartnerId(partnerId: string): Promise<Document[]> {
    const docs = await prisma.document.findMany({ where: { partnerId } });
    return docs.map(mapDocument);
  }
}
