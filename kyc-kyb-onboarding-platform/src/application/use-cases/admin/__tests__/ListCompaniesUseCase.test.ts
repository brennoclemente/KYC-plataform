import { describe, it, expect, vi } from 'vitest';
import { ListCompaniesUseCase } from '../ListCompaniesUseCase';
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
  findByUserId: vi.fn(),
  listAll: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
});

describe('ListCompaniesUseCase', () => {
  it('returns all companies when no filter is provided', async () => {
    const repo = makeRepository();
    const companies = [makeCompany(), makeCompany({ id: 'company-2', onboardingStatus: 'APPROVED' })];
    vi.mocked(repo.listAll).mockResolvedValue(companies);

    const useCase = new ListCompaniesUseCase(repo);
    const result = await useCase.execute();

    expect(repo.listAll).toHaveBeenCalledWith();
    expect(result).toEqual(companies);
  });

  it('filters companies by status when status is provided', async () => {
    const repo = makeRepository();
    const pendingCompanies = [makeCompany({ onboardingStatus: 'PENDING' })];
    vi.mocked(repo.listAll).mockResolvedValue(pendingCompanies);

    const useCase = new ListCompaniesUseCase(repo);
    const result = await useCase.execute({ status: 'PENDING' });

    expect(repo.listAll).toHaveBeenCalledWith({ status: 'PENDING' });
    expect(result).toEqual(pendingCompanies);
  });

  it('filters companies by APPROVED status', async () => {
    const repo = makeRepository();
    const approvedCompanies = [makeCompany({ id: 'company-2', onboardingStatus: 'APPROVED' })];
    vi.mocked(repo.listAll).mockResolvedValue(approvedCompanies);

    const useCase = new ListCompaniesUseCase(repo);
    const result = await useCase.execute({ status: 'APPROVED' });

    expect(repo.listAll).toHaveBeenCalledWith({ status: 'APPROVED' });
    expect(result).toEqual(approvedCompanies);
  });

  it('returns empty array when no companies match the filter', async () => {
    const repo = makeRepository();
    vi.mocked(repo.listAll).mockResolvedValue([]);

    const useCase = new ListCompaniesUseCase(repo);
    const result = await useCase.execute({ status: 'REJECTED' });

    expect(result).toEqual([]);
  });
});
