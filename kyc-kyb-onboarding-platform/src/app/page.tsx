import Link from "next/link";
import Image from "next/image";
import { PrismaThemeConfigRepository } from "../infrastructure/database/repositories/PrismaThemeConfigRepository";
import { GetThemeConfigUseCase } from "../application/use-cases/theme/GetThemeConfigUseCase";

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
    theme = { ...theme, ...t };
  } catch {
    // use defaults
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme.logoUrl ? (
              <Image
                src={theme.logoUrl}
                alt={theme.appName}
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-semibold text-text">{theme.appName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-secondary text-sm">
              Entrar
            </Link>
            <Link href="/register" className="btn btn-primary text-sm">
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Icon / illustration */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mx-auto">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-text leading-tight tracking-tight">
              {theme.heroTitle}
            </h1>
            <p className="text-lg text-secondary leading-relaxed max-w-xl mx-auto">
              {theme.heroSubtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn btn-primary btn-lg w-full sm:w-auto">
              {theme.heroCtaText}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg w-full sm:w-auto">
              Já tenho conta
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-secondary">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Dados criptografados
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Conformidade regulatória
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Processo 100% digital
            </span>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-secondary">
        © {new Date().getFullYear()} {theme.appName}. Todos os direitos reservados.
      </footer>
    </div>
  );
}
