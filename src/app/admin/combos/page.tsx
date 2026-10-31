'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import type { AdminProduct, Combo, ComboInput, ComboPricingMode, ComboImageOut } from '@/lib/adminApi';
import { formatPrice, categoryLabel } from '@/lib/format';
import { imageSrc, tagBadgeStyle } from '@/lib/api';

/** Línea del editor: producto + cantidad + su propio precio especial. */
interface DraftItem {
  product_id: number;
  quantity: number;
  pricing_mode: ComboPricingMode;   // 'none' | 'fixed' | 'percent'
  special_price: string;            // texto para edición libre (precio unitario)
  discount_percent: string;         // texto para edición libre
}

interface Draft {
  id: number | null; // null = combo nuevo
  name: string;
  description: string;
  image_url: string;
  active: boolean;
  includeProductImages: boolean;
  tag: string;
  tagColor: string;
  items: DraftItem[];
}

const EMPTY_DRAFT: Draft = {
  id: null,
  name: '',
  description: '',
  image_url: '',
  active: true,
  includeProductImages: true,
  tag: '',
  tagColor: '',
  items: [],
};

// Sugerencias rápidas de etiqueta para el admin (un clic las rellena).
const TAG_SUGGESTIONS = ['Combo navideño', 'Halloween', 'San Valentín', 'Edición limitada', 'Más vendido'];

// Colores disponibles para el tag (token legible + valor CSS para la vista previa).
const TAG_COLORS: { value: string; label: string; css: string }[] = [
  { value: 'primary-600', label: 'Vino', css: '#8B1A3A' },
  { value: '#dc2626', label: 'Rojo', css: '#dc2626' },
  { value: '#f97316', label: 'Naranja', css: '#f97316' },
  { value: '#16a34a', label: 'Verde', css: '#16a34a' },
  { value: '#2563eb', label: 'Azul', css: '#2563eb' },
  { value: '#7c3aed', label: 'Morado', css: '#7c3aed' },
  { value: '#db2777', label: 'Rosa', css: '#db2777' },
  { value: '#111827', label: 'Negro', css: '#111827' },
];

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Precio unitario final de un producto según su modo de descuento. */
function unitPrice(base: number, mode: ComboPricingMode, special: string, pct: string): number {
  if (mode === 'fixed') {
    const sp = special.trim() === '' ? base : Number(special) || 0;
    return Math.max(0, sp);
  }
  if (mode === 'percent') {
    const p = Math.min(100, Math.max(0, Number(pct) || 0));
    return Math.max(0, base * (1 - p / 100));
  }
  return base; // none
}

