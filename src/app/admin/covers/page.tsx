'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import type { HeroContent, HeroPhrase, HeroButton, HeroVersion } from '@/lib/adminApi';
import { HERO_PALETTE } from '@/lib/heroPalette';
import { categoryLabel } from '@/lib/format';
import HeroCanvas from '@/components/admin/HeroCanvas';

const CATEGORY_KEYS = ['SET', 'CORSET', 'BODY', 'PIJAMA'];

const EMPTY_HERO: HeroContent = {
  phrases: [],
  buttons: [],
  background: { image_url: '', overlay: 0.35 },
  show_logo: true,
  logo_url: '/logo.svg',
};

export default function AdminHomePage() {
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [catalogImages, setCatalogImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [picker, setPicker] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const [hero, setHero] = useState<HeroContent>(EMPTY_HERO);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroMsg, setHeroMsg] = useState<string | null>(null);
  const [heroErr, setHeroErr] = useState<string | null>(null);
  const [history, setHistory] = useState<HeroVersion[]>([]);
  const [historyBusy, setHistoryBusy] = useState<number | null>(null);
  const [versionName, setVersionName] = useState('');
  // Texto en edición de los inputs de tamaño (clave = índice de frase).
  // Permite escribir/borrar libremente; el valor se valida al salir del campo.
  const [sizeDraft, setSizeDraft] = useState<Record<number, string>>({});
  const logoInput = useRef<HTMLInputElement | null>(null);
  const bgInput = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [coverList, products, heroData, historyData] = await Promise.all([
        adminApi.categories.covers(),
        adminApi.products.list(),
        adminApi.site.getHero(),
        adminApi.site.history(),
      ]);
      const map: Record<string, string> = {};
      coverList.forEach((c) => { map[c.category] = c.image_url; });
      setCovers(map);
      const urls = new Set<string>();
      products.forEach((p) => p.images.forEach((img) => urls.add(img.url)));
      setCatalogImages(Array.from(urls));
      setHero(heroData);
      setHistory(historyData);
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = async () => {
    try {
      setHistory(await adminApi.site.history());
    } catch {
      /* no bloquea la UI si falla la recarga del historial */
    }
  };

  useEffect(() => { load(); }, []);

  // ---- Frases ----
  const addPhrase = () =>
    setHero((h) => ({ ...h, phrases: [...h.phrases, { text: '', type: 'paragraph', color: '', align: 'left' }] }));
  const updatePhrase = (i: number, patch: Partial<HeroPhrase>) =>
    setHero((h) => ({ ...h, phrases: h.phrases.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  // Sube/baja el tamaño de la frase i en `delta` px desde el valor actual (rango 8–120).
  const bumpSize = (i: number, delta: number) =>
    setHero((h) => ({
      ...h,
      phrases: h.phrases.map((p, idx) => {
        if (idx !== i) return p;
        const base = p.font_size ?? (p.type === 'title' ? 32 : 14);
        return { ...p, font_size: Math.max(8, Math.min(120, base + delta)) };
      }),
    }));
  const removePhrase = (i: number) =>
    setHero((h) => ({ ...h, phrases: h.phrases.filter((_, idx) => idx !== i) }));
  const movePhrase = (i: number, dir: -1 | 1) =>
    setHero((h) => {
      const arr = [...h.phrases];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return h;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...h, phrases: arr };
    });

  // ---- Botones ----
  const addButton = () =>
    setHero((h) => ({ ...h, buttons: [...h.buttons, { label: '', href: '/catalogo', variant: 'primary' }] }));
  const updateButton = (i: number, patch: Partial<HeroButton>) =>
    setHero((h) => ({ ...h, buttons: h.buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) }));
  const removeButton = (i: number) =>
    setHero((h) => ({ ...h, buttons: h.buttons.filter((_, idx) => idx !== i) }));

  const saveHero = async () => {
    setHeroErr(null);
    setHeroMsg(null);
    if (!hero.phrases.some((p) => p.text.trim())) {
      setHeroErr('Agrega al menos una frase con texto.');
      return;
    }
    setHeroSaving(true);
    try {
      const updated = await adminApi.site.updateHero(hero, versionName.trim() || undefined);
      setHero(updated);
      await refreshHistory();
      setVersionName('');
      setHeroMsg('Versión nueva creada y puesta en uso.');
    } catch (e) {
      setHeroErr(e instanceof Error ? e.message : 'No se pudieron guardar los cambios.');
    } finally {
      setHeroSaving(false);
    }
  };

  // ---- Historial de versiones ----
  const restoreVersion = async (v: HeroVersion) => {
    const label = v.name?.trim() || versionSummary(v.content);
    if (!confirm(`¿Usar la versión "${label}"? Se aplicará de inmediato en la página de inicio.`)) return;
    setHeroErr(null);
    setHeroMsg(null);
    setHistoryBusy(v.id);
    try {
      const applied = await adminApi.site.restoreVersion(v.id);
      setHero(applied);
      await refreshHistory();
      setHeroMsg(`Ahora está en uso: "${label}".`);
    } catch (e) {
      setHeroErr(e instanceof Error ? e.message : 'No se pudo usar la versión.');
    } finally {
      setHistoryBusy(null);
    }
  };

  const deleteVersion = async (versionId: number) => {
    if (!confirm('¿Eliminar esta versión del historial? Esta acción no se puede deshacer.')) return;
    setHeroErr(null);
    setHeroMsg(null);
    setHistoryBusy(versionId);
    try {
      await adminApi.site.deleteVersion(versionId);
      await refreshHistory();
      setHeroMsg('Versión eliminada del historial.');
    } catch (e) {
      setHeroErr(e instanceof Error ? e.message : 'No se pudo eliminar la versión.');
    } finally {
      setHistoryBusy(null);
    }
  };

  const renameVersion = async (v: HeroVersion) => {
    const current = v.name?.trim() || '';
    const next = prompt('Nuevo nombre para la versión:', current);
    if (next === null) return; // cancelado
    setHeroErr(null);
    setHeroMsg(null);
    setHistoryBusy(v.id);
    try {
      await adminApi.site.renameVersion(v.id, next.trim());
      await refreshHistory();
      setHeroMsg('Nombre actualizado.');
    } catch (e) {
      setHeroErr(e instanceof Error ? e.message : 'No se pudo renombrar la versión.');
    } finally {
      setHistoryBusy(null);
    }
  };

  const duplicateVersion = async (v: HeroVersion) => {
    setHeroErr(null);
    setHeroMsg(null);
    setHistoryBusy(v.id);
    try {
      await adminApi.site.duplicateVersion(v.id);
      await refreshHistory();
      setHeroMsg('Versión duplicada. La copia quedó en el historial (no en uso).');
    } catch (e) {
      setHeroErr(e instanceof Error ? e.message : 'No se pudo duplicar la versión.');
    } finally {
      setHistoryBusy(null);
    }
  };

  const pinVersion = async (v: HeroVersion) => {
    const label = v.name?.trim() || versionSummary(v.content);
    if (!confirm(`¿Fijar "${label}" como versión principal? Reemplazará a la principal actual.`)) return;
    setHeroErr(null);
    setHeroMsg(null);
    setHistoryBusy(v.id);
    try {
      await adminApi.site.pinVersion(v.id);
      await refreshHistory();
      setHeroMsg(`"${label}" ahora es la versión principal.`);
    } catch (e) {
      setHeroErr(e instanceof Error ? e.message : 'No se pudo fijar la versión principal.');
    } finally {
      setHistoryBusy(null);
    }
  };

  const uploadImage = async (file: File, target: 'logo' | 'bg') => {
    setHeroErr(null);
    setHeroSaving(true);
    try {
      const uploaded = await adminApi.site.uploadLogo(file);
      if (target === 'logo') setHero((h) => ({ ...h, logo_url: uploaded.url }));
      else setHero((h) => ({ ...h, background: { ...h.background, image_url: uploaded.url } }));
      setHeroMsg('Imagen subida. Recuerda guardar los cambios.');
    } catch (e) {
      setHeroErr(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setHeroSaving(false);
    }
  };

  // ---- Portadas ----
  const setCover = async (category: string, imageUrl: string) => {
    setSaving(category);
    const prev = covers[category];
    setCovers((c) => ({ ...c, [category]: imageUrl }));
    try {
      await adminApi.categories.setCover(category, imageUrl);
      setPicker(null);
    } catch {
      setCovers((c) => ({ ...c, [category]: prev }));
      alert('No se pudo guardar la portada. Intenta de nuevo.');
    } finally {
      setSaving(null);
    }
  };
  const handleUpload = async (category: string, file: File) => {
    setSaving(category);
    try {
      const uploaded = await adminApi.categories.uploadCover(file);
      await adminApi.categories.setCover(category, uploaded.url);
      setCovers((c) => ({ ...c, [category]: uploaded.url }));
      setCatalogImages((imgs) => (imgs.includes(uploaded.url) ? imgs : [uploaded.url, ...imgs]));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setSaving(null);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300';

  // Resumen corto del contenido de una versión (primer título/frase).
  const versionSummary = (c: HeroContent) => {
    const title = c.phrases.find((p) => p.type === 'title' && p.text.trim());
    const any = c.phrases.find((p) => p.text.trim());
    const text = (title ?? any)?.text?.trim();
    return text ? (text.length > 60 ? text.slice(0, 60) + '…' : text) : 'Sin texto';
  };

  // Fecha de creación legible.
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  // Selector de color reutilizable (paleta + custom).
  const ColorPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {HERO_PALETTE.map((opt) => (
        <button
          key={opt.token}
          type="button"
          onClick={() => onChange(opt.token)}
          title={opt.label}
          className={`h-6 w-6 rounded-full border-2 ${value === opt.token ? 'border-gray-800' : 'border-white shadow'}`}
          style={{ backgroundColor: opt.css }}
        />
      ))}
      {/* Color personalizado */}
      <input
        type="color"
        value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#8B1A3A'}
        onChange={(e) => onChange(e.target.value)}
        title="Color personalizado"
        className="h-6 w-6 rounded cursor-pointer border border-gray-200 bg-white p-0"
      />
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Página de inicio</h1>
        <p className="text-gray-400 text-sm mt-1">
          Personaliza el cuerpo principal (frases, botones, fondo y logo) y las portadas de categoría.
          Ideal para adaptar la tienda a temporadas o campañas.
        </p>
      </div>

      {/* ===================== Hero ===================== */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Cuerpo principal (hero)</h2>
        {loading ? (
          <div className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* -------- Editor -------- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
              {/* Frases */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Frases</p>
                  <button onClick={addPhrase} className="text-xs font-semibold text-primary-600 hover:text-primary-700">+ Agregar frase</button>
                </div>
                <div className="space-y-3">
                  {hero.phrases.map((p, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          className={inputCls}
                          value={p.text}
                          placeholder="Texto de la frase"
                          onChange={(e) => updatePhrase(i, { text: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={p.type}
                          onChange={(e) => updatePhrase(i, { type: e.target.value as HeroPhrase['type'] })}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                        >
                          <option value="title">Título</option>
                          <option value="paragraph">Párrafo</option>
                        </select>
                        <ColorPicker value={p.color} onChange={(v) => updatePhrase(i, { color: v })} />
                        {/* Alineación del texto */}
                        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5">
                          {([
                            { v: 'left', label: '⬅', title: 'Izquierda' },
                            { v: 'center', label: '⬌', title: 'Centrar' },
                            { v: 'right', label: '➡', title: 'Derecha' },
                          ] as const).map((opt) => (
                            <button
                              key={opt.v}
                              type="button"
                              title={opt.title}
                              onClick={() => updatePhrase(i, { align: opt.v })}
                              className={`h-6 w-6 rounded text-xs ${
                                (p.align ?? 'left') === opt.v ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {/* Tamaño del texto (px) */}
                        <label className="flex items-center gap-1 text-xs text-gray-500" title="Tamaño del texto en píxeles">
                          <span>Tamaño</span>
                          <button
                            type="button"
                            title="Reducir"
                            onClick={() => { setSizeDraft((d) => { const n = { ...d }; delete n[i]; return n; }); bumpSize(i, -1); }}
                            className="h-6 w-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                          >
                            −
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={sizeDraft[i] ?? String(p.font_size ?? (p.type === 'title' ? 32 : 14))}
                            onChange={(e) => {
                              // Deja escribir/borrar libremente: solo dígitos (o vacío).
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              setSizeDraft((d) => ({ ...d, [i]: raw }));
                              // Previsualiza en vivo si ya hay un número (sin forzar el rango aquí).
                              if (raw !== '') updatePhrase(i, { font_size: Number(raw) });
                            }}
                            onBlur={() => {
                              // Al salir: validar el rango y aplicar; limpiar el borrador.
                              const raw = sizeDraft[i];
                              setSizeDraft((d) => { const n = { ...d }; delete n[i]; return n; });
                              if (raw === undefined) return;        // no se tocó
                              if (raw === '') { updatePhrase(i, { font_size: null }); return; } // vacío = por defecto
                              updatePhrase(i, { font_size: Math.max(8, Math.min(120, Number(raw))) });
                            }}
                            className="w-14 text-center rounded-lg border border-gray-200 px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            title="Aumentar"
                            onClick={() => { setSizeDraft((d) => { const n = { ...d }; delete n[i]; return n; }); bumpSize(i, 1); }}
                            className="h-6 w-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                          >
                            +
                          </button>
                          <span>px</span>
                        </label>
                        <div className="ml-auto flex items-center gap-1">
                          <button onClick={() => movePhrase(i, -1)} disabled={i === 0} className="h-6 w-6 rounded border border-gray-200 text-gray-500 disabled:opacity-30" title="Subir">↑</button>
                          <button onClick={() => movePhrase(i, 1)} disabled={i === hero.phrases.length - 1} className="h-6 w-6 rounded border border-gray-200 text-gray-500 disabled:opacity-30" title="Bajar">↓</button>
                          <button onClick={() => removePhrase(i)} className="h-6 px-2 rounded border border-rose-200 text-rose-500 text-xs" title="Eliminar frase">Quitar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hero.phrases.length === 0 && (
                    <p className="text-xs text-gray-400">No hay frases. Agrega al menos una.</p>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Botones</p>
                  <button onClick={addButton} className="text-xs font-semibold text-primary-600 hover:text-primary-700">+ Agregar botón</button>
                </div>
                <div className="space-y-3">
                  {hero.buttons.map((b, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 p-3 flex flex-wrap items-center gap-2">
                      <input
                        className="flex-1 min-w-[120px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                        value={b.label}
                        placeholder="Texto del botón"
                        onChange={(e) => updateButton(i, { label: e.target.value })}
                      />
                      <input
                        className="flex-1 min-w-[120px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                        value={b.href}
                        placeholder="/catalogo"
                        onChange={(e) => updateButton(i, { href: e.target.value })}
                      />
                      <select
                        value={b.variant}
                        onChange={(e) => updateButton(i, { variant: e.target.value as HeroButton['variant'] })}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                      >
                        <option value="primary">Principal</option>
                        <option value="secondary">Secundario</option>
                      </select>
                      <button onClick={() => removeButton(i)} className="h-8 px-2 rounded border border-rose-200 text-rose-500 text-xs" title="Eliminar botón">Quitar</button>
                    </div>
                  ))}
                  {hero.buttons.length === 0 && (
                    <p className="text-xs text-gray-400">Sin botones.</p>
                  )}
                </div>
              </div>

              {/* Imagen de fondo */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Imagen de fondo</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <input ref={bgInput} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'bg'); e.target.value=''; }} />
                  <button onClick={() => bgInput.current?.click()} disabled={heroSaving}
                    className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
                    Subir fondo
                  </button>
                  <input className="flex-1 min-w-[160px] rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500"
                    value={hero.background.image_url}
                    placeholder="URL de la imagen o vacío"
                    onChange={(e) => setHero((h) => ({ ...h, background: { ...h.background, image_url: e.target.value } }))} />
                  {hero.background.image_url && (
                    <button onClick={() => setHero((h) => ({ ...h, background: { ...h.background, image_url: '' } }))}
                      className="text-xs text-rose-500">Quitar fondo</button>
                  )}
                </div>
                {hero.background.image_url && (
                  <label className="block text-xs text-gray-500 mt-2">
                    Oscurecido ({Math.round(hero.background.overlay * 100)}%)
                    <input type="range" min={0} max={1} step={0.05} value={hero.background.overlay}
                      onChange={(e) => setHero((h) => ({ ...h, background: { ...h.background, overlay: Number(e.target.value) } }))}
                      className="w-full" />
                  </label>
                )}
              </div>

              {/* Logo */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-semibold text-gray-700">Logo</p>
                  <label className="ml-auto flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={hero.show_logo}
                      onChange={(e) => setHero((h) => ({ ...h, show_logo: e.target.checked }))} />
                    Mostrar logo
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-primary-50 flex-shrink-0">
                    {hero.logo_url ? <Image src={hero.logo_url} alt="Logo" fill sizes="56px" className="object-contain" /> : null}
                  </div>
                  <input ref={logoInput} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'logo'); e.target.value=''; }} />
                  <button onClick={() => logoInput.current?.click()} disabled={heroSaving}
                    className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
                    Subir logo
                  </button>
                  <input className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500"
                    value={hero.logo_url}
                    onChange={(e) => setHero((h) => ({ ...h, logo_url: e.target.value }))} placeholder="/logo.svg o URL" />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="flex-1 min-w-[160px] rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
                    value={versionName}
                    placeholder="Nombre de la versión (ej. Campaña San Valentín)"
                    onChange={(e) => setVersionName(e.target.value)}
                  />
                  <button onClick={saveHero} disabled={heroSaving}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60">
                    {heroSaving ? 'Guardando…' : 'Guardar como nueva versión'}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Esto crea una nueva versión con el contenido de arriba y la pone en uso. Para cambiar a una
                  versión ya existente, usa “Usar esta” en el historial (no hace falta guardar).
                </p>
                {heroMsg && <span className="text-xs text-emerald-600">{heroMsg}</span>}
                {heroErr && <span className="text-xs text-rose-600">{heroErr}</span>}
              </div>
            </div>

            {/* -------- Vista previa / editor visual -------- */}
            <div>
              <HeroCanvas hero={hero} onChange={setHero} />
            </div>
          </div>
        )}

        {/* -------- Versión principal (fijada) + base de versiones -------- */}
        {!loading && (() => {
          const pinned = history.find((v) => v.is_pinned) || null;
          const rest = history.filter((v) => !v.is_pinned);
          return (
            <div className="mt-6 space-y-4">
              {/* Versión principal fijada */}
              {pinned && (
                <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded-full">
                      ★ Versión principal
                    </span>
                    {pinned.is_current && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        · En uso
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[140px]">
                      <span className="text-sm font-semibold text-gray-800">
                        {pinned.name?.trim() || versionSummary(pinned.content)}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Siempre disponible · no se puede eliminar · Creada el {fmtDate(pinned.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
                      <button
                        onClick={() => restoreVersion(pinned)}
                        disabled={pinned.is_current || historyBusy === pinned.id}
                        className="text-xs font-semibold text-amber-800 border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg disabled:opacity-50"
                      >
                        {pinned.is_current ? 'En uso' : (historyBusy === pinned.id ? '…' : 'Usar la versión inicial')}
                      </button>
                      <button
                        onClick={() => duplicateVersion(pinned)}
                        disabled={historyBusy === pinned.id}
                        className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50"
                      >
                        Duplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Base de versiones */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-700">Versiones guardadas</p>
                  <span className="text-xs text-gray-400">{rest.length} versión(es)</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Tus versiones del cuerpo principal, en orden de creación. Pulsa “Usar esta” para aplicarla al
                  instante (sin guardar). “Fijar como principal” la mueve arriba y la protege de borrado.
                </p>
                {rest.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No hay más versiones. Crea una con “Guardar como nueva versión”.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {rest.map((v, idx) => (
                      <li
                        key={v.id}
                        className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
                          v.is_current ? 'border-emerald-300 bg-emerald-50/60' : 'border-gray-100'
                        }`}
                      >
                        <span className="text-xs font-bold text-gray-300 w-6 text-center">{idx + 1}</span>
                        <div className="flex-1 min-w-[140px]">
                          <span
                            className={`text-sm font-medium ${
                              v.is_current ? 'text-emerald-800 underline decoration-emerald-400 underline-offset-4' : 'text-gray-800'
                            }`}
                          >
                            {v.name?.trim() || versionSummary(v.content)}
                          </span>
                          {v.is_current && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                              · En uso
                            </span>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">Creada el {fmtDate(v.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
                          {!v.is_current && (
                            <button
                              onClick={() => restoreVersion(v)}
                              disabled={historyBusy === v.id}
                              className="text-xs font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg disabled:opacity-50"
                            >
                              {historyBusy === v.id ? '…' : 'Usar esta'}
                            </button>
                          )}
                          <button
                            onClick={() => pinVersion(v)}
                            disabled={historyBusy === v.id}
                            className="text-xs font-semibold text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            Fijar como principal
                          </button>
                          <button
                            onClick={() => renameVersion(v)}
                            disabled={historyBusy === v.id}
                            className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            Renombrar
                          </button>
                          <button
                            onClick={() => duplicateVersion(v)}
                            disabled={historyBusy === v.id}
                            className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            Duplicar
                          </button>
                          <button
                            onClick={() => deleteVersion(v.id)}
                            disabled={v.is_current || historyBusy === v.id}
                            title={v.is_current ? 'No puedes eliminar la versión en uso' : 'Eliminar versión'}
                            className="text-xs font-semibold text-rose-500 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ===================== Portadas de categoría ===================== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Portadas de categoría</h2>
        <p className="text-gray-400 text-sm mb-4">Cambia la foto que aparece en “Explora por categoría”.</p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {CATEGORY_KEYS.map((k) => (<div key={k} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {CATEGORY_KEYS.map((category) => {
              const current = covers[category];
              const isSaving = saving === category;
              return (
                <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="relative aspect-video bg-primary-50">
                    {current ? (
                      <Image src={current} alt={categoryLabel(category)} fill sizes="220px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">Sin portada</span>
                    )}
                    <span className="absolute top-2 left-2 bg-black/50 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {categoryLabel(category)}
                    </span>
                    {isSaving && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs">Guardando…</span>
                    )}
                  </div>
                  <div className="p-2.5 flex gap-1.5">
                    <input ref={(el) => { fileInputs.current[category] = el; }} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(category, f); e.target.value=''; }} />
                    <button onClick={() => fileInputs.current[category]?.click()} disabled={isSaving}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-semibold px-2 py-1.5 rounded-lg">Subir foto</button>
                    <button onClick={() => setPicker(picker === category ? null : category)} disabled={isSaving}
                      className="flex-1 bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold px-2 py-1.5 rounded-lg">
                      {picker === category ? 'Cerrar' : 'Catálogo'}
                    </button>
                  </div>
                  {picker === category && (
                    <div className="px-2.5 pb-2.5">
                      {catalogImages.length === 0 ? (
                        <p className="text-xs text-gray-400">No hay imágenes en el catálogo todavía.</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto">
                          {catalogImages.map((url) => (
                            <button key={url} onClick={() => setCover(category, url)}
                              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${current === url ? 'border-primary-600' : 'border-transparent hover:border-primary-300'}`}
                              title="Usar esta imagen">
                              <Image src={url} alt="" fill sizes="60px" className="object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
