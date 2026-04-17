'use client';

import { useRouter } from 'next/navigation';
import InviteCodeForm from '@/presentation/components/forms/InviteCodeForm';
import OnboardingShell from '@/presentation/components/ui/OnboardingShell';

const STEPS = [
  { label: 'Convite', active: true, done: false },
  { label: 'Empresa', active: false, done: false },
  { label: 'Sócios', active: false, done: false },
];

export default function InvitePage() {
  const router = useRouter();

  function handleSuccess(code: string) {
    router.push(`/onboarding/kyb?inviteCode=${encodeURIComponent(code)}`);
  }

  return (
    <OnboardingShell
      title="Validar código de convite"
      subtitle="Insira o código recebido para iniciar o processo de cadastro"
      steps={STEPS}
    >
      <InviteCodeForm onSuccess={handleSuccess} />
    </OnboardingShell>
  );
}
