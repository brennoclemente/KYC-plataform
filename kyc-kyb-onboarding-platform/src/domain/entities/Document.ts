// src/domain/entities/Document.ts
export type DocumentType =
  | 'CONTRATO_SOCIAL'
  | 'CARTAO_CNPJ'
  | 'RG_FRENTE'
  | 'RG_VERSO'
  | 'CNH_FRENTE'
  | 'CNH_VERSO'
  | 'SELFIE'
  | 'COMPROVANTE_RESIDENCIA';

export type OcrStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface OcrField {
  value: string;
  confidence: number;
  lowConfidence: boolean; // true if confidence < 0.80
}

export interface Document {
  id: string;
  companyId: string | null;
  partnerId: string | null;
  documentType: DocumentType;
  s3Key: string; // Only the S3 key, never the presigned URL
  mimeType: string;
  ocrStatus: OcrStatus;
  ocrRawText: string | null;
  ocrStructuredData: Record<string, OcrField> | null;
  createdAt: Date;
  updatedAt: Date;
}
