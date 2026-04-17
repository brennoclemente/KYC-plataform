import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitKYBUseCase } from '../SubmitKYBUseCase';
import { KYBSubmitDTO } from '../../../dtos/KYBSubmitDTO';
import { ICNPJValidator } from '../../../../domain/services/ICNPJValidator';
import { IStorageService } from '../../../../domain/services/IStorageService';
import { ICompanyRepository } from '../../../../domain/repositories/ICompanyRepository';
import { IDocumentRepository } from '../../../../domain/repositories/IDocumentRepository';
import { Company } from '../../../../domain/entities/Company';
import { Document } from '../../../../domain/entities/Document';

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
  onboardingStatus: 'PENDING',
  reviewedByAdminId: null,
  reviewedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeDocument = (overrides: Partial<Document> = {}): Document => ({
  id: 'doc-1',
  companyId: 'company-1',
  partnerId: null,
  documentType: 'CONTRATO_SOCIAL',
  s3Key: 'documents/user-1/CONTRATO_SOCIAL/contrato.pdf',
  mimeType: 'application/pdf',
  ocrStatus: 'PENDING',
  ocrRawText: null,
  ocrStructuredData: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeDTO = (overrides: Partial<KYBSubmitDTO> = {}): KYBSubmitDTO => ({
  userId: 'user-1',
  cnpj: '11222333000181',
  razaoSocial: 'Empresa Teste LTDA',
  nomeFantasia: 'Empresa Teste',
  logradouro: 'Rua das Flores',
  numero: '100',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01310100',
  faturamentoMensalEstimado: 50000,
  documents: [
    { file: Buffer.from('pdf'), documentType: 'CONTRATO_SOCIAL', mimeType: 'application/pdf', originalName: 'contrato.pdf' },
    { file: Buffer.from('pdf2'), documentType: 'CARTAO_CNPJ', mimeType: 'application/pdf', originalName: 'cartao.pdf' },
  ],
  ...overrides,
});

describe('SubmitKYBUseCase', () => {
  let cnpjValidator: ICNPJValidator;
  let storageService: IStorageService;
  let companyRepository: ICompanyRepository;
  let documentRepository: IDocumentRepository;
  let useCase: SubmitKYBUseCase;

  beforeEach(() => {
    cnpjValidator = { validate: vi.fn().mockReturnValue(true) };
    storageService = {
      upload: vi.fn()
        .mockResolvedValueOnce('documents/user-1/CONTRATO_SOCIAL/contrato.pdf')
        .mockResolvedValueOnce('documents/user-1/CARTAO_CNPJ/cartao.pdf'),
      generatePresignedUrl: vi.fn(),
    };
    companyRepository = {
      create: vi.fn().mockResolvedValue(makeCompany()),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      listAll: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    };
    documentRepository = {
      create: vi.fn()
        .mockResolvedValueOnce(makeDocument({ id: 'doc-1', documentType: 'CONTRATO_SOCIAL', s3Key: 'documents/user-1/CONTRATO_SOCIAL/contrato.pdf' }))
        .mockResolvedValueOnce(makeDocument({ id: 'doc-2', documentType: 'CARTAO_CNPJ', s3Key: 'documents/user-1/CARTAO_CNPJ/cartao.pdf' })),
      findById: vi.fn(),
      updateOcrResult: vi.fn(),
      updateOcrStatus: vi.fn(),
      findByCompanyId: vi.fn(),
      findByPartnerId: vi.fn(),
    };

    useCase = new SubmitKYBUseCase(cnpjValidator, storageService, companyRepository, documentRepository);
  });

  it('should throw if CNPJ is invalid', async () => {
    (cnpjValidator.validate as ReturnType<typeof vi.fn>).mockReturnValue(false);
    await expect(useCase.execute(makeDTO())).rejects.toThrow('CNPJ inválido.');
  });

  it('should upload each document with the correct key', async () => {
    await useCase.execute(makeDTO());

    expect(storageService.upload).toHaveBeenCalledWith(
      Buffer.from('pdf'),
      'documents/user-1/CONTRATO_SOCIAL/contrato.pdf',
      'application/pdf',
    );
    expect(storageService.upload).toHaveBeenCalledWith(
      Buffer.from('pdf2'),
      'documents/user-1/CARTAO_CNPJ/cartao.pdf',
      'application/pdf',
    );
  });

  it('should create company with PENDING status', async () => {
    await useCase.execute(makeDTO());

    expect(companyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        cnpj: '11222333000181',
        razaoSocial: 'Empresa Teste LTDA',
      }),
    );
    const created = (companyRepository.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    await expect(created).resolves.toMatchObject({ onboardingStatus: 'PENDING' });
  });

  it('should create document records with s3Key from upload', async () => {
    await useCase.execute(makeDTO());

    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        documentType: 'CONTRATO_SOCIAL',
        s3Key: 'documents/user-1/CONTRATO_SOCIAL/contrato.pdf',
      }),
    );
    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        documentType: 'CARTAO_CNPJ',
        s3Key: 'documents/user-1/CARTAO_CNPJ/cartao.pdf',
      }),
    );
  });

  it('should return company and documents', async () => {
    const result = await useCase.execute(makeDTO());

    expect(result.company).toMatchObject({ id: 'company-1', onboardingStatus: 'PENDING' });
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].documentType).toBe('CONTRATO_SOCIAL');
    expect(result.documents[1].documentType).toBe('CARTAO_CNPJ');
  });

  it('should propagate upload errors', async () => {
    (storageService.upload as ReturnType<typeof vi.fn>).mockReset().mockRejectedValueOnce(new Error('S3 error'));
    await expect(useCase.execute(makeDTO())).rejects.toThrow('S3 error');
  });

  it('should pass complemento as null when not provided', async () => {
    await useCase.execute(makeDTO({ complemento: undefined }));
    expect(companyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ complemento: null }),
    );
  });

  it('should pass complemento when provided', async () => {
    await useCase.execute(makeDTO({ complemento: 'Apto 42' }));
    expect(companyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ complemento: 'Apto 42' }),
    );
  });
});
