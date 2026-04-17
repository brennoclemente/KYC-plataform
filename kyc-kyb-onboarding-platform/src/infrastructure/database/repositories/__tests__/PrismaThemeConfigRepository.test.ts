import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaThemeConfigRepository } from '../PrismaThemeConfigRepository';

vi.mock('../../prisma-client', () => ({
  prisma: {
    themeConfig: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../../prisma-client';

const mockTheme = {
  id: 'theme-1',
  tenantId: 'tenant-1',
  colorPrimary: '#007bff',
  colorSecondary: '#6c757d',
  colorBackground: '#ffffff',
  colorText: '#212529',
  logoUrl: 'https://example.com/logo.png',
  faviconUrl: null,
  appName: 'KYC Platform',
  heroTitle: null,
  heroSubtitle: null,
  heroCtaText: null,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('PrismaThemeConfigRepository', () => {
  let repo: PrismaThemeConfigRepository;

  beforeEach(() => {
    repo = new PrismaThemeConfigRepository();
    vi.clearAllMocks();
  });

  describe('findActive', () => {
    it('should return active theme config when found', async () => {
      vi.mocked(prisma.themeConfig.findFirst).mockResolvedValue(mockTheme);

      const result = await repo.findActive();

      expect(prisma.themeConfig.findFirst).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(result).toEqual(mockTheme);
    });

    it('should return null when no active theme exists', async () => {
      vi.mocked(prisma.themeConfig.findFirst).mockResolvedValue(null);

      const result = await repo.findActive();

      expect(result).toBeNull();
    });
  });

  describe('findByTenantId', () => {
    it('should return theme config for a tenant', async () => {
      vi.mocked(prisma.themeConfig.findFirst).mockResolvedValue(mockTheme);

      const result = await repo.findByTenantId('tenant-1');

      expect(prisma.themeConfig.findFirst).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
      expect(result).toEqual(mockTheme);
    });

    it('should return null when tenant has no theme config', async () => {
      vi.mocked(prisma.themeConfig.findFirst).mockResolvedValue(null);

      const result = await repo.findByTenantId('unknown-tenant');

      expect(result).toBeNull();
    });
  });
});
