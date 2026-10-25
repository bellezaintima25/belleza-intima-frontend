'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';

const CATEGORIES = ['SET', 'BODY', 'CORSET', 'PANTY', 'PIJAMA'];

interface ProductFormData {
  code?: string;
  name: string;
  description: string;
  detail: string;
  category: string;
  base_price: number;
  featured: boolean;
  discount_percent: number;
  discount_active: boolean;
}

// The `initial` prop can be any object that carries these fields
// (e.g. an AdminProduct with extra fields like variants/images and nullable description).
interface ProductFormInitial {
  code?: string;
  name?: string;
  description?: string | null;
  detail?: string | null;
  category?: string;
  base_price?: number;
  featured?: boolean;
  discount_percent?: number;
  discount_active?: boolean;
}

interface Props {
  initial?: ProductFormInitial;
  onSubmit: (data: object) => Promise<void>;
  submitLabel?: string;
}

export default function ProductForm({ initial, onSubmit, submitLabel = 'Crear producto' }: Props) {
  const [form, setForm] = useState<ProductFormData>({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    detail: initial?.detail ?? '',
    category: initial?.category ?? 'SET',
    base_price: initial?.base_price ?? 0,
    featured: initial?.featured ?? false,
    discount_percent: initial?.discount_percent ?? 0,
    discount_active: initial?.discount_active ?? false,
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
        discount_percent: Number(form.discount_percent) || 0,
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Frase corta</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={2}
          placeholder="Frase breve que aparece bajo el nombre (ej: Encaje delicado y comodidad total)."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          value={form.detail}
          onChange={(e) => setForm((p) => ({ ...p, detail: e.target.value }))}
          rows={4}
          placeholder="Descripción del producto que aparece debajo del botón de agregar al carrito."
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

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-400"
        />
        <span className="text-sm font-medium text-gray-700">
          Destacado — aparece en “Los productos más amados”
        </span>
      </label>

      {/* Descuento (porcentaje) */}
      <div className="rounded-xl border border-gray-100 p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.discount_active}
            onChange={(e) => setForm((p) => ({ ...p, discount_active: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-400"
          />
          <span className="text-sm font-medium text-gray-700">
            En descuento — aparece en “Especiales”
          </span>
        </label>

        {form.discount_active && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Porcentaje de descuento</label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={form.discount_percent}
                onChange={(e) => setForm((p) => ({ ...p, discount_percent: Number(e.target.value) }))}
                className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>

            {/* Vista previa del precio */}
            {(() => {
              const base = Number(form.base_price) || 0;
              const pct = Math.min(100, Math.max(0, Number(form.discount_percent) || 0));
              const final = Math.round(base * (1 - pct / 100));
              return (
                <p className="text-sm">
                  {pct > 0 ? (
                    <>
                      <span className="text-gray-400 line-through mr-2">{formatPrice(base)}</span>
                      <span className="font-semibold text-primary-700">{formatPrice(final)}</span>
                      <span className="ml-2 text-emerald-600 font-semibold">-{pct}%</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Escribe un porcentaje mayor que 0 para aplicar el descuento.</span>
                  )}
                </p>
              );
            })()}
          </>
        )}
      </div>

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
