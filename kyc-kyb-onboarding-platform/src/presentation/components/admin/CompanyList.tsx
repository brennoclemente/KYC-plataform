'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type OnboardingStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

interface Company {
  id: string;
  razaoSocial: string;
  cnpj: string;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
}

const STATUS_LABELS: Record<OnboardingStatus, string> = {
  PENDING: 'Pendente',
  PENDING_REVIEW: 'Em Revisão',
  APPROVED: 'Aprovado',
  REJECTED: 'Reprovado',
};

const STATUS_STYLES: Record<OnboardingStatus, string> = {
  PENDING:        'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  PENDING_REVIEW: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  APPROVED:       'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED:       'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const STATUS_DOT: Record<OnboardingStatus, string> = {
  PENDING:        'bg-amber-400',
  PENDING_REVIEW: 'bg-blue-400',
  APPROVED:       'bg-emerald-400',
  REJECTED:       'bg-red-400',
};

const ALL_STATUSES: OnboardingStatus[] = ['PENDING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'];

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = statusFilter ? `/api/admin/companies?status=${statusFilter}` : '/api/admin/companies';
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCompanies)
      .catch(() => setError('Erro ao carregar empresas.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === '' ? 'bg-primary text-white' : 'bg-white text-secondary border border-gray-200 hover:bg-gray-50'}`}
        >
          Todos
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-white text-secondary border border-gray-200 hover:bg-gray-50'}`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-secondary text-sm">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Carregando...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-600 px-6 py-4">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            {error}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-secondary uppercase tracking-wide">Empresa</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-secondary uppercase tracking-wide">CNPJ</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-secondary uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-secondary uppercase tracking-wide">Cadastro</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-secondary uppercase tracking-wide">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-secondary text-sm">
                    <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    Nenhuma empresa encontrada
                  </td>
                </tr>
              ) : companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-text">{company.razaoSocial}</td>
                  <td className="px-5 py-4 text-secondary font-mono text-xs">{company.cnpj}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${STATUS_STYLES[company.onboardingStatus]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_DOT[company.onboardingStatus]}`} />
                      {STATUS_LABELS[company.onboardingStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-secondary text-xs">
                    {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/companies/${company.id}`}
                      className="text-primary text-sm font-medium hover:underline">
                      Ver detalhes →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
