import { DocumentType } from '../../domain/entities/Document';

export interface KYBDocumentInput {
  file: Buffer;
  documentType: Extract<DocumentType, 'CONTRATO_SOCIAL' | 'CARTAO_CNPJ'>;
  mimeType: string;
  originalName: string;
}

export interface KYBSubmitDTO {
  userId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  faturamentoMensalEstimado: number;
  documents: KYBDocumentInput[];
}
