import Link from "next/link";
import Image from "next/image";
import { PrismaThemeConfigRepository } from "../infrastructure/database/repositories/PrismaThemeConfigRepository";
import { GetThemeConfigUseCase } from "../application/use-cases/theme/GetThemeConfigUseCase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let theme = {
    appName: "KYC/KYB Platform",
    logoUrl: null as string | null,
    heroTitle: "Verificação de identidade simples e segura",
    heroSubtitle: "Complete seu cadastro em minutos com total segurança e conformidade regulatória.",
    heroCtaText: "Iniciar cadastro",
  };

  try {
    const repository = new PrismaThemeConfigRepository();
    const useCase = new GetThemeConfigUseCase(repository);
    const t = await useCase.execute();
    theme = {
      appName: t.appName,
      logoUrl: t.logoUrl,
      heroTitle: t.heroTitle ?? theme.heroTitle,
      heroSubtitle: t.heroSubtitle ?? theme.heroSubtitle,
      heroCtaText: t.heroCtaText ?? theme.heroCtaText,
    };
  } catch {
    // use defaults
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Header — sem logo, só navegação ────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">
          <span className="text-sm font-medium text-secondary">{theme.appName}</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-secondary text-sm">Entrar</Link>
            <Link href="/register" className="btn btn-primary text-sm">{theme.heroCtaText}</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — logo + texto */}
            <div className="space-y-8">

              {/* Logo grande integrado ao hero */}
              {!theme.logoUrl && (
                <div className="inline-flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <span className="text-3xl font-bold text-text">{theme.appName}</span>
                </div>
              )}

              {/* Texto */}
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-text leading-tight tracking-tight">
                  {theme.heroTitle}
                </h1>
                <p className="text-xl text-secondary leading-relaxed max-w-lg">
                  {theme.heroSubtitle}
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="btn btn-primary btn-lg">
                  {theme.heroCtaText}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link href="/login" className="btn btn-secondary btn-lg">
                  Já tenho conta
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-5 pt-2">
                {['Dados criptografados', 'Conformidade regulatória', 'Processo 100% digital'].map((badge) => (
                  <span key={badge} className="flex items-center gap-2 text-sm text-secondary">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — logo grande */}
            <div className="hidden lg:flex items-center justify-center">
              {theme.logoUrl ? (
                <Image
                  src={theme.logoUrl}
                  alt={theme.appName}
                  width={480}
                  height={480}
                  className="w-full max-w-sm h-auto object-contain drop-shadow-xl"
                />
              ) : (
                <div className="w-64 h-64 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <span className="text-6xl font-black text-primary">{theme.appName.charAt(0)}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between text-sm text-secondary">
          <span>© {new Date().getFullYear()} {theme.appName}. Todos os direitos reservados.</span>
          <span className="hidden sm:block">Seguro · Regulamentado · Digital</span>
        </div>
      </footer>
    </div>
  );
}
