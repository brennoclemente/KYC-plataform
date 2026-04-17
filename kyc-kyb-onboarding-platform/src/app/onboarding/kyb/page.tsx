'use client';

import { useRouter } from 'next/navigation';
import KYBForm from '@/presentation/components/forms/KYBForm';
import OnboardingShell from '@/presentation/components/ui/OnboardingShell';

const STEPS = [
  { label: 'Convite', active: false, done: true },
  { label: 'Empresa', active: true, done: false },
  { label: 'Sócios', active: false, done: false },
];

export default function KYBPage() {
  const router = useRouter();

  function handleSuccess(companyId: string) {
    router.push(`/onboarding/kyc?companyId=${companyId}`);
  }

  return (
    <OnboardingShell
      title="Dados da empresa"
      subtitle="Preencha as informações da sua empresa e envie os documentos necessários"
      steps={STEPS}
    >
      <KYBForm onSuccess={handleSuccess} />
    </OnboardingShell>
  );
}
