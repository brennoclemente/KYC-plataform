import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitKYCPartnerUseCase } from '../SubmitKYCPartnerUseCase';
import { KYCPartnerDTO } from '../../../dtos/KYCPartnerDTO';
import { ICPFValidator } from '../../../../domain/services/ICPFValidator';
import { IStorageService } from '../../../../domain/services/IStorageService';
import { IPartnerRepository } from '../../../../domain/repositories/IPartnerRepository';
import { IDocumentRepository } from '../../../../domain/repositories/IDocumentRepository';
import { ICompanyRepository } from '../../../../domain/repositories/ICompanyRepository';
import { Partner } from '../../../../domain/entities/Partner';
import { Document } from '../../../../domain/entities/Document';
import { Company } from '../../../../domain/entities/Company';

const makePartner = (overrides: Partial<Partner> = {}): Partner => ({
  id: 'partner-1',
  companyId: 'company-1',
  nomeCompleto: 'João da Silva',
  cpf: '52998224725',
  dataNascimento: new Date('1990-01-01'),
  cargo: 'Sócio',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeDocument = (overrides: Partial<Document> = {}): Document => ({
  id: 'doc-1',
  companyId: null,
  partnerId: 'partner-1',
  documentType: 'RG_FRENTE',
  s3Key: 'documents/company-1/partners/52998224725/RG_FRENTE/rg_frente.jpg',
  mimeType: 'image/jpeg',
  ocrStatus: 'PENDING',
  ocrRawText: null,
  ocrStructuredData: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 'company-1',
  userId: 'user-1',
  cnpj: '11222333000181',
  razaoSocial: 'Empresa Teste LTDA',
  nomeFantasia: 'Empresa Teste',
  logradouro: 'Rua das Flores',
  numero: '100',
  complemento: null,
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01310100',
  faturamentoMensalEstimado: 50000,
  onboardingStatus: 'PENDING_REVIEW',
  reviewedByAdminId: null,
  reviewedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeDTO = (overrides: Partial<KYCPartnerDTO> = {}): KYCPartnerDTO => ({
  companyId: 'company-1',
  nomeCompleto: 'João da Silva',
  cpf: '52998224725',
  dataNascimento: new Date('1990-01-01'),
  cargo: 'Sócio',
  isLastPartner: false,
  documents: [
    { file: Buffer.from('rg_frente'), documentType: 'RG_FRENTE', mimeType: 'image/jpeg', originalName: 'rg_frente.jpg' },
    { file: Buffer.from('selfie'), documentType: 'SELFIE', mimeType: 'image/jpeg', originalName: 'selfie.jpg' },
  ],
  ...overrides,
});

describe('SubmitKYCPartnerUseCase', () => {
  let cpfValidator: ICPFValidator;
  let storageService: IStorageService;
  let partnerRepository: IPartnerRepository;
  let documentRepository: IDocumentRepository;
  let companyRepository: ICompanyRepository;
  let useCase: SubmitKYCPartnerUseCase;

  beforeEach(() => {
    cpfValidator = { validate: vi.fn().mockReturnValue(true) };
    storageService = {
      upload: vi.fn()
        .mockResolvedValueOnce('documents/company-1/partners/52998224725/RG_FRENTE/rg_frente.jpg')
        .mockResolvedValueOnce('documents/company-1/partners/52998224725/SELFIE/selfie.jpg'),
      generatePresignedUrl: vi.fn(),
    };
    partnerRepository = {
      create: vi.fn().mockResolvedValue(makePartner()),
      findById: vi.fn(),
      findByCompanyId: vi.fn(),
    };
    documentRepository = {
      create: vi.fn()
        .mockResolvedValueOnce(makeDocument({ id: 'doc-1', documentType: 'RG_FRENTE', s3Key: 'documents/company-1/partners/52998224725/RG_FRENTE/rg_frente.jpg' }))
        .mockResolvedValueOnce(makeDocument({ id: 'doc-2', documentType: 'SELFIE', s3Key: 'documents/company-1/partners/52998224725/SELFIE/selfie.jpg' })),
      findById: vi.fn(),
      updateOcrResult: vi.fn(),
      updateOcrStatus: vi.fn(),
      findByCompanyId: vi.fn(),
      findByPartnerId: vi.fn(),
    };
    companyRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      listAll: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue(makeCompany()),
      delete: vi.fn(),
    };

    useCase = new SubmitKYCPartnerUseCase(
      cpfValidator,
      storageService,
      partnerRepository,
      documentRepository,
      companyRepository,
    );
  });

  it('should create partner and documents (happy path)', async () => {
    const result = await useCase.execute(makeDTO());

    expect(result.partner).toMatchObject({ id: 'partner-1', companyId: 'company-1', cpf: '52998224725' });
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].documentType).toBe('RG_FRENTE');
    expect(result.documents[1].documentType).toBe('SELFIE');
  });

  it('should throw if CPF is invalid', async () => {
    (cpfValidator.validate as ReturnType<typeof vi.fn>).mockReturnValue(false);
    await expect(useCase.execute(makeDTO())).rejects.toThrow('CPF inválido.');
  });

  it('should upload each document with the correct key', async () => {
    await useCase.execute(makeDTO());

    expect(storageService.upload).toHaveBeenCalledWith(
      Buffer.from('rg_frente'),
      'documents/company-1/partners/52998224725/RG_FRENTE/rg_frente.jpg',
      'image/jpeg',
    );
    expect(storageService.upload).toHaveBeenCalledWith(
      Buffer.from('selfie'),
      'documents/company-1/partners/52998224725/SELFIE/selfie.jpg',
      'image/jpeg',
    );
  });

  it('should create document records linked to partner with s3Key', async () => {
    await useCase.execute(makeDTO());

    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        partnerId: 'partner-1',
        documentType: 'RG_FRENTE',
        s3Key: 'documents/company-1/partners/52998224725/RG_FRENTE/rg_frente.jpg',
      }),
    );
    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        partnerId: 'partner-1',
        documentType: 'SELFIE',
        s3Key: 'documents/company-1/partners/52998224725/SELFIE/selfie.jpg',
      }),
    );
  });

  it('should update company status to PENDING_REVIEW when isLastPartner is true', async () => {
    await useCase.execute(makeDTO({ isLastPartner: true }));

    expect(companyRepository.updateStatus).toHaveBeenCalledWith('company-1', 'PENDING_REVIEW', 'system');
  });

  it('should NOT update company status when isLastPartner is false', async () => {
    await useCase.execute(makeDTO({ isLastPartner: false }));

    expect(companyRepository.updateStatus).not.toHaveBeenCalled();
  });
});
