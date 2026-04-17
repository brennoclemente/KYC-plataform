'use client';

import { useState } from 'react';

interface KYBFormProps {
  onSuccess: (companyId: string) => void;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function isValidCNPJ(value: string): boolean {
  const formatted = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value);
  const raw = /^\d{14}$/.test(value.replace(/\D/g, ''));
  return formatted || raw;
}

export default function KYBForm({ onSuccess }: KYBFormProps) {
  const [cnpj, setCnpj] = useState('');
  const [cnpjError, setCnpjError] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [faturamento, setFaturamento] = useState('');
  const [contratoSocial, setContratoSocial] = useState<File | null>(null);
  const [cartaoCnpj, setCartaoCnpj] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);
    if (formatted && !isValidCNPJ(formatted)) {
      setCnpjError('CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-XX');
    } else {
      setCnpjError('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidCNPJ(cnpj)) {
      setCnpjError('CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-XX');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('cnpj', cnpj);
      formData.append('razaoSocial', razaoSocial);
      formData.append('nomeFantasia', nomeFantasia);
      formData.append('logradouro', logradouro);
      formData.append('numero', numero);
      formData.append('complemento', complemento);
      formData.append('bairro', bairro);
      formData.append('cidade', cidade);
      formData.append('estado', estado);
      formData.append('cep', cep);
      formData.append('faturamentoMensalEstimado', faturamento);
      if (contratoSocial) formData.append('contratoSocial', contratoSocial);
      if (cartaoCnpj) formData.append('cartaoCnpj', cartaoCnpj);

      const res = await fetch('/api/kyb/submit', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.companyId);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Erro ao enviar os dados. Tente novamente.');
      }
    } catch {
      setError('Erro ao enviar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-secondary/30 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'block text-sm font-medium text-text mb-1';
  const acceptDocs = '.pdf,.jpg,.jpeg,.png';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* CNPJ */}
      <div>
        <label htmlFor="cnpj" className={labelClass}>CNPJ *</label>
        <input
          id="cnpj"
          type="text"
          required
          value={cnpj}
          onChange={handleCnpjChange}
          placeholder="XX.XXX.XXX/XXXX-XX"
          className={`${inputClass} ${cnpjError ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {cnpjError && (
          <p className="mt-1 text-sm text-red-600">{cnpjError}</p>
        )}
      </div>

      {/* Razão Social */}
      <div>
        <label htmlFor="razaoSocial" className={labelClass}>Razão Social *</label>
        <input
          id="razaoSocial"
          type="text"
          required
          value={razaoSocial}
          onChange={(e) => setRazaoSocial(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Nome Fantasia */}
      <div>
        <label htmlFor="nomeFantasia" className={labelClass}>Nome Fantasia *</label>
        <input
          id="nomeFantasia"
          type="text"
          required
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Endereço */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label htmlFor="logradouro" className={labelClass}>Logradouro *</label>
          <input
            id="logradouro"
            type="text"
            required
            value={logradouro}
            onChange={(e) => setLogradouro(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="numero" className={labelClass}>Número *</label>
          <input
            id="numero"
            type="text"
            required
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="complemento" className={labelClass}>Complemento</label>
        <input
          id="complemento"
          type="text"
          value={complemento}
          onChange={(e) => setComplemento(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="bairro" className={labelClass}>Bairro *</label>
          <input
            id="bairro"
            type="text"
            required
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cidade" className={labelClass}>Cidade *</label>
          <input
            id="cidade"
            type="text"
            required
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="estado" className={labelClass}>Estado *</label>
          <input
            id="estado"
            type="text"
            required
            maxLength={2}
            value={estado}
            onChange={(e) => setEstado(e.target.value.toUpperCase())}
            placeholder="SP"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cep" className={labelClass}>CEP *</label>
          <input
            id="cep"
            type="text"
            required
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Faturamento */}
      <div>
        <label htmlFor="faturamento" className={labelClass}>Faturamento Mensal Estimado (R$) *</label>
        <input
          id="faturamento"
          type="number"
          required
          min={0}
          value={faturamento}
          onChange={(e) => setFaturamento(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Documentos */}
      <div>
        <label htmlFor="contratoSocial" className={labelClass}>Contrato Social *</label>
        <input
          id="contratoSocial"
          type="file"
          required
          accept={acceptDocs}
          onChange={(e) => setContratoSocial(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-text file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:opacity-90 cursor-pointer"
        />
      </div>

      <div>
        <label htmlFor="cartaoCnpj" className={labelClass}>Cartão CNPJ *</label>
        <input
          id="cartaoCnpj"
          type="file"
          required
          accept={acceptDocs}
          onChange={(e) => setCartaoCnpj(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-text file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:opacity-90 cursor-pointer"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !!cnpjError}
        className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
