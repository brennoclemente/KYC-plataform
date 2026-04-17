import { IThemeConfigRepository } from '../../../domain/repositories/IThemeConfigRepository';
import { ThemeConfigDTO } from '../../dtos/ThemeConfigDTO';

const DEFAULT_THEME: ThemeConfigDTO = {
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
};

export class GetThemeConfigUseCase {
  constructor(private readonly themeConfigRepository: IThemeConfigRepository) {}

  async execute(): Promise<ThemeConfigDTO> {
    const theme = await this.themeConfigRepository.findActive();

    if (!theme) {
      return DEFAULT_THEME;
    }

    return {
      colorPrimary: theme.colorPrimary,
      colorSecondary: theme.colorSecondary,
      colorBackground: theme.colorBackground,
      colorText: theme.colorText,
      logoUrl: theme.logoUrl,
      faviconUrl: theme.faviconUrl,
      appName: theme.appName,
      heroTitle: theme.heroTitle ?? DEFAULT_THEME.heroTitle,
      heroSubtitle: theme.heroSubtitle ?? DEFAULT_THEME.heroSubtitle,
      heroCtaText: theme.heroCtaText ?? DEFAULT_THEME.heroCtaText,
    };
  }
}
