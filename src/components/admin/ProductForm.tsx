'use client';

import { useState } from 'react';

const CATEGORIES = ['SET', 'BODY', 'CORSET', 'PANTY', 'PIJAMA'];

interface ProductFormData {
  code?: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
}

interface Props {
  initial?: Partial<ProductFormData>;
  onSubmit: (data: object) => Promise<void>;
  submitLabel?: string;
}

export default function ProductForm({ initial, onSubmit, submitLabel = 'Crear producto' }: Props) {
  const [form, setForm] = useState<ProductFormData>({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    category: initial?.category ?? 'SET',
    base_price: initial?.base_price ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await onSubmit({
        ...form,
        base_price: Number(form.base_price),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof ProductFormData, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string | number}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        {...extra}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {initial?.code === undefined && field('Código', 'code', 'text', { placeholder: 'ej: ST021', required: true })}
      {field('Nombre', 'name', 'text', { required: true })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
        <select
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {field('Precio base', 'base_price', 'number', { min: '0', step: '100', required: true })}

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        {success ? '✓ Guardado' : saving ? 'Guardando...' : submitLabel}
      </button>
    </form>
  );
}
