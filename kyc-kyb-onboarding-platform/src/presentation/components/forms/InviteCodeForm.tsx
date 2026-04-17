'use client';

import { useState } from 'react';

interface InviteCodeFormProps {
  onSuccess: (code: string) => void;
}

export default function InviteCodeForm({ onSuccess }: InviteCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        onSuccess(code);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Código de convite inválido.');
      }
    } catch {
      setError('Erro ao validar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="inviteCode" className="block text-sm font-medium text-text mb-1">
          Código de convite
        </label>
        <input
          id="inviteCode"
          type="text"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 border border-secondary/30 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="XXXX-XXXX"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Validando...' : 'Validar'}
      </button>
    </form>
  );
}
