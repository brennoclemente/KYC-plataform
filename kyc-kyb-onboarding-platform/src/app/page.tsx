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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          {theme.logoUrl ? (
            <Image src={theme.logoUrl} alt={theme.appName} width={140} height={40}
              className="h-10 w-auto object-contain" />
          ) : (
            <span className="text-xl font-bold text-text">{theme.appName}</span>
          )}
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-secondary text-sm">Entrar</Link>
            <Link href="/register" className="btn btn-primary text-sm">{theme.heroCtaText}</Link>
          </div>
        </div>
      </header>

      {/* ── Hero — split layout ─────────────────────────────────────────────── */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — text content */}
            <div className="space-y-8">
              {/* Logo grande no hero (se existir) */}
              {theme.logoUrl && (
                <div className="mb-4">
                  <Image src={theme.logoUrl} alt={theme.appName} width={220} height={64}
                    className="h-16 w-auto object-contain" />
                </div>
              )}

              <div className="space-y-5">
                <h1 className="text-5xl lg:text-6xl font-bold text-text leading-tight tracking-tight">
                  {theme.heroTitle}
                </h1>
                <p className="text-xl text-secondary leading-relaxed max-w-lg">
                  {theme.heroSubtitle}
                </p>
              </div>

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
                {[
                  'Dados criptografados',
                  'Conformidade regulatória',
                  'Processo 100% digital',
                ].map((badge) => (
                  <span key={badge} className="flex items-center gap-2 text-sm text-secondary">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — visual card */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-primary/5 rounded-3xl transform rotate-3" />
                <div className="relative bg-white rounded-2xl shadow-lg p-8 space-y-6 border border-gray-100">
                  {/* Steps */}
                  {[
                    { step: '01', title: 'Código de convite', desc: 'Receba seu código exclusivo de acesso' },
                    { step: '02', title: 'Dados da empresa', desc: 'Preencha as informações empresariais e envie documentos' },
                    { step: '03', title: 'Dados dos sócios', desc: 'Cadastre os representantes legais' },
                    { step: '04', title: 'Análise e aprovação', desc: 'Nossa equipe revisa e aprova em até 24h' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{item.title}</p>
                        <p className="text-xs text-secondary mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
