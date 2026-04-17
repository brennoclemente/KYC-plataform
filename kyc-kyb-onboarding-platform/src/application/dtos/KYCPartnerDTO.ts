import { DocumentType } from '../../domain/entities/Document';

export type KYCDocumentType = Extract<
  DocumentType,
  'RG_FRENTE' | 'RG_VERSO' | 'CNH_FRENTE' | 'CNH_VERSO' | 'SELFIE' | 'COMPROVANTE_RESIDENCIA'
>;

export interface KYCDocumentInput {
  file: Buffer;
  documentType: KYCDocumentType;
  mimeType: string;
  originalName: string;
}

export interface KYCPartnerDTO {
  companyId: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: Date;
  cargo: string;
  isLastPartner: boolean;
  documents: KYCDocumentInput[];
}
