'use client';

import { useState } from 'react';

interface PartnerData {
  nomeCompleto: string;
  cpf: string;
  cpfError: string;
  dataNascimento: string;
  cargo: string;
  rgFrente: File | null;
  rgVerso: File | null;
  cnhFrente: File | null;
  cnhVerso: File | null;
  selfie: File | null;
  comprovanteResidencia: File | null;
}

interface KYCPartnerFormProps {
  companyId: string;
  onSuccess: () => void;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCPF(value: string): boolean {
  const formatted = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value);
  const raw = /^\d{11}$/.test(value.replace(/\D/g, ''));
  return formatted || raw;
}

function emptyPartner(): PartnerData {
  return {
    nomeCompleto: '',
    cpf: '',
    cpfError: '',
    dataNascimento: '',
    cargo: '',
    rgFrente: null,
    rgVerso: null,
    cnhFrente: null,
    cnhVerso: null,
    selfie: null,
    comprovanteResidencia: null,
  };
}

export default function KYCPartnerForm({ companyId, onSuccess }: KYCPartnerFormProps) {
  const [partners, setPartners] = useState<PartnerData[]>([emptyPartner()]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updatePartner(index: number, updates: Partial<PartnerData>) {
    setPartners((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  }

  function handleCpfChange(index: number, value: string) {
    const formatted = formatCPF(value);
    const cpfError =
      formatted && !isValidCPF(formatted)
        ? 'CPF inválido. Use o formato XXX.XXX.XXX-XX'
        : '';
    updatePartner(index, { cpf: formatted, cpfError });
  }

  function addPartner() {
    setPartners((prev) => [...prev, emptyPartner()]);
  }

  function removePartner(index: number) {
    setPartners((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate all CPFs
    for (const p of partners) {
      if (!isValidCPF(p.cpf)) {
        setError('Corrija os erros de CPF antes de enviar.');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      for (let i = 0; i < partners.length; i++) {
        const p = partners[i];
        const isLast = i === partners.length - 1;

        const formData = new FormData();
        formData.append('companyId', companyId);
        formData.append('nomeCompleto', p.nomeCompleto);
        formData.append('cpf', p.cpf);
        formData.append('dataNascimento', p.dataNascimento);
        formData.append('cargo', p.cargo);
        formData.append('isLastPartner', isLast ? 'true' : 'false');
        if (p.rgFrente) formData.append('rgFrente', p.rgFrente);
        if (p.rgVerso) formData.append('rgVerso', p.rgVerso);
        if (p.cnhFrente) formData.append('cnhFrente', p.cnhFrente);
        if (p.cnhVerso) formData.append('cnhVerso', p.cnhVerso);
        if (p.selfie) formData.append('selfie', p.selfie);
        if (p.comprovanteResidencia) formData.append('comprovanteResidencia', p.comprovanteResidencia);

        const res = await fetch('/api/kyc/partner', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? `Erro ao enviar dados do sócio ${i + 1}. Tente novamente.`);
          return;
        }
      }

      onSuccess();
    } catch {
      setError('Erro ao enviar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-secondary/30 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'block text-sm font-medium text-text mb-1';
  const fileClass =
    'w-full text-sm text-text file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:opacity-90 cursor-pointer';
  const acceptDocs = '.pdf,.jpg,.jpeg,.png';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {partners.map((partner, index) => (
        <div
          key={index}
          className="p-5 border border-secondary/20 rounded-lg space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-text">Sócio {index + 1}</h2>
            {index > 0 && (
              <button
                type="button"
                onClick={() => removePartner(index)}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Remover
              </button>
            )}
          </div>

          {/* Nome Completo */}
          <div>
            <label htmlFor={`nomeCompleto-${index}`} className={labelClass}>
              Nome Completo *
            </label>
            <input
              id={`nomeCompleto-${index}`}
              type="text"
              required
              value={partner.nomeCompleto}
              onChange={(e) => updatePartner(index, { nomeCompleto: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* CPF */}
          <div>
            <label htmlFor={`cpf-${index}`} className={labelClass}>
              CPF *
            </label>
            <input
              id={`cpf-${index}`}
              type="text"
              required
              value={partner.cpf}
              onChange={(e) => handleCpfChange(index, e.target.value)}
              placeholder="XXX.XXX.XXX-XX"
              className={`${inputClass} ${partner.cpfError ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {partner.cpfError && (
              <p className="mt-1 text-sm text-red-600">{partner.cpfError}</p>
            )}
          </div>

          {/* Data de Nascimento */}
          <div>
            <label htmlFor={`dataNascimento-${index}`} className={labelClass}>
              Data de Nascimento *
            </label>
            <input
              id={`dataNascimento-${index}`}
              type="date"
              required
              value={partner.dataNascimento}
              onChange={(e) => updatePartner(index, { dataNascimento: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Cargo */}
          <div>
            <label htmlFor={`cargo-${index}`} className={labelClass}>
              Cargo *
            </label>
            <input
              id={`cargo-${index}`}
              type="text"
              required
              value={partner.cargo}
              onChange={(e) => updatePartner(index, { cargo: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Documentos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`rgFrente-${index}`} className={labelClass}>
                RG Frente
              </label>
              <input
                id={`rgFrente-${index}`}
                type="file"
                accept={acceptDocs}
                onChange={(e) => updatePartner(index, { rgFrente: e.target.files?.[0] ?? null })}
                className={fileClass}
              />
            </div>
            <div>
              <label htmlFor={`rgVerso-${index}`} className={labelClass}>
                RG Verso
              </label>
              <input
                id={`rgVerso-${index}`}
                type="file"
                accept={acceptDocs}
                onChange={(e) => updatePartner(index, { rgVerso: e.target.files?.[0] ?? null })}
                className={fileClass}
              />
            </div>
            <div>
              <label htmlFor={`cnhFrente-${index}`} className={labelClass}>
                CNH Frente
              </label>
              <input
                id={`cnhFrente-${index}`}
                type="file"
                accept={acceptDocs}
                onChange={(e) => updatePartner(index, { cnhFrente: e.target.files?.[0] ?? null })}
                className={fileClass}
              />
            </div>
            <div>
              <label htmlFor={`cnhVerso-${index}`} className={labelClass}>
                CNH Verso
              </label>
              <input
                id={`cnhVerso-${index}`}
                type="file"
                accept={acceptDocs}
                onChange={(e) => updatePartner(index, { cnhVerso: e.target.files?.[0] ?? null })}
                className={fileClass}
              />
            </div>
            <div>
              <label htmlFor={`selfie-${index}`} className={labelClass}>
                Selfie
              </label>
              <input
                id={`selfie-${index}`}
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => updatePartner(index, { selfie: e.target.files?.[0] ?? null })}
                className={fileClass}
              />
            </div>
            <div>
              <label htmlFor={`comprovanteResidencia-${index}`} className={labelClass}>
                Comprovante de Residência
              </label>
              <input
                id={`comprovanteResidencia-${index}`}
                type="file"
                accept={acceptDocs}
                onChange={(e) =>
                  updatePartner(index, { comprovanteResidencia: e.target.files?.[0] ?? null })
                }
                className={fileClass}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPartner}
        className="w-full py-2 px-4 border border-primary text-primary font-medium rounded-md hover:bg-primary/5 transition-colors"
      >
        + Adicionar Sócio
      </button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || partners.some((p) => !!p.cpfError)}
        className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
