import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaPartnerRepository } from '../PrismaPartnerRepository';

vi.mock('../../prisma-client', () => ({
  prisma: {
    partner: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../prisma-client';

const mockPartner = {
  id: 'partner-1',
  companyId: 'company-1',
  nomeCompleto: 'João Silva',
  cpf: '12345678901',
  dataNascimento: new Date('1990-01-01'),
  cargo: 'Sócio',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('PrismaPartnerRepository', () => {
  let repo: PrismaPartnerRepository;

  beforeEach(() => {
    repo = new PrismaPartnerRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a partner and return it', async () => {
      vi.mocked(prisma.partner.create).mockResolvedValue(mockPartner);

      const createData = {
        companyId: 'company-1',
        nomeCompleto: 'João Silva',
        cpf: '12345678901',
        dataNascimento: new Date('1990-01-01'),
        cargo: 'Sócio',
      };

      const result = await repo.create(createData);

      expect(prisma.partner.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockPartner);
    });
  });

  describe('findById', () => {
    it('should return partner when found', async () => {
      vi.mocked(prisma.partner.findUnique).mockResolvedValue(mockPartner);

      const result = await repo.findById('partner-1');

      expect(prisma.partner.findUnique).toHaveBeenCalledWith({ where: { id: 'partner-1' } });
      expect(result).toEqual(mockPartner);
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.partner.findUnique).mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCompanyId', () => {
    it('should return all partners for a company', async () => {
      const partner2 = { ...mockPartner, id: 'partner-2', nomeCompleto: 'Maria Santos' };
      vi.mocked(prisma.partner.findMany).mockResolvedValue([mockPartner, partner2]);

      const result = await repo.findByCompanyId('company-1');

      expect(prisma.partner.findMany).toHaveBeenCalledWith({ where: { companyId: 'company-1' } });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockPartner);
    });

    it('should return empty array when company has no partners', async () => {
      vi.mocked(prisma.partner.findMany).mockResolvedValue([]);

      const result = await repo.findByCompanyId('company-no-partners');

      expect(result).toEqual([]);
    });
  });
});
