'use client';

import { useEffect, useState } from 'react';
import DocumentViewer from './DocumentViewer';

type OnboardingStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

interface OcrField {
  value: string;
  confidence: number;
  lowConfidence: boolean;
}

interface DocumentData {
  id: string;
  documentType: string;
  presignedUrl: string;
  ocrRawText: string | null;
  ocrStructuredData: Record<string, OcrField> | null;
  ocrStatus: string;
}

interface Company {
  id: string;
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string | null;
  email: string;
  telefone: string | null;
  endereco: string | null;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

interface Partner {
  id: string;
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string | null;
  participacao: number | null;
  documents: DocumentData[];
}

interface CompanyDetailData {
  company: Company;
  partners: Partner[];
  companyDocuments: DocumentData[];
}

const STATUS_LABELS: Record<OnboardingStatus, string> = {
  PENDING: 'Pendente',
  PENDING_REVIEW: 'Em Revisão',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};

const STATUS_COLORS: Record<OnboardingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

interface CompanyDetailProps {
  companyId: string;
}

export default function CompanyDetail({ companyId }: CompanyDetailProps) {
  const [data, setData] = useState<CompanyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/companies/${companyId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Erro ao carregar empresa.');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyId]);

  async function handleStatusUpdate(status: 'APPROVED' | 'REJECTED') {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Erro ao atualizar status.');
      }
      const updated = await res.json();
      setData((prev) =>
        prev ? { ...prev, company: { ...prev.company, onboardingStatus: updated.onboardingStatus } } : prev
      );
      setActionSuccess(status === 'APPROVED' ? 'Empresa aprovada com sucesso.' : 'Empresa reprovada.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-secondary">Carregando...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
        {error}
      </p>
    );
  }

  if (!data) return null;

  const { company, partners, companyDocuments } = data;
  const statusLabel = STATUS_LABELS[company.onboardingStatus];
  const statusColor = STATUS_COLORS[company.onboardingStatus];

  return (
    <div className="space-y-8">
      {/* Company KYB card */}
      <section className="bg-white border border-secondary/20 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">{company.razaoSocial}</h2>
            {company.nomeFantasia && (
              <p className="text-sm text-secondary">{company.nomeFantasia}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-secondary font-medium">CNPJ:</span>{' '}
            <span className="text-text">{company.cnpj}</span>
          </div>
          <div>
            <span className="text-secondary font-medium">E-mail:</span>{' '}
            <span className="text-text">{company.email}</span>
          </div>
          {company.telefone && (
            <div>
              <span className="text-secondary font-medium">Telefone:</span>{' '}
              <span className="text-text">{company.telefone}</span>
            </div>
          )}
          {company.endereco && (
            <div>
              <span className="text-secondary font-medium">Endereço:</span>{' '}
              <span className="text-text">{company.endereco}</span>
            </div>
          )}
          <div>
            <span className="text-secondary font-medium">Criado em:</span>{' '}
            <span className="text-text">
              {new Date(company.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-secondary/10">
          <button
            onClick={() => handleStatusUpdate('APPROVED')}
            disabled={actionLoading || company.onboardingStatus === 'APPROVED'}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Aprovar
          </button>
          <button
            onClick={() => handleStatusUpdate('REJECTED')}
            disabled={actionLoading || company.onboardingStatus === 'REJECTED'}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reprovar
          </button>
          {actionLoading && <span className="text-sm text-secondary">Salvando...</span>}
          {actionError && (
            <span className="text-sm text-red-600">{actionError}</span>
          )}
          {actionSuccess && (
            <span className="text-sm text-green-600">{actionSuccess}</span>
          )}
        </div>
      </section>

      {/* Company documents */}
      {companyDocuments.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-text">Documentos da Empresa</h3>
          <div className="space-y-4">
            {companyDocuments.map((doc) => (
              <DocumentViewer key={doc.id} document={doc} />
            ))}
          </div>
        </section>
      )}

      {/* Partners */}
      {partners.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-text">Sócios / Partners</h3>
          {partners.map((partner) => (
            <div key={partner.id} className="border border-secondary/20 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-secondary/5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-medium text-text">{partner.nomeCompleto}</span>
                <span className="text-sm text-secondary">CPF: {partner.cpf}</span>
                <span className="text-sm text-secondary">{partner.email}</span>
                {partner.participacao != null && (
                  <span className="text-sm text-secondary">
                    Participação: {partner.participacao}%
                  </span>
                )}
              </div>
              {partner.documents.length > 0 ? (
                <div className="p-4 space-y-4">
                  {partner.documents.map((doc) => (
                    <DocumentViewer key={doc.id} document={doc} />
                  ))}
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-secondary italic">
                  Nenhum documento enviado.
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
