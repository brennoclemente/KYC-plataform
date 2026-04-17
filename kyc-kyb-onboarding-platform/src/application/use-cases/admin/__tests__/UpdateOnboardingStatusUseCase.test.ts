import { describe, it, expect, vi } from 'vitest';
import { UpdateOnboardingStatusUseCase } from '../UpdateOnboardingStatusUseCase';
import { Company } from '../../../../domain/entities/Company';
import { ICompanyRepository } from '../../../../domain/repositories/ICompanyRepository';

const makeCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 'company-1',
  userId: 'user-1',
  cnpj: '12345678000100',
  razaoSocial: 'Empresa Teste LTDA',
  nomeFantasia: 'Empresa Teste',
  logradouro: 'Rua Teste',
  numero: '123',
  complemento: null,
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01310100',
  faturamentoMensalEstimado: 10000,
  onboardingStatus: 'PENDING',
  reviewedByAdminId: null,
  reviewedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeRepository = (): ICompanyRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  listAll: vi.fn(),
  updateStatus: vi.fn(),
});

describe('UpdateOnboardingStatusUseCase', () => {
  it('calls updateStatus with correct companyId, status APPROVED, and adminId', async () => {
    const repo = makeRepository();
    const adminId = 'admin-123';
    const updatedCompany = makeCompany({
      onboardingStatus: 'APPROVED',
      reviewedByAdminId: adminId,
      reviewedAt: new Date(),
    });
    vi.mocked(repo.updateStatus).mockResolvedValue(updatedCompany);

    const useCase = new UpdateOnboardingStatusUseCase(repo);
    const result = await useCase.execute({ companyId: 'company-1', status: 'APPROVED', adminId });

    expect(repo.updateStatus).toHaveBeenCalledWith('company-1', 'APPROVED', adminId);
    expect(result.onboardingStatus).toBe('APPROVED');
    expect(result.reviewedByAdminId).toBe(adminId);
    expect(result.reviewedAt).not.toBeNull();
  });

  it('calls updateStatus with correct companyId, status REJECTED, and adminId', async () => {
    const repo = makeRepository();
    const adminId = 'admin-456';
    const updatedCompany = makeCompany({
      onboardingStatus: 'REJECTED',
      reviewedByAdminId: adminId,
      reviewedAt: new Date(),
    });
    vi.mocked(repo.updateStatus).mockResolvedValue(updatedCompany);

    const useCase = new UpdateOnboardingStatusUseCase(repo);
    const result = await useCase.execute({ companyId: 'company-1', status: 'REJECTED', adminId });

    expect(repo.updateStatus).toHaveBeenCalledWith('company-1', 'REJECTED', adminId);
    expect(result.onboardingStatus).toBe('REJECTED');
    expect(result.reviewedByAdminId).toBe(adminId);
    expect(result.reviewedAt).not.toBeNull();
  });

  it('returns the updated company from the repository', async () => {
    const repo = makeRepository();
    const reviewedAt = new Date('2024-01-15T10:00:00Z');
    const updatedCompany = makeCompany({
      onboardingStatus: 'APPROVED',
      reviewedByAdminId: 'admin-789',
      reviewedAt,
    });
    vi.mocked(repo.updateStatus).mockResolvedValue(updatedCompany);

    const useCase = new UpdateOnboardingStatusUseCase(repo);
    const result = await useCase.execute({ companyId: 'company-1', status: 'APPROVED', adminId: 'admin-789' });

    expect(result).toEqual(updatedCompany);
  });
});
