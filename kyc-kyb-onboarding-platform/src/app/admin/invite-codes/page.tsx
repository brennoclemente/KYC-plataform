'use client';

import { useEffect, useState } from 'react';

interface InviteCode {
  id: string;
  code: string;
  email: string | null;
  isUsed: boolean;
  createdAt: string;
  usedAt: string | null;
}

export default function InviteCodesPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchInviteCodes() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/invite/list');
      if (!res.ok) throw new Error('Erro ao carregar códigos de convite.');
      const data = await res.json();
      setInviteCodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setGeneratedCode(null);
    setCopied(false);
    try {
      const res = await fetch('/api/invite/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Erro ao gerar código de convite.');
      const data = await res.json();
      setGeneratedCode(data.code);
      await fetchInviteCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar código.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text">Códigos de Convite</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? 'Gerando...' : 'Gerar Novo Código'}
        </button>
      </div>

      {generatedCode && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-4">
          <div>
            <p className="text-xs text-green-700 font-medium mb-1">Código gerado com sucesso:</p>
            <span className="font-mono text-lg font-bold text-green-800 tracking-widest">
              {generatedCode}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="ml-auto px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-secondary">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-secondary/20">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/10 text-text font-medium">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data de Criação</th>
                <th className="px-4 py-3">Utilizado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/10">
              {inviteCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-secondary">
                    Nenhum código de convite encontrado.
                  </td>
                </tr>
              ) : (
                inviteCodes.map((invite) => (
                  <tr key={invite.id} className="bg-white hover:bg-secondary/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-text">{invite.code}</td>
                    <td className="px-4 py-3 text-secondary">{invite.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          invite.isUsed
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {invite.isUsed ? 'Utilizado' : 'Ativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      {invite.usedAt
                        ? new Date(invite.usedAt).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
