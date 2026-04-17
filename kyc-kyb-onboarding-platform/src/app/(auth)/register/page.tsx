'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [inviteError, setInviteError] = useState('');
  const [validating, setValidating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleValidateInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setValidating(true);
    try {
      const res = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      });
      if (res.ok) { setStep(2); }
      else {
        const data = await res.json().catch(() => ({}));
        setInviteError(data.error ?? 'Código de convite inválido.');
      }
    } catch { setInviteError('Erro ao validar o código. Tente novamente.'); }
    finally { setValidating(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, inviteCode }),
      });
      if (res.ok) { router.push('/login'); }
      else {
        const data = await res.json().catch(() => ({}));
        setRegisterError(data.error ?? 'Erro ao criar conta. Tente novamente.');
      }
    } catch { setRegisterError('Erro ao criar conta. Tente novamente.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="font-semibold text-text text-sm hover:text-primary transition-colors">
            ← Voltar ao início
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-100 text-secondary'}`}>1</div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-100 text-secondary'}`}>2</div>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-text">Criar conta</h1>
                <p className="mt-1.5 text-sm text-secondary">Insira o código de convite recebido para continuar</p>
              </div>
              <form onSubmit={handleValidateInvite} className="space-y-4">
                <div>
                  <label htmlFor="inviteCode" className="label">Código de convite</label>
                  <input id="inviteCode" type="text" required value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="input font-mono tracking-widest" placeholder="XXXXXXXX" />
                </div>
                {inviteError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    {inviteError}
                  </div>
                )}
                <button type="submit" disabled={validating} className="btn-primary w-full btn-lg mt-2">
                  {validating ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Validando...</> : 'Validar código'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-text">Seus dados de acesso</h1>
                <p className="mt-1.5 text-sm text-secondary">Código validado. Defina seu e-mail e senha.</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="label">Código de convite</label>
                  <input type="text" disabled value={inviteCode}
                    className="input font-mono tracking-widest opacity-50 cursor-not-allowed" />
                </div>
                <div>
                  <label htmlFor="email" className="label">E-mail</label>
                  <input id="email" type="email" required autoComplete="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input" placeholder="seu@email.com" />
                </div>
                <div>
                  <label htmlFor="password" className="label">Senha</label>
                  <input id="password" type="password" required autoComplete="new-password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input" placeholder="Mínimo 8 caracteres" />
                </div>
                {registerError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    {registerError}
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                    Voltar
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Criando...</> : 'Criar conta'}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="mt-6 text-sm text-center text-secondary">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
