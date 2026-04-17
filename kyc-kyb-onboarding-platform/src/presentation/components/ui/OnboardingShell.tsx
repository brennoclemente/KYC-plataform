import Link from 'next/link';

interface Step { label: string; active: boolean; done: boolean; }

interface OnboardingShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  steps?: Step[];
  appName?: string;
}

export default function OnboardingShell({ children, title, subtitle, steps, appName = 'KYC/KYB Platform' }: OnboardingShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-text text-sm">{appName}</span>
          <Link href="/login" className="text-xs text-secondary hover:text-primary transition-colors">Sair</Link>
        </div>
      </header>

      {/* Stepper */}
      {steps && steps.length > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center gap-0">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      step.done ? 'bg-emerald-500 text-white' :
                      step.active ? 'bg-primary text-white' :
                      'bg-gray-100 text-secondary'
                    }`}>
                      {step.done ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${step.active ? 'text-text' : step.done ? 'text-emerald-600' : 'text-secondary'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 ${step.done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-secondary">{subtitle}</p>}
          </div>
          <div className="card p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
