'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import KYCPartnerForm from '@/presentation/components/forms/KYCPartnerForm';
import OnboardingShell from '@/presentation/components/ui/OnboardingShell';

const STEPS = [
  { label: 'Convite', active: false, done: true },
  { label: 'Empresa', active: false, done: true },
  { label: 'Sócios', active: true, done: false },
];

const STEPS_DONE = [
  { label: 'Convite', active: false, done: true },
  { label: 'Empresa', active: false, done: true },
  { label: 'Sócios', active: false, done: true },
];

function KYCPageContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId') ?? '';
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <OnboardingShell
        title="Cadastro concluído!"
        subtitle="Seus dados foram enviados com sucesso"
        steps={STEPS_DONE}
      >
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text">Tudo certo!</h2>
            <p className="mt-2 text-sm text-secondary max-w-sm mx-auto">
              Seu cadastro foi enviado para análise. Você será notificado assim que o processo for concluído.
            </p>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      title="Dados dos sócios"
      subtitle="Cadastre os sócios e representantes legais da empresa"
      steps={STEPS}
    >
      <KYCPartnerForm companyId={companyId} onSuccess={() => setDone(true)} />
    </OnboardingShell>
  );
}

export default function KYCPage() {
  return <Suspense><KYCPageContent /></Suspense>;
}
