import { ThemeConfig } from '../../../domain/entities/ThemeConfig';
import { ThemeConfigDTO } from '../../../application/dtos/ThemeConfigDTO';
import { IThemeConfigRepository } from '../../../domain/repositories/IThemeConfigRepository';
import { prisma } from '../prisma-client';

export class PrismaThemeConfigRepository implements IThemeConfigRepository {
  async findActive(): Promise<ThemeConfig | null> {
    const theme = await prisma.themeConfig.findFirst({ where: { isActive: true } });
    return theme as ThemeConfig | null;
  }

  async findByTenantId(tenantId: string): Promise<ThemeConfig | null> {
    const theme = await prisma.themeConfig.findFirst({ where: { tenantId } });
    return theme as ThemeConfig | null;
  }

  async upsertActive(data: ThemeConfigDTO & { tenantId?: string }): Promise<ThemeConfig> {
    const existing = await prisma.themeConfig.findFirst({ where: { isActive: true } });

    if (existing) {
      const updated = await prisma.themeConfig.update({
        where: { id: existing.id },
        data: {
          colorPrimary: data.colorPrimary,
          colorSecondary: data.colorSecondary,
          colorBackground: data.colorBackground,
          colorText: data.colorText,
          logoUrl: data.logoUrl,
          faviconUrl: data.faviconUrl,
          appName: data.appName,
          heroTitle: data.heroTitle,
          heroSubtitle: data.heroSubtitle,
          heroCtaText: data.heroCtaText,
        },
      });
      return updated as ThemeConfig;
    }

    const created = await prisma.themeConfig.create({
      data: {
        tenantId: data.tenantId ?? 'default',
        colorPrimary: data.colorPrimary,
        colorSecondary: data.colorSecondary,
        colorBackground: data.colorBackground,
        colorText: data.colorText,
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        appName: data.appName,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroCtaText: data.heroCtaText,
        isActive: true,
      },
    });
    return created as ThemeConfig;
  }
}
