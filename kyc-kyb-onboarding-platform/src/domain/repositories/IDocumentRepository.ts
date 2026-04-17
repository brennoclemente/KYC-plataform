import { Document, DocumentType, OcrField, OcrStatus } from '../entities/Document';

export interface CreateDocumentData {
  companyId?: string | null;
  partnerId?: string | null;
  documentType: DocumentType;
  s3Key: string;
  mimeType: string;
}

export interface OcrResult {
  ocrRawText: string;
  ocrStructuredData: Record<string, OcrField>;
  ocrStatus: OcrStatus;
}

export interface IDocumentRepository {
  create(data: CreateDocumentData): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  updateOcrResult(id: string, result: OcrResult): Promise<void>;
  updateOcrStatus(id: string, status: OcrStatus): Promise<void>;
  findByCompanyId(companyId: string): Promise<Document[]>;
  findByPartnerId(partnerId: string): Promise<Document[]>;
}