export default function AdminCombosPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState('');
  // Galería de fotos del combo en edición (solo para combos ya guardados).
  const [gallery, setGallery] = useState<ComboImageOut[]>([]);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const galleryInput = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [prod, comboList] = await Promise.all([
        adminApi.products.list(),
        adminApi.combos.list(),
      ]);
      setProducts(prod);
      setCombos(comboList);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const productById = useMemo(() => {
    const map = new Map<number, AdminProduct>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const productImage = (p?: AdminProduct): string | null => {
    if (!p || !p.images || p.images.length === 0) return null;
    return p.images[0].url;
  };

  // ---- Cálculo de precios por producto + totales (refleja el backend) ----
  const calc = useMemo(() => {
    const lines = (draft?.items ?? []).map((it) => {
      const p = productById.get(it.product_id);
      const base = p?.base_price ?? 0;
      const unit = unitPrice(base, it.pricing_mode, it.special_price, it.discount_percent);
      const lineOriginal = round2(base * it.quantity);
      const lineFinal = round2(unit * it.quantity);
      const lineSavings = round2(Math.max(0, lineOriginal - lineFinal));
      return { product_id: it.product_id, unit: round2(unit), lineOriginal, lineFinal, lineSavings };
    });
    const original = round2(lines.reduce((s, l) => s + l.lineOriginal, 0));
    const final = round2(lines.reduce((s, l) => s + l.lineFinal, 0));
    const savings = round2(Math.max(0, original - final));
    const savingsPct = original > 0 ? round2((savings / original) * 100) : 0;
    const byProduct = new Map(lines.map((l) => [l.product_id, l]));
    return { lines, original, final, savings, savingsPct, byProduct };
  }, [draft, productById]);

  // ---- Acciones del editor ----
  const startNew = () => { setErr(null); setMsg(null); setGallery([]); setDraft({ ...EMPTY_DRAFT, items: [] }); };

  const startEdit = (c: Combo) => {
    setErr(null); setMsg(null);
    setGallery([...c.images].sort((a, b) => a.sort_order - b.sort_order));
    setDraft({
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      image_url: c.image_url ?? '',
      active: c.active,
      includeProductImages: c.include_product_images,
      tag: c.tag ?? '',
      tagColor: c.tag_color ?? '',
      items: c.items.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        pricing_mode: it.pricing_mode,
        special_price: it.special_price != null ? String(it.special_price) : '',
        discount_percent: it.discount_percent != null ? String(it.discount_percent) : '',
      })),
    });
  };

  const cancelEdit = () => { setDraft(null); setProductQuery(''); setGallery([]); };

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const patchItem = (productId: number, p: Partial<DraftItem>) =>
    setDraft((d) => d ? { ...d, items: d.items.map((it) => it.product_id === productId ? { ...it, ...p } : it) } : d);

  const addProduct = (productId: number) => {
    setDraft((d) => {
      if (!d) return d;
      const existing = d.items.find((it) => it.product_id === productId);
      if (existing) {
        return { ...d, items: d.items.map((it) => it.product_id === productId ? { ...it, quantity: it.quantity + 1 } : it) };
      }
      return {
        ...d,
        items: [...d.items, { product_id: productId, quantity: 1, pricing_mode: 'none', special_price: '', discount_percent: '' }],
      };
    });
  };

  const setQty = (productId: number, qty: number) =>
    patchItem(productId, { quantity: Math.max(1, qty) });

  const removeItem = (productId: number) =>
    setDraft((d) => d ? { ...d, items: d.items.filter((it) => it.product_id !== productId) } : d);

  // ---- Galería de fotos del combo (solo para combos ya guardados) ----
  const uploadGalleryImages = async (files: FileList) => {
    if (!draft?.id) return;
    setErr(null);
    setGalleryBusy(true);
    try {
      for (const file of Array.from(files)) {
        const img = await adminApi.combos.uploadGalleryImage(draft.id, file);
        setGallery((g) => [...g, img]);
      }
      setMsg('Fotos subidas.');
      // Recarga la lista para reflejar la portada actualizada en las tarjetas.
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudieron subir las fotos.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const deleteGalleryImage = async (imageId: number) => {
    if (!draft?.id) return;
    setGalleryBusy(true);
    setErr(null);
    try {
      await adminApi.combos.deleteImage(draft.id, imageId);
      setGallery((g) => g.filter((im) => im.id !== imageId));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo eliminar la foto.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const moveGalleryImage = async (index: number, dir: -1 | 1) => {
    if (!draft?.id) return;
    const next = index + dir;
    if (next < 0 || next >= gallery.length) return;
    const reordered = [...gallery];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setGallery(reordered);
    setGalleryBusy(true);
    try {
      const updated = await adminApi.combos.reorderImages(draft.id, reordered.map((im) => im.id));
      setGallery([...updated].sort((a, b) => a.sort_order - b.sort_order));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo reordenar.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    setErr(null); setMsg(null);
    if (!draft.name.trim()) { setErr('Ponle un nombre al combo.'); return; }
    if (draft.items.length === 0) { setErr('Agrega al menos un producto al combo.'); return; }
    for (const it of draft.items) {
      const p = productById.get(it.product_id);
      const name = p?.name ?? `Producto ${it.product_id}`;
      if (it.pricing_mode === 'fixed' && it.special_price.trim() === '') {
        setErr(`Escribe el precio de "${name}" o cambia su modo.`); return;
      }
      if (it.pricing_mode === 'percent' && it.discount_percent.trim() === '') {
        setErr(`Escribe el porcentaje de "${name}" o cambia su modo.`); return;
      }
    }

    const payload: ComboInput = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      image_url: draft.image_url.trim() || null,
      active: draft.active,
      include_product_images: draft.includeProductImages,
      tag: draft.tag.trim() || null,
      tag_color: draft.tag.trim() ? (draft.tagColor || 'primary-600') : null,
      items: draft.items.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        pricing_mode: it.pricing_mode,
        special_price: it.pricing_mode === 'fixed' ? Number(it.special_price) : null,
        discount_percent: it.pricing_mode === 'percent' ? Number(it.discount_percent) : null,
      })),
    };

    setSaving(true);
    try {
      if (draft.id == null) {
        await adminApi.combos.create(payload);
        setMsg('Combo creado.');
      } else {
        await adminApi.combos.update(draft.id, payload);
        setMsg('Combo actualizado.');
      }
      await load();
      setDraft(null);
      setProductQuery('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo guardar el combo.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCombo = async (c: Combo) => {
    if (!confirm(`¿Eliminar el combo "${c.name}"? Esta acción no se puede deshacer.`)) return;
    setBusyId(c.id);
    setErr(null); setMsg(null);
    try {
      await adminApi.combos.delete(c.id);
      setCombos((list) => list.filter((x) => x.id !== c.id));
      setMsg('Combo eliminado.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo eliminar el combo.');
    } finally {
      setBusyId(null);
    }
  };

  const moveCombo = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= combos.length) return;
    const reordered = [...combos];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    // Optimista: refleja el nuevo orden de inmediato.
    setCombos(reordered);
    setErr(null); setMsg(null);
    try {
      const updated = await adminApi.combos.reorder(reordered.map((c) => c.id));
      setCombos(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo reordenar.');
      await load(); // revierte al estado real del servidor
    }
  };

  const toggleActive = async (c: Combo) => {
    setBusyId(c.id);
    setErr(null); setMsg(null);
    try {
      const updated = await adminApi.combos.update(c.id, { active: !c.active });
      setCombos((list) => list.map((x) => (x.id === c.id ? updated : x)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
    } finally {
      setBusyId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [products, productQuery]);

  const inputCls =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300';

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Combos</h1>
          <p className="text-gray-400 text-sm mt-1">
            Arma paquetes con varios productos. Cada producto puede tener su propio precio especial o
            porcentaje de descuento; el ahorro por producto y el total del combo se calculan solos.
          </p>
        </div>
        {!draft && (
          <button
            onClick={startNew}
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
          >
            + Nuevo combo
          </button>
        )}
      </div>

      {msg && <p className="mb-3 text-sm text-emerald-600">{msg}</p>}
      {err && <p className="mb-3 text-sm text-rose-600">{err}</p>}

      {/* ===================== Editor ===================== */}
      {draft && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {draft.id == null ? 'Nuevo combo' : 'Editar combo'}
            </h2>
            <button onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ---- Columna izquierda: datos + productos ---- */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del combo</label>
                <input className={inputCls} value={draft.name} placeholder="Ej. Combo San Valentín"
                  onChange={(e) => patch({ name: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción (opcional)</label>
                <textarea className={`${inputCls} resize-none`} rows={2} value={draft.description}
                  placeholder="Describe brevemente el combo"
                  onChange={(e) => patch({ description: e.target.value })} />
              </div>

              {/* Etiqueta destacada (opcional): texto + color */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Etiqueta destacada (opcional)</label>
                <input
                  className={inputCls}
                  value={draft.tag}
                  placeholder="Ej. Combo navideño"
                  maxLength={30}
                  onChange={(e) => patch({ tag: e.target.value })}
                />
                {/* Sugerencias rápidas */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TAG_SUGGESTIONS.map((s) => (
                    <button key={s} type="button"
                      onClick={() => patch({ tag: s, tagColor: draft.tagColor || 'primary-600' })}
                      className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700">
                      {s}
                    </button>
                  ))}
                </div>

                {/* Selector de color + vista previa (solo si hay texto de etiqueta) */}
                {draft.tag.trim() && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-semibold text-gray-500">Color de la etiqueta</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {TAG_COLORS.map((col) => {
                        const active = (draft.tagColor || 'primary-600') === col.value;
                        return (
                          <button key={col.value} type="button" title={col.label}
                            onClick={() => patch({ tagColor: col.value })}
                            className={`h-6 w-6 rounded-full border-2 transition-transform ${active ? 'border-gray-800 scale-110' : 'border-white shadow'}`}
                            style={{ backgroundColor: col.css }} />
                        );
                      })}
                    </div>
                    {/* Vista previa del badge */}
                    <div>
                      <span
                        className="inline-block text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border"
                        style={tagBadgeStyle(draft.tagColor || 'primary-600')}
                      >
                        {draft.tag.trim()}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-2">Así se verá en la tienda</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fotos del combo (galería) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-600">Fotos del combo</label>
                  <span className="text-[11px] text-gray-400">{gallery.length} foto(s) · la 1ª es la portada</span>
                </div>

                {/* Opción: mostrar también las fotos de los productos del combo */}
                <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer rounded-lg bg-primary-50/60 border border-primary-100 px-3 py-2 mb-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={draft.includeProductImages}
                    onChange={(e) => patch({ includeProductImages: e.target.checked })}
                  />
                  <span>
                    <span className="font-semibold">Incluir también las fotos de los productos</span>
                    <span className="block text-gray-400">
                      En la tienda, la galería del combo mostrará las fotos de los productos incluidos
                      {' '}(además de las que subas aquí). Se mantienen al día si cambias las fotos de un producto.
                    </span>
                  </span>
                </label>

                {draft.id == null ? (
                  <p className="text-xs text-gray-400 rounded-lg bg-gray-50 border border-gray-100 p-3">
                    Guarda primero el combo (abajo con “Crear combo”) y luego podrás agregarle varias fotos.
                  </p>
                ) : (
                  <>
                    <input ref={galleryInput} type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => { if (e.target.files && e.target.files.length) uploadGalleryImages(e.target.files); e.target.value = ''; }} />
                    <div className="flex items-center gap-2 mb-2">
                      <button type="button" onClick={() => galleryInput.current?.click()} disabled={galleryBusy}
                        className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
                        {galleryBusy ? 'Subiendo…' : '+ Agregar fotos'}
                      </button>
                      <span className="text-[11px] text-gray-400">Puedes seleccionar varias a la vez.</span>
                    </div>

                    {gallery.length === 0 ? (
                      <p className="text-xs text-gray-400">Aún no hay fotos. Agrega varias para mostrar bien el combo en la tienda.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {gallery.map((im, idx) => (
                          <div key={im.id} className="relative group rounded-lg overflow-hidden border border-gray-100">
                            <div className="relative aspect-square bg-primary-50">
                              <Image src={imageSrc(im.url)} alt="" fill sizes="120px" className="object-cover" />
                            </div>
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                Portada
                              </span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/45 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => moveGalleryImage(idx, -1)} disabled={galleryBusy || idx === 0}
                                title="Mover antes" className="text-white text-xs px-1 disabled:opacity-30">←</button>
                              <button type="button" onClick={() => deleteGalleryImage(im.id)} disabled={galleryBusy}
                                title="Eliminar" className="text-white text-xs px-1">🗑</button>
                              <button type="button" onClick={() => moveGalleryImage(idx, 1)} disabled={galleryBusy || idx === gallery.length - 1}
                                title="Mover después" className="text-white text-xs px-1 disabled:opacity-30">→</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Productos del combo con precio especial individual */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Productos del combo</p>

                {draft.items.length === 0 ? (
                  <p className="text-xs text-gray-400 mb-2">Aún no has agregado productos. Búscalos abajo y añádelos.</p>
                ) : (
                  <ul className="space-y-2 mb-3">
                    {draft.items.map((it) => {
                      const p = productById.get(it.product_id);
                      const img = productImage(p);
                      const line = calc.byProduct.get(it.product_id);
                      return (
                        <li key={it.product_id} className="rounded-xl border border-gray-100 p-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-primary-50 flex-shrink-0">
                              {img ? <Image src={img} alt="" fill sizes="44px" className="object-cover" /> : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{p?.name ?? `Producto ${it.product_id}`}</p>
                              <p className="text-xs text-gray-400">{p ? `${p.code} · ${formatPrice(p.base_price)} c/u` : ''}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setQty(it.product_id, it.quantity - 1)}
                                className="h-7 w-7 rounded border border-gray-200 text-gray-600 hover:bg-gray-100">−</button>
                              <input type="text" inputMode="numeric" value={it.quantity}
                                onChange={(e) => { const n = Number(e.target.value.replace(/[^0-9]/g, '')); setQty(it.product_id, n || 1); }}
                                className="w-10 text-center rounded-lg border border-gray-200 px-1 py-1 text-xs" />
                              <button onClick={() => setQty(it.product_id, it.quantity + 1)}
                                className="h-7 w-7 rounded border border-gray-200 text-gray-600 hover:bg-gray-100">+</button>
                            </div>
                            <button onClick={() => removeItem(it.product_id)} title="Quitar"
                              className="h-7 px-2 rounded border border-rose-200 text-rose-500 text-xs">Quitar</button>
                          </div>

                          {/* Modo de precio por producto */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5">
                              {([
                                { v: 'none', label: 'Sin desc.' },
                                { v: 'fixed', label: 'Precio' },
                                { v: 'percent', label: '%' },
                              ] as const).map((opt) => (
                                <button key={opt.v} type="button"
                                  onClick={() => patchItem(it.product_id, { pricing_mode: opt.v })}
                                  className={`text-xs font-semibold px-2.5 py-1 rounded ${
                                    it.pricing_mode === opt.v ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                  }`}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            {it.pricing_mode === 'fixed' && (
                              <label className="flex items-center gap-1 text-xs text-gray-500">
                                Precio c/u
                                <input type="text" inputMode="decimal" value={it.special_price}
                                  placeholder={p ? String(p.base_price) : '0'}
                                  onChange={(e) => patchItem(it.product_id, { special_price: e.target.value.replace(/[^0-9.]/g, '') })}
                                  className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
                              </label>
                            )}
                            {it.pricing_mode === 'percent' && (
                              <label className="flex items-center gap-1 text-xs text-gray-500">
                                Descuento
                                <input type="text" inputMode="decimal" value={it.discount_percent}
                                  placeholder="0"
                                  onChange={(e) => patchItem(it.product_id, { discount_percent: e.target.value.replace(/[^0-9.]/g, '') })}
                                  className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
                                %
                              </label>
                            )}
                          </div>

                          {/* Resumen de esta línea: original → final + ahorro */}
                          {line && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">
                                {it.quantity} × {formatPrice(line.unit)}
                                {line.lineSavings > 0 && <span className="line-through ml-2">{formatPrice(line.lineOriginal)}</span>}
                              </span>
                              <span className="flex items-center gap-2">
                                {line.lineSavings > 0 && (
                                  <span className="text-emerald-600 font-semibold">ahorra {formatPrice(line.lineSavings)}</span>
                                )}
                                <span className="font-semibold text-gray-700">{formatPrice(line.lineFinal)}</span>
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Selector de productos */}
                <div className="rounded-xl border border-gray-100 p-2">
                  <input className={`${inputCls} mb-2`} value={productQuery} placeholder="Buscar producto por nombre, código o categoría"
                    onChange={(e) => setProductQuery(e.target.value)} />
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {loading ? (
                      <p className="text-xs text-gray-400 p-2">Cargando productos…</p>
                    ) : filteredProducts.length === 0 ? (
                      <p className="text-xs text-gray-400 p-2">No hay productos que coincidan.</p>
                    ) : (
                      filteredProducts.map((p) => {
                        const already = draft.items.some((it) => it.product_id === p.id);
                        const img = productImage(p);
                        return (
                          <button key={p.id} onClick={() => addProduct(p.id)}
                            className="w-full flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-primary-50 text-left">
                            <div className="relative h-9 w-9 rounded-md overflow-hidden bg-primary-50 flex-shrink-0">
                              {img ? <Image src={img} alt="" fill sizes="36px" className="object-cover" /> : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.code} · {formatPrice(p.base_price)}</p>
                            </div>
                            <span className={`text-xs font-semibold ${already ? 'text-emerald-600' : 'text-primary-600'}`}>
                              {already ? '✓ Añadido · +1' : '+ Añadir'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Columna derecha: resumen de precios ---- */}
            <div className="space-y-4">
              <div className="rounded-xl bg-primary-50/60 border border-primary-100 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Resumen del combo</p>

                {calc.lines.length === 0 ? (
                  <p className="text-xs text-gray-400">Agrega productos para ver el precio y el ahorro.</p>
                ) : (
                  <>
                    {/* Ahorro por producto */}
                    <ul className="space-y-1.5 mb-3">
                      {draft.items.map((it) => {
                        const p = productById.get(it.product_id);
                        const line = calc.byProduct.get(it.product_id);
                        if (!line) return null;
                        return (
                          <li key={it.product_id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 truncate pr-2">
                              {it.quantity}× {p?.name ?? `Producto ${it.product_id}`}
                            </span>
                            <span className="flex items-center gap-2 flex-shrink-0">
                              {line.lineSavings > 0 ? (
                                <span className="text-emerald-600 font-semibold">−{formatPrice(line.lineSavings)}</span>
                              ) : (
                                <span className="text-gray-400">sin ahorro</span>
                              )}
                              <span className="text-gray-700 font-medium w-20 text-right">{formatPrice(line.lineFinal)}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Totales */}
                    <div className="border-t border-primary-100 pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Precio original</span>
                        <span className="line-through">{formatPrice(calc.original)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Ahorro total</span>
                        <span className="text-emerald-600 font-semibold">
                          −{formatPrice(calc.savings)} ({calc.savingsPct}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-primary-100">
                        <span className="text-sm font-semibold text-gray-800">Precio del combo</span>
                        <span className="text-xl font-bold text-primary-700">{formatPrice(calc.final)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={draft.active} onChange={(e) => patch({ active: e.target.checked })} />
                Combo activo (visible)
              </label>

              <div className="flex items-center gap-2 pt-2">
                <button onClick={saveDraft} disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60">
                  {saving ? 'Guardando…' : (draft.id == null ? 'Crear combo' : 'Guardar cambios')}
                </button>
                <button onClick={cancelEdit} className="text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Lista de combos ===================== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-44 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : combos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-500 font-medium">Todavía no hay combos.</p>
          <p className="text-gray-400 text-sm mt-1">Crea el primero con “+ Nuevo combo”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {combos.map((c, idx) => (
            <div key={c.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${c.active ? 'border-gray-100' : 'border-gray-200 opacity-70'}`}>
              <div className="relative aspect-video bg-primary-50">
                {c.image_url ? (
                  <Image src={imageSrc(c.image_url)} alt={c.name} fill sizes="320px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">Sin imagen</span>
                )}
                {/* Orden manual */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="bg-black/55 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">#{idx + 1}</span>
                  <button type="button" onClick={() => moveCombo(idx, -1)} disabled={idx === 0}
                    title="Subir" aria-label="Subir"
                    className="h-6 w-6 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-gray-700 text-xs disabled:opacity-30 disabled:cursor-not-allowed">↑</button>
                  <button type="button" onClick={() => moveCombo(idx, 1)} disabled={idx === combos.length - 1}
                    title="Bajar" aria-label="Bajar"
                    className="h-6 w-6 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-gray-700 text-xs disabled:opacity-30 disabled:cursor-not-allowed">↓</button>
                </div>
                <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  c.active ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                }`}>
                  {c.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate">{c.name}</h3>
                {c.description && <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{c.description}</p>}

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary-700">{formatPrice(c.final_price)}</span>
                  {c.savings > 0 && (
                    <>
                      <span className="text-xs text-gray-400 line-through">{formatPrice(c.original_price)}</span>
                      <span className="text-xs font-semibold text-emerald-600">-{c.savings_percent}%</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2">{c.items.length} producto(s)</p>

                {/* Mini lista de productos con su ahorro */}
                <ul className="mt-2 space-y-0.5">
                  {c.items.slice(0, 4).map((it) => (
                    <li key={it.id} className="flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate pr-2">· {it.quantity}× {it.product?.name ?? `Producto ${it.product_id}`}</span>
                      {it.line_savings > 0 && (
                        <span className="text-emerald-600 flex-shrink-0">−{formatPrice(it.line_savings)}</span>
                      )}
                    </li>
                  ))}
                  {c.items.length > 4 && (
                    <li className="text-xs text-gray-400">y {c.items.length - 4} más…</li>
                  )}
                </ul>

                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => startEdit(c)}
                    className="text-xs font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg">
                    Editar
                  </button>
                  <button onClick={() => toggleActive(c)} disabled={busyId === c.id}
                    className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50">
                    {busyId === c.id ? '…' : (c.active ? 'Desactivar' : 'Activar')}
                  </button>
                  <button onClick={() => deleteCombo(c)} disabled={busyId === c.id}
                    className="text-xs font-semibold text-rose-500 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg disabled:opacity-50">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
