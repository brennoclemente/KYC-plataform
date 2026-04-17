import { Document } from '../../../domain/entities/Document';
import { Partner } from '../../../domain/entities/Partner';
import { ICompanyRepository } from '../../../domain/repositories/ICompanyRepository';
import { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository';
import { IPartnerRepository } from '../../../domain/repositories/IPartnerRepository';
import { ICPFValidator } from '../../../domain/services/ICPFValidator';
import { IStorageService } from '../../../domain/services/IStorageService';
import { KYCPartnerDTO } from '../../dtos/KYCPartnerDTO';
import { IOCRService } from '../kyb/SubmitKYBUseCase';

export class SubmitKYCPartnerUseCase {
  constructor(
    private readonly cpfValidator: ICPFValidator,
    private readonly storageService: IStorageService,
    private readonly partnerRepository: IPartnerRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly companyRepository: ICompanyRepository,
    private readonly ocrService?: IOCRService,
  ) {}

  async execute(dto: KYCPartnerDTO): Promise<{ partner: Partner; documents: Document[] }> {
    if (!this.cpfValidator.validate(dto.cpf)) {
      throw new Error('CPF inválido.');
    }

    const uploadedKeys: { s3Key: string; documentType: KYCPartnerDTO['documents'][number]['documentType']; mimeType: string }[] = [];

    for (const doc of dto.documents) {
      const key = `documents/${dto.companyId}/partners/${dto.cpf}/${doc.documentType}/${doc.originalName}`;
      const s3Key = await this.storageService.upload(doc.file, key, doc.mimeType);
      uploadedKeys.push({ s3Key, documentType: doc.documentType, mimeType: doc.mimeType });
    }

    const partner = await this.partnerRepository.create({
      companyId: dto.companyId,
      nomeCompleto: dto.nomeCompleto,
      cpf: dto.cpf,
      dataNascimento: dto.dataNascimento,
      cargo: dto.cargo,
    });

    const documents: Document[] = [];

    for (const uploaded of uploadedKeys) {
      const document = await this.documentRepository.create({
        partnerId: partner.id,
        documentType: uploaded.documentType,
        s3Key: uploaded.s3Key,
        mimeType: uploaded.mimeType,
      });

      if (this.ocrService) {
        await this.documentRepository.updateOcrStatus(document.id, 'PROCESSING');
        this.ocrService.analyzeDocument(document.s3Key)
          .then((result) =>
            this.documentRepository.updateOcrResult(document.id, {
              ocrStatus: 'COMPLETED',
              ocrRawText: result.ocrRawText,
              ocrStructuredData: result.ocrStructuredData,
            })
          )
          .catch((err) => {
            console.error('OCR failed for document', document.id, err);
            this.documentRepository.updateOcrStatus(document.id, 'FAILED').catch(console.error);
          });
      }

      documents.push(document);
    }

    if (dto.isLastPartner) {
      await this.companyRepository.updateStatus(dto.companyId, 'PENDING_REVIEW', 'system');
    }

    return { partner, documents };
  }
}
