'use client';

import { useEffect, useState } from 'react';

interface ThemeForm {
  appName: string;
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorText: string;
  logoUrl: string;
  faviconUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
}

const DEFAULTS: ThemeForm = {
  appName: 'KYC/KYB Platform',
  colorPrimary: '#3B82F6',
  colorSecondary: '#6B7280',
  colorBackground: '#F9FAFB',
  colorText: '#111827',
  logoUrl: '',
  faviconUrl: '',
  heroTitle: 'Verificação de identidade simples e segura',
  heroSubtitle: 'Complete seu cadastro em minutos com total segurança e conformidade regulatória.',
  heroCtaText: 'Iniciar cadastro',
};

function ColorInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
        </div>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="input flex-1 font-mono text-sm" placeholder="#000000" />
      </div>
      {hint && <p className="mt-1 text-xs text-secondary">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<ThemeForm>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/theme')
      .then((r) => r.json())
      .then((data) => {
        setForm({
          appName: data.appName ?? DEFAULTS.appName,
          colorPrimary: data.colorPrimary ?? DEFAULTS.colorPrimary,
          colorSecondary: data.colorSecondary ?? DEFAULTS.colorSecondary,
          colorBackground: data.colorBackground ?? DEFAULTS.colorBackground,
          colorText: data.colorText ?? DEFAULTS.colorText,
          logoUrl: data.logoUrl ?? '',
          faviconUrl: data.faviconUrl ?? '',
          heroTitle: data.heroTitle ?? DEFAULTS.heroTitle,
          heroSubtitle: data.heroSubtitle ?? DEFAULTS.heroSubtitle,
          heroCtaText: data.heroCtaText ?? DEFAULTS.heroCtaText,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(key: keyof ThemeForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          logoUrl: form.logoUrl || null,
          faviconUrl: form.faviconUrl || null,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Erro ao salvar configurações.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-secondary text-sm py-8">
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Aparência</h1>
        <p className="mt-1 text-sm text-secondary">Personalize a identidade visual da plataforma</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* ── Identidade ─────────────────────────────────────────────────────── */}
        <section className="card p-6 space-y-5">
          <h2 className="section-title">Identidade da plataforma</h2>

          <div>
            <label htmlFor="appName" className="label">Nome da plataforma</label>
            <input id="appName" type="text" value={form.appName} onChange={(e) => set('appName', e.target.value)}
              className="input" placeholder="Minha Plataforma" />
          </div>

          <div>
            <label htmlFor="logoUrl" className="label">URL do logotipo</label>
            <input id="logoUrl" type="url" value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)}
              className="input" placeholder="https://cdn.exemplo.com/logo.png" />
            <p className="mt-1 text-xs text-secondary">PNG ou SVG com fundo transparente. Altura recomendada: 40px.</p>
            {form.logoUrl && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 inline-flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logoUrl} alt="Preview do logo" className="h-10 w-auto object-contain" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="faviconUrl" className="label">URL do favicon</label>
            <input id="faviconUrl" type="url" value={form.faviconUrl} onChange={(e) => set('faviconUrl', e.target.value)}
              className="input" placeholder="https://cdn.exemplo.com/favicon.ico" />
            <p className="mt-1 text-xs text-secondary">ICO, PNG 32×32 ou SVG. Exibido na aba do navegador.</p>
            {form.faviconUrl && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.faviconUrl} alt="Preview do favicon" className="w-6 h-6 object-contain" />
                <span className="text-xs text-secondary">Preview do favicon</span>
              </div>
            )}
          </div>
        </section>

        {/* ── Cores ──────────────────────────────────────────────────────────── */}
        <section className="card p-6 space-y-5">
          <h2 className="section-title">Paleta de cores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ColorInput label="Cor primária" value={form.colorPrimary} onChange={(v) => set('colorPrimary', v)}
              hint="Botões, links e destaques" />
            <ColorInput label="Cor secundária" value={form.colorSecondary} onChange={(v) => set('colorSecondary', v)}
              hint="Textos auxiliares e ícones" />
            <ColorInput label="Cor de fundo" value={form.colorBackground} onChange={(v) => set('colorBackground', v)}
              hint="Fundo geral das páginas" />
            <ColorInput label="Cor do texto" value={form.colorText} onChange={(v) => set('colorText', v)}
              hint="Texto principal" />
          </div>

          {/* Live preview */}
          <div className="mt-2 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-xs font-medium text-secondary mb-3 uppercase tracking-wide">Preview</p>
            <div className="flex items-center gap-3 flex-wrap">
              <button type="button" style={{ backgroundColor: form.colorPrimary }}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium">
                Botão primário
              </button>
              <span style={{ color: form.colorSecondary }} className="text-sm">Texto secundário</span>
              <span style={{ color: form.colorText }} className="text-sm font-medium">Texto principal</span>
              <div style={{ backgroundColor: form.colorBackground }}
                className="px-3 py-1.5 rounded border border-gray-200 text-xs text-gray-500">
                Fundo
              </div>
            </div>
          </div>
        </section>

        {/* ── Página inicial ─────────────────────────────────────────────────── */}
        <section className="card p-6 space-y-5">
          <h2 className="section-title">Página inicial</h2>
          <p className="text-sm text-secondary -mt-2">Textos exibidos na landing page pública da plataforma</p>

          <div>
            <label htmlFor="heroTitle" className="label">Título principal</label>
            <input id="heroTitle" type="text" value={form.heroTitle} onChange={(e) => set('heroTitle', e.target.value)}
              className="input" placeholder="Verificação de identidade simples e segura" />
          </div>

          <div>
            <label htmlFor="heroSubtitle" className="label">Subtítulo</label>
            <textarea id="heroSubtitle" rows={3} value={form.heroSubtitle} onChange={(e) => set('heroSubtitle', e.target.value)}
              className="input resize-none" placeholder="Descrição da plataforma..." />
          </div>

          <div>
            <label htmlFor="heroCtaText" className="label">Texto do botão de ação</label>
            <input id="heroCtaText" type="text" value={form.heroCtaText} onChange={(e) => set('heroCtaText', e.target.value)}
              className="input" placeholder="Iniciar cadastro" />
          </div>
        </section>

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-primary btn-lg">
            {saving ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Salvando...</>
            ) : 'Salvar configurações'}
          </button>

          {success && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Configurações salvas com sucesso!
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </form>
    </div>
  );
}
