import { describe, it, expect, vi } from 'vitest';
import { GetThemeConfigUseCase } from '../GetThemeConfigUseCase';
import { IThemeConfigRepository } from '../../../../domain/repositories/IThemeConfigRepository';
import { ThemeConfig } from '../../../../domain/entities/ThemeConfig';

const makeRepo = (active: ThemeConfig | null): IThemeConfigRepository => ({
  findActive: vi.fn().mockResolvedValue(active),
  findByTenantId: vi.fn(),
  upsertActive: vi.fn(),
});

describe('GetThemeConfigUseCase', () => {
  it('returns default values when no ThemeConfig is defined', async () => {
    const useCase = new GetThemeConfigUseCase(makeRepo(null));
    const result = await useCase.execute();

    expect(result).toEqual({
      colorPrimary: '#3B82F6',
      colorSecondary: '#6B7280',
      colorBackground: '#FFFFFF',
      colorText: '#111827',
      logoUrl: null,
      faviconUrl: null,
      appName: 'KYC/KYB Platform',
      heroTitle: 'Verificação de identidade simples e segura',
      heroSubtitle: 'Complete seu cadastro em minutos com total segurança e conformidade regulatória.',
      heroCtaText: 'Iniciar cadastro',
    });
  });

  it('returns active ThemeConfig when it exists', async () => {
    const activeTheme: ThemeConfig = {
      id: 'theme-1',
      tenantId: 'tenant-1',
      colorPrimary: '#FF0000',
      colorSecondary: '#00FF00',
      colorBackground: '#0000FF',
      colorText: '#FFFFFF',
      logoUrl: 'https://example.com/logo.png',
      faviconUrl: 'https://example.com/favicon.ico',
      appName: 'My Platform',
      heroTitle: 'Meu título',
      heroSubtitle: 'Meu subtítulo',
      heroCtaText: 'Começar',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const useCase = new GetThemeConfigUseCase(makeRepo(activeTheme));
    const result = await useCase.execute();

    expect(result).toEqual({
      colorPrimary: '#FF0000',
      colorSecondary: '#00FF00',
      colorBackground: '#0000FF',
      colorText: '#FFFFFF',
      logoUrl: 'https://example.com/logo.png',
      faviconUrl: 'https://example.com/favicon.ico',
      appName: 'My Platform',
      heroTitle: 'Meu título',
      heroSubtitle: 'Meu subtítulo',
      heroCtaText: 'Começar',
    });
  });

  it('falls back to default hero texts when ThemeConfig has nulls', async () => {
    const themeWithNulls: ThemeConfig = {
      id: 'theme-2',
      tenantId: 'tenant-1',
      colorPrimary: '#111111',
      colorSecondary: '#222222',
      colorBackground: '#FFFFFF',
      colorText: '#000000',
      logoUrl: null,
      faviconUrl: null,
      appName: 'Minimal Platform',
      heroTitle: null,
      heroSubtitle: null,
      heroCtaText: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const useCase = new GetThemeConfigUseCase(makeRepo(themeWithNulls));
    const result = await useCase.execute();

    expect(result.heroTitle).toBe('Verificação de identidade simples e segura');
    expect(result.heroSubtitle).toBe('Complete seu cadastro em minutos com total segurança e conformidade regulatória.');
    expect(result.heroCtaText).toBe('Iniciar cadastro');
    expect(result.appName).toBe('Minimal Platform');
  });
});
