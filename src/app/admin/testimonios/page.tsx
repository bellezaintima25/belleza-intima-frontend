'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import type { Testimonial, TestimonialInput } from '@/lib/adminApi';
import { imageSrc } from '@/lib/api';

interface Draft {
  id: number | null;
  customer_name: string;
  text: string;
  rating: number;
  photo_url: string;
  active: boolean;
}

const EMPTY: Draft = { id: null, customer_name: '', text: '', rating: 5, photo_url: '', active: true };

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={onChange ? () => onChange(n) : undefined}
          className={`text-lg ${onChange ? 'cursor-pointer' : 'cursor-default'} ${n <= value ? 'text-amber-400' : 'text-gray-300'}`}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminApi.testimonials.list());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudieron cargar los testimonios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setErr(null); setMsg(null); setDraft({ ...EMPTY }); };
  const startEdit = (t: Testimonial) => {
    setErr(null); setMsg(null);
    setDraft({
      id: t.id,
      customer_name: t.customer_name,
      text: t.text,
      rating: t.rating,
      photo_url: t.photo_url ?? '',
      active: t.active,
    });
  };
  const cancel = () => setDraft(null);
  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const uploadPhoto = async (file: File) => {
    setErr(null); setSaving(true);
    try {
      const { url } = await adminApi.testimonials.uploadPhoto(file);
      patch({ photo_url: url });
      setMsg('Foto subida. Recuerda guardar.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo subir la foto.');
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    setErr(null); setMsg(null);
    if (!draft.customer_name.trim()) { setErr('Escribe el nombre de la clienta.'); return; }
    if (!draft.text.trim()) { setErr('Escribe el testimonio.'); return; }
    const payload: TestimonialInput = {
      customer_name: draft.customer_name.trim(),
      text: draft.text.trim(),
      rating: draft.rating,
      photo_url: draft.photo_url.trim() || null,
      active: draft.active,
    };
    setSaving(true);
    try {
      if (draft.id == null) {
        await adminApi.testimonials.create(payload);
        setMsg('Testimonio creado.');
      } else {
        await adminApi.testimonials.update(draft.id, payload);
        setMsg('Testimonio actualizado.');
      }
      await load();
      setDraft(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: Testimonial) => {
    if (!confirm(`¿Eliminar el testimonio de "${t.customer_name}"?`)) return;
    setBusyId(t.id); setErr(null); setMsg(null);
    try {
      await adminApi.testimonials.delete(t.id);
      setItems((list) => list.filter((x) => x.id !== t.id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo eliminar.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (t: Testimonial) => {
    setBusyId(t.id); setErr(null); setMsg(null);
    setItems((list) => list.map((x) => (x.id === t.id ? { ...x, active: !t.active } : x)));
    try {
      const updated = await adminApi.testimonials.update(t.id, { active: !t.active });
      setItems((list) => list.map((x) => (x.id === t.id ? updated : x)));
    } catch {
      setItems((list) => list.map((x) => (x.id === t.id ? t : x)));
      setErr('No se pudo cambiar el estado.');
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setItems(reordered);
    try {
      setItems(await adminApi.testimonials.reorder(reordered.map((t) => t.id)));
    } catch {
      await load();
    }
  };

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300';

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Testimonios</h1>
          <p className="text-gray-400 text-sm mt-1">
            Opiniones de tus clientas para la sección “Momentos Belleza Íntima” del inicio.
          </p>
        </div>
        {!draft && (
          <button onClick={startNew} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            + Nuevo testimonio
          </button>
        )}
      </div>

      {msg && <p className="mb-3 text-sm text-emerald-600">{msg}</p>}
      {err && <p className="mb-3 text-sm text-rose-600">{err}</p>}

      {/* Editor */}
      {draft && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{draft.id == null ? 'Nuevo testimonio' : 'Editar testimonio'}</h2>
            <button onClick={cancel} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {/* Foto */}
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-primary-50 flex-shrink-0 flex items-center justify-center">
                {draft.photo_url ? (
                  <Image src={imageSrc(draft.photo_url)} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="text-xl text-primary-300 font-serif">
                    {draft.customer_name.trim().charAt(0).toUpperCase() || '✿'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input ref={photoInput} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ''; }} />
                <button onClick={() => photoInput.current?.click()} disabled={saving}
                  className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
                  Subir foto
                </button>
                {draft.photo_url && (
                  <button onClick={() => patch({ photo_url: '' })} className="text-xs text-rose-500">Quitar</button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 -mt-2">La foto es opcional. Sin foto se muestra la inicial del nombre.</p>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre de la clienta</label>
              <input className={inputCls} value={draft.customer_name} placeholder="Ej. María G."
                onChange={(e) => patch({ customer_name: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Testimonio</label>
              <textarea className={`${inputCls} resize-none`} rows={3} value={draft.text}
                placeholder="Ej. Me encantó la calidad y el detalle. ¡Volveré a comprar!"
                onChange={(e) => patch({ text: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Calificación</label>
              <Stars value={draft.rating} onChange={(v) => patch({ rating: v })} />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={draft.active} onChange={(e) => patch({ active: e.target.checked })} />
              Visible en la tienda
            </label>

            <div className="flex items-center gap-2 pt-1">
              <button onClick={save} disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60">
                {saving ? 'Guardando…' : (draft.id == null ? 'Crear' : 'Guardar cambios')}
              </button>
              <button onClick={cancel} className="text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-500 font-medium">Aún no hay testimonios.</p>
          <p className="text-gray-400 text-sm mt-1">Crea el primero con “+ Nuevo testimonio”.</p>
        </div>
      ) : (
        <ul className="space-y-3 max-w-3xl">
          {items.map((t, idx) => (
            <li key={t.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 ${t.active ? 'border-gray-100' : 'border-gray-200 opacity-70'}`}>
              {/* Avatar */}
              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-primary-50 flex-shrink-0 flex items-center justify-center">
                {t.photo_url ? (
                  <Image src={imageSrc(t.photo_url)} alt={t.customer_name} fill sizes="48px" className="object-cover" />
                ) : (
                  <span className="text-lg text-primary-300 font-serif">{t.customer_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800">{t.customer_name}</span>
                  <Stars value={t.rating} />
                  {!t.active && <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Oculto</span>}
                </div>
                <p className="text-sm text-gray-600 mt-1">{t.text}</p>
              </div>
              {/* Acciones */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} className="h-7 w-7 rounded border border-gray-200 text-gray-500 disabled:opacity-30" title="Subir">↑</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="h-7 w-7 rounded border border-gray-200 text-gray-500 disabled:opacity-30" title="Bajar">↓</button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => startEdit(t)} className="text-xs font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg">Editar</button>
                  <button onClick={() => toggleActive(t)} disabled={busyId === t.id}
                    className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50">
                    {busyId === t.id ? '…' : (t.active ? 'Ocultar' : 'Mostrar')}
                  </button>
                  <button onClick={() => remove(t)} disabled={busyId === t.id}
                    className="text-xs font-semibold text-rose-500 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg disabled:opacity-50">Eliminar</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
