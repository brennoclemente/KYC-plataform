'use client';

import { useEffect, useState } from 'react';

type OnboardingStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
type DocStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface DocumentData {
  id: string;
  documentType: string;
  presignedUrl: string;
  mimeType: string;
  documentStatus: string;
  rejectionReason: string | null;
}

interface Company {
  id: string;
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string | null;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  faturamentoMensalEstimado: number;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
}

interface Partner {
  id: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  cargo: string;
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
  REJECTED: 'Reprovado',
};

const STATUS_STYLES: Record<OnboardingStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  PENDING_REVIEW: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  CONTRATO_SOCIAL: 'Contrato Social',
  CARTAO_CNPJ: 'Cartão CNPJ',
  RG_FRENTE: 'RG — Frente',
  RG_VERSO: 'RG — Verso',
  CNH_FRENTE: 'CNH — Frente',
  CNH_VERSO: 'CNH — Verso',
  SELFIE: 'Selfie',
  COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
};

const DOC_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Reprovado',
};

interface DocActionState {
  docId: string;
  loading: boolean;
  rejectionReason: string;
  showRejectInput: boolean;
}

interface CompanyDetailProps {
  companyId: string;
}

export default function CompanyDetail({ companyId }: CompanyDetailProps) {
  const [data, setData] = useState<CompanyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterMsg, setMasterMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [docActions, setDocActions] = useState<Record<string, DocActionState>>({});
  const [viewingDoc, setViewingDoc] = useState<DocumentData | null>(null);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erro ao carregar.');
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  function getDocAction(docId: string): DocActionState {
    return docActions[docId] ?? { docId, loading: false, rejectionReason: '', showRejectInput: false };
  }

  function setDocAction(docId: string, updates: Partial<DocActionState>) {
    setDocActions(prev => ({ ...prev, [docId]: { ...getDocAction(docId), ...updates } }));
  }

  async function handleDocStatus(docId: string, status: DocStatus) {
    const action = getDocAction(docId);
    if (status === 'REJECTED' && !action.rejectionReason.trim()) {
      setDocAction(docId, { showRejectInput: true });
      return;
    }
    setDocAction(docId, { loading: true });
    try {
      const res = await fetch(`/api/admin/documents/${docId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: action.rejectionReason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? 'Erro ao atualizar documento.');
        setDocAction(docId, { loading: false });
        return;
      }

      // Update local state immediately without full reload
      const rejectionReason = status === 'REJECTED' ? action.rejectionReason : null;
      setData(prev => {
        if (!prev) return prev;
        const updateDoc = (doc: DocumentData) =>
          doc.id === docId ? { ...doc, documentStatus: status, rejectionReason } : doc;
        return {
          ...prev,
          companyDocuments: prev.companyDocuments.map(updateDoc),
          partners: prev.partners.map(p => ({
            ...p,
            documents: p.documents.map(updateDoc),
          })),
        };
      });

      setDocAction(docId, { loading: false, showRejectInput: false, rejectionReason: '' });
    } catch {
      setDocAction(docId, { loading: false });
      alert('Erro de conexão. Tente novamente.');
    }
  }

  async function handleMasterStatus(status: 'APPROVED' | 'REJECTED') {
    setMasterLoading(true);
    setMasterMsg(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMasterMsg({ type: 'error', text: d.error ?? 'Erro ao atualizar.' });
        return;
      }
      setMasterMsg({ type: 'success', text: status === 'APPROVED' ? 'Cadastro aprovado!' : 'Cadastro reprovado.' });
      fetchData();
    } finally {
      setMasterLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir esta empresa? Todos os documentos e sócios serão removidos.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, { method: 'DELETE' });
      if (!res.ok) { alert((await res.json().catch(() => ({}))).error ?? 'Erro ao excluir.'); return; }
      window.location.href = '/admin';
    } finally { setDeleting(false); }
  }

  if (loading) return <div className="flex items-center gap-2 text-secondary text-sm py-8"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Carregando...</div>;
  if (error) return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>;
  if (!data) return null;

  const { company, partners, companyDocuments } = data;

  function DocumentCard({ doc }: { doc: DocumentData }) {
    const action = getDocAction(doc.id);
    const docStatus = (doc.documentStatus ?? 'PENDING') as DocStatus;
    return (
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-sm font-medium text-text">{DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge text-xs ${DOC_STATUS_STYLES[docStatus]}`}>{DOC_STATUS_LABELS[docStatus]}</span>
            <a href={doc.presignedUrl} target="_blank" rel="noopener noreferrer"
              className="btn btn-secondary btn-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ver
            </a>
          </div>
        </div>

        {doc.rejectionReason && docStatus === 'REJECTED' && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
            Motivo: {doc.rejectionReason}
          </p>
        )}

        {action.showRejectInput && (
          <div className="space-y-2">
            <textarea
              rows={2}
              placeholder="Informe o motivo da reprovação..."
              value={action.rejectionReason}
              onChange={e => setDocAction(doc.id, { rejectionReason: e.target.value })}
              className="input text-sm resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => handleDocStatus(doc.id, 'REJECTED')} disabled={action.loading || !action.rejectionReason.trim()}
                className="btn-danger btn-sm flex-1">
                {action.loading ? 'Salvando...' : 'Confirmar reprovação'}
              </button>
              <button onClick={() => setDocAction(doc.id, { showRejectInput: false, rejectionReason: '' })}
                className="btn-secondary btn-sm">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {!action.showRejectInput && (
          <div className="flex gap-2">
            <button onClick={() => handleDocStatus(doc.id, 'APPROVED')} disabled={action.loading || docStatus === 'APPROVED'}
              className="btn-success btn-sm flex-1 disabled:opacity-40">
              {action.loading ? '...' : '✓ Aprovar'}
            </button>
            <button onClick={() => setDocAction(doc.id, { showRejectInput: true })} disabled={action.loading || docStatus === 'REJECTED'}
              className="btn-danger btn-sm flex-1 disabled:opacity-40">
              ✗ Reprovar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-text">{company.razaoSocial}</h2>
            {company.nomeFantasia && <p className="text-sm text-secondary">{company.nomeFantasia}</p>}
          </div>
          <span className={`badge text-xs ${STATUS_STYLES[company.onboardingStatus]}`}>
            {STATUS_LABELS[company.onboardingStatus]}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-5">
          <div><span className="text-secondary">CNPJ:</span> <span className="font-medium">{company.cnpj}</span></div>
          <div><span className="text-secondary">Criado em:</span> <span>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</span></div>
          <div><span className="text-secondary">Faturamento:</span> <span>R$ {company.faturamentoMensalEstimado?.toLocaleString('pt-BR')}</span></div>
          <div className="col-span-2 sm:col-span-3"><span className="text-secondary">Endereço:</span> <span>{company.logradouro}, {company.numero}{company.complemento ? `, ${company.complemento}` : ''} — {company.bairro}, {company.cidade}/{company.estado} — {company.cep}</span></div>
        </div>

        {/* Master actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 flex-wrap">
          <button onClick={() => handleMasterStatus('APPROVED')} disabled={masterLoading || company.onboardingStatus === 'APPROVED'}
            className="btn-success btn-lg disabled:opacity-40">
            ✓ Aprovar cadastro completo
          </button>
          <button onClick={() => handleMasterStatus('REJECTED')} disabled={masterLoading || company.onboardingStatus === 'REJECTED'}
            className="btn-danger disabled:opacity-40">
            ✗ Reprovar cadastro
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="ml-auto btn btn-sm bg-gray-100 text-red-600 border border-red-200 hover:bg-red-50">
            {deleting ? 'Excluindo...' : 'Excluir empresa'}
          </button>
        </div>

        {masterMsg && (
          <p className={`mt-3 text-sm px-3 py-2 rounded-lg ${masterMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {masterMsg.text}
          </p>
        )}
      </div>

      {/* Company documents */}
      {companyDocuments.length > 0 && (
        <section className="space-y-3">
          <h3 className="section-title">Documentos da Empresa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {companyDocuments.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
          </div>
        </section>
      )}

      {/* Partners */}
      {partners.length > 0 && (
        <section className="space-y-4">
          <h3 className="section-title">Sócios</h3>
          {partners.map(partner => (
            <div key={partner.id} className="card overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="font-semibold text-text">{partner.nomeCompleto}</p>
                <div className="flex gap-4 text-xs text-secondary mt-0.5">
                  <span>CPF: {partner.cpf}</span>
                  <span>Cargo: {partner.cargo}</span>
                  <span>Nascimento: {new Date(partner.dataNascimento).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              {partner.documents.length > 0 ? (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {partner.documents.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
                </div>
              ) : (
                <p className="px-5 py-3 text-sm text-secondary italic">Nenhum documento enviado.</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Document viewer modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setViewingDoc(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <span className="font-medium text-text">{DOC_TYPE_LABELS[viewingDoc.documentType] ?? viewingDoc.documentType}</span>
              <button onClick={() => setViewingDoc(null)} className="text-secondary hover:text-text">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50 min-h-64">
              {viewingDoc.mimeType?.includes('pdf') ? (
                <iframe src={viewingDoc.presignedUrl} className="w-full h-[70vh] rounded" title="documento" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewingDoc.presignedUrl} alt="documento" className="max-w-full max-h-[70vh] object-contain rounded" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
