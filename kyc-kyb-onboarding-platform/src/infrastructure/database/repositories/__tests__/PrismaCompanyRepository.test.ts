import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaCompanyRepository } from '../PrismaCompanyRepository';

vi.mock('../../prisma-client', () => ({
  prisma: {
    company: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../../prisma-client';

const mockCompany = {
  id: 'company-1',
  userId: 'user-1',
  cnpj: '12345678000195',
  razaoSocial: 'Empresa Teste LTDA',
  nomeFantasia: 'Empresa Teste',
  logradouro: 'Rua Teste',
  numero: '100',
  complemento: null,
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01310100',
  faturamentoMensalEstimado: 50000,
  onboardingStatus: 'PENDING' as const,
  reviewedByAdminId: null,
  reviewedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('PrismaCompanyRepository', () => {
  let repo: PrismaCompanyRepository;

  beforeEach(() => {
    repo = new PrismaCompanyRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a company and return it', async () => {
      vi.mocked(prisma.company.create).mockResolvedValue(mockCompany);

      const createData = {
        userId: 'user-1',
        cnpj: '12345678000195',
        razaoSocial: 'Empresa Teste LTDA',
        nomeFantasia: 'Empresa Teste',
        logradouro: 'Rua Teste',
        numero: '100',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
        faturamentoMensalEstimado: 50000,
      };

      const result = await repo.create(createData);

      expect(prisma.company.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockCompany);
    });
  });

  describe('findById', () => {
    it('should return company when found', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany);

      const result = await repo.findById('company-1');

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: 'company-1' } });
      expect(result).toEqual(mockCompany);
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listAll', () => {
    it('should return all companies without filter', async () => {
      vi.mocked(prisma.company.findMany).mockResolvedValue([mockCompany]);

      const result = await repo.listAll();

      expect(prisma.company.findMany).toHaveBeenCalledWith({ where: undefined });
      expect(result).toEqual([mockCompany]);
    });

    it('should filter companies by status', async () => {
      vi.mocked(prisma.company.findMany).mockResolvedValue([mockCompany]);

      const result = await repo.listAll({ status: 'PENDING' });

      expect(prisma.company.findMany).toHaveBeenCalledWith({
        where: { onboardingStatus: 'PENDING' },
      });
      expect(result).toEqual([mockCompany]);
    });

    it('should return empty array when no companies match', async () => {
      vi.mocked(prisma.company.findMany).mockResolvedValue([]);

      const result = await repo.listAll({ status: 'APPROVED' });

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update company status and return updated company', async () => {
      const updatedCompany = {
        ...mockCompany,
        onboardingStatus: 'APPROVED' as const,
        reviewedByAdminId: 'admin-1',
        reviewedAt: new Date('2024-02-01'),
      };
      vi.mocked(prisma.company.update).mockResolvedValue(updatedCompany);

      const result = await repo.updateStatus('company-1', 'APPROVED', 'admin-1');

      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: {
          onboardingStatus: 'APPROVED',
          reviewedByAdminId: 'admin-1',
          reviewedAt: expect.any(Date),
        },
      });
      expect(result.onboardingStatus).toBe('APPROVED');
      expect(result.reviewedByAdminId).toBe('admin-1');
    });
  });
});
