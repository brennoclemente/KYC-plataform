// src/domain/entities/ThemeConfig.ts
export interface ThemeConfig {
  id: string;
  tenantId: string;
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorText: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  appName: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroCtaText: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
