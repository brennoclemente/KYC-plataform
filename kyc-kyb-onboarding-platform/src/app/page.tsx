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
              {theme.logoUrl ? (
                <Image
                  src={theme.logoUrl}
                  alt={theme.appName}
                  width={280}
                  height={80}
                  className="h-20 w-auto object-contain"
                />
              ) : (
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

            {/* Right — card de passos */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-primary/5 rounded-3xl transform rotate-3" />
                <div className="relative bg-white rounded-2xl shadow-lg p-8 space-y-6 border border-gray-100">
                  {[
                    { step: '01', title: 'Código de convite', desc: 'Receba seu código exclusivo de acesso' },
                    { step: '02', title: 'Dados da empresa', desc: 'Preencha as informações empresariais e envie documentos' },
                    { step: '03', title: 'Dados dos sócios', desc: 'Cadastre os representantes legais' },
                    { step: '04', title: 'Análise e aprovação', desc: 'Nossa equipe revisa e aprova em até 24h' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4">
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
