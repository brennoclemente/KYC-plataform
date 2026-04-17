import type { Metadata } from "next";
import "./globals.css";
import { PrismaThemeConfigRepository } from "../infrastructure/database/repositories/PrismaThemeConfigRepository";
import { GetThemeConfigUseCase } from "../application/use-cases/theme/GetThemeConfigUseCase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const repository = new PrismaThemeConfigRepository();
    const useCase = new GetThemeConfigUseCase(repository);
    const theme = await useCase.execute();
    return {
      title: theme.appName,
      description: theme.heroSubtitle ?? "Plataforma de Onboarding KYC/KYB",
      icons: theme.faviconUrl ? { icon: theme.faviconUrl } : undefined,
    };
  } catch {
    return {
      title: "KYC/KYB Platform",
      description: "Plataforma de Onboarding KYC/KYB",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let theme = {
    colorPrimary: "#3B82F6",
    colorSecondary: "#6B7280",
    colorBackground: "#F9FAFB",
    colorText: "#111827",
    faviconUrl: null as string | null,
  };

  try {
    const repository = new PrismaThemeConfigRepository();
    const useCase = new GetThemeConfigUseCase(repository);
    const t = await useCase.execute();
    theme = { ...theme, ...t };
  } catch {
    // use defaults if DB not ready yet
  }

  return (
    <html
      lang="pt-BR"
      style={{
        "--color-primary":    theme.colorPrimary,
        "--color-secondary":  theme.colorSecondary,
        "--color-background": theme.colorBackground,
        "--color-text":       theme.colorText,
      } as React.CSSProperties}
    >
      <head>
        {theme.faviconUrl && (
          <link rel="icon" href={theme.faviconUrl} />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
