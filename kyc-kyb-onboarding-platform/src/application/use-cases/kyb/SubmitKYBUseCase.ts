import { Company } from '../../../domain/entities/Company';
import { Document } from '../../../domain/entities/Document';
import { ICompanyRepository } from '../../../domain/repositories/ICompanyRepository';
import { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository';
import { ICNPJValidator } from '../../../domain/services/ICNPJValidator';
import { IStorageService } from '../../../domain/services/IStorageService';
import { KYBSubmitDTO } from '../../dtos/KYBSubmitDTO';

export interface IOCRService {
  startDocumentAnalysis(s3Key: string): Promise<string>;
}

export class SubmitKYBUseCase {
  constructor(
    private readonly cnpjValidator: ICNPJValidator,
    private readonly storageService: IStorageService,
    private readonly companyRepository: ICompanyRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly ocrService?: IOCRService,
  ) {}

  async execute(dto: KYBSubmitDTO): Promise<{ company: Company; documents: Document[] }> {
    if (!this.cnpjValidator.validate(dto.cnpj)) {
      throw new Error('CNPJ inválido.');
    }

    const uploadedKeys: { s3Key: string; documentType: KYBSubmitDTO['documents'][number]['documentType']; mimeType: string }[] = [];

    for (const doc of dto.documents) {
      const key = `documents/${dto.userId}/${doc.documentType}/${doc.originalName}`;
      const s3Key = await this.storageService.upload(doc.file, key, doc.mimeType);
      uploadedKeys.push({ s3Key, documentType: doc.documentType, mimeType: doc.mimeType });
    }

    const company = await this.companyRepository.create({
      userId: dto.userId,
      cnpj: dto.cnpj,
      razaoSocial: dto.razaoSocial,
      nomeFantasia: dto.nomeFantasia,
      logradouro: dto.logradouro,
      numero: dto.numero,
      complemento: dto.complemento ?? null,
      bairro: dto.bairro,
      cidade: dto.cidade,
      estado: dto.estado,
      cep: dto.cep,
      faturamentoMensalEstimado: dto.faturamentoMensalEstimado,
    });

    const documents: Document[] = [];

    for (const uploaded of uploadedKeys) {
      const document = await this.documentRepository.create({
        companyId: company.id,
        documentType: uploaded.documentType,
        s3Key: uploaded.s3Key,
        mimeType: uploaded.mimeType,
      });

      if (this.ocrService) {
        await this.documentRepository.updateOcrStatus(document.id, 'PROCESSING');
        this.ocrService.startDocumentAnalysis(document.s3Key).catch(console.error);
      }

      documents.push(document);
    }

    return { company, documents };
  }
}
