'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, UserIcon, CheckIcon, XMarkIcon, InboxIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import type { Testimonial, TestimonialInput, TestimonialStatus } from '@/lib/adminApi';
import { imageSrc } from '@/lib/api';
import { TESTIMONIALS_CHANGED } from '@/components/admin/PendingBadge';

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED';

const TABS: { key: Tab; label: string; empty: string; hint: string }[] = [
  {
    key: 'PENDING',
    label: 'Pendientes',
    empty: 'No hay comentarios por revisar.',
    hint: 'Comentarios enviados por clientas desde la tienda. Nada se publica hasta que lo apruebes.',
  },
  {
    key: 'APPROVED',
    label: 'Publicados',
    empty: 'Aún no hay testimonios publicados.',
    hint: 'Lo que se ve en la sección “Momentos Belleza Íntima” del inicio (se muestran los primeros 6).',
  },
  {
    key: 'REJECTED',
    label: 'Rechazados',
    empty: 'No hay comentarios rechazados.',
    hint: 'No se muestran en la tienda. Puedes publicarlos más tarde si cambias de opinión.',
  },
];

interface Draft {
  id: number | null;
  customer_name: string;
  text: string;
  rating: number;
  photo_url: string;
  active: boolean;
  status: TestimonialStatus;
}

const EMPTY: Draft = { id: null, customer_name: '', text: '', rating: 5, photo_url: '', active: true, status: 'APPROVED' };

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
          <StarIcon className={onChange ? 'h-6 w-6' : 'h-4 w-4'} />
        </button>
      ))}
    </div>
  );
}

const fmtDate = (iso: string) =>
  new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('PENDING');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const firstLoad = useRef(true);

  const notifyChanged = () => window.dispatchEvent(new Event(TESTIMONIALS_CHANGED));

  const load = async () => {
    setLoading(true);
    try {
      const all = await adminApi.testimonials.list();
      setItems(all);
      // Al entrar, si no hay pendientes, abrimos directamente "Publicados".
      if (firstLoad.current) {
        firstLoad.current = false;
        if (!all.some((t) => t.status === 'PENDING')) setTab('APPROVED');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudieron cargar los testimonios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const byStatus = (s: Tab) => items.filter((t) => t.status === s);
  const counts: Record<Tab, number> = {
    PENDING: byStatus('PENDING').length,
    APPROVED: byStatus('APPROVED').length,
    REJECTED: byStatus('REJECTED').length,
  };
  // Publicados: en el orden en que se ven en la tienda. Los demás: más nuevos primero.
  const visible = byStatus(tab).sort((a, b) =>
    tab === 'APPROVED'
      ? a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at)
      : b.created_at.localeCompare(a.created_at),
  );

  const startNew = () => {
    setErr(null); setMsg(null);
    setTab('APPROVED');
    setDraft({ ...EMPTY });
  };
  const startEdit = (t: Testimonial) => {
    setErr(null); setMsg(null);
    setDraft({
      id: t.id,
      customer_name: t.customer_name,
      text: t.text,
      rating: t.rating,
      photo_url: t.photo_url ?? '',
      active: t.active,
      status: t.status,
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
        setMsg('Cambios guardados.');
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
    if (!confirm(`¿Eliminar definitivamente el comentario de "${t.customer_name}"?`)) return;
    setBusyId(t.id); setErr(null); setMsg(null);
    try {
      await adminApi.testimonials.delete(t.id);
      setItems((list) => list.filter((x) => x.id !== t.id));
      notifyChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo eliminar.');
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (t: Testimonial, status: TestimonialStatus) => {
    setBusyId(t.id); setErr(null); setMsg(null);
    try {
      const updated = await adminApi.testimonials.setStatus(t.id, status);
      setItems((list) => list.map((x) => (x.id === t.id ? updated : x)));
      setMsg(
        status === 'APPROVED'
          ? `Publicado: el comentario de ${t.customer_name} ya se ve en la tienda.`
          : status === 'REJECTED'
          ? 'Comentario rechazado. No se mostrará en la tienda.'
          : 'Comentario devuelto a pendientes.',
      );
      notifyChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
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

  // Reordena solo entre los publicados (el orden de la tienda).
  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= visible.length) return;
    const reordered = [...visible];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    const ids = reordered.map((t) => t.id);
    setItems((list) =>
      list.map((x) => (ids.includes(x.id) ? { ...x, sort_order: ids.indexOf(x.id) } : x)),
    );
    try {
      await adminApi.testimonials.reorder(ids);
    } catch {
      await load();
    }
  };

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300';
  const current = TABS.find((x) => x.key === tab)!;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Testimonios</h1>
          <p className="text-gray-400 text-sm mt-1">
            Revisa lo que escriben tus clientas y decide qué se publica en “Momentos Belleza Íntima”.
          </p>
        </div>
        {!draft && (
          <button onClick={startNew} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            + Nuevo testimonio
          </button>
        )}
      </div>

      {msg && <p role="status" className="mb-3 text-sm text-emerald-600">{msg}</p>}
      {err && <p role="alert" className="mb-3 text-sm text-rose-600">{err}</p>}

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
                    {draft.customer_name.trim().charAt(0).toUpperCase() || <UserIcon className="h-6 w-6 text-primary-300" aria-hidden="true" />}
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

            {draft.status === 'APPROVED' ? (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={draft.active} onChange={(e) => patch({ active: e.target.checked })} />
                Visible en la tienda
              </label>
            ) : (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                Este comentario está {draft.status === 'PENDING' ? 'pendiente' : 'rechazado'}. Puedes corregirlo aquí y publicarlo después desde la lista.
              </p>
            )}

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

      {/* Pestañas */}
      <div role="tablist" className="flex gap-1 border-b border-gray-200 mb-2 max-w-3xl">
        {TABS.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={tab === x.key}
            onClick={() => setTab(x.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === x.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {x.label}
            <span
              className={`min-w-[1.25rem] px-1.5 rounded-full text-[11px] font-bold nums ${
                x.key === 'PENDING' && counts.PENDING > 0 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {counts[x.key]}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-4 max-w-3xl">{current.hint}</p>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3 max-w-3xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center max-w-3xl">
          <InboxIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
          <p className="text-gray-500 font-medium">{current.empty}</p>
        </div>
      ) : (
        <ul className="space-y-3 max-w-3xl">
          {visible.map((t, idx) => (
            <li
              key={t.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 ${
                t.status === 'PENDING' ? 'border-primary-200 ring-1 ring-primary-100' : t.active ? 'border-gray-100' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
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
                    {t.from_customer && (
                      <span className="text-[10px] font-bold uppercase bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">Enviado por clienta</span>
                    )}
                    {t.status === 'APPROVED' && !t.active && (
                      <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Oculto</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-line break-words">{t.text}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{fmtDate(t.created_at)}</p>
                </div>
                {tab === 'APPROVED' && (
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} className="h-7 w-7 rounded border border-gray-200 text-gray-500 disabled:opacity-30 flex items-center justify-center" title="Subir" aria-label="Subir"><ArrowUpIcon className="h-4 w-4" /></button>
                    <button onClick={() => move(idx, 1)} disabled={idx === visible.length - 1} className="h-7 w-7 rounded border border-gray-200 text-gray-500 disabled:opacity-30 flex items-center justify-center" title="Bajar" aria-label="Bajar"><ArrowDownIcon className="h-4 w-4" /></button>
                  </div>
                )}
              </div>

              {/* Acciones según la pestaña */}
              <div className="flex items-center justify-end gap-1.5 flex-wrap mt-3 pt-3 border-t border-gray-50">
                {tab === 'PENDING' && (
                  <>
                    <button onClick={() => setStatus(t, 'REJECTED')} disabled={busyId === t.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg disabled:opacity-50">
                      <XMarkIcon className="h-3.5 w-3.5" /> Rechazar
                    </button>
                    <button onClick={() => startEdit(t)} className="text-xs font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg">Editar</button>
                    <button onClick={() => setStatus(t, 'APPROVED')} disabled={busyId === t.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg disabled:opacity-50">
                      <CheckIcon className="h-3.5 w-3.5" /> {busyId === t.id ? '…' : 'Publicar'}
                    </button>
                  </>
                )}
                {tab === 'APPROVED' && (
                  <>
                    <button onClick={() => startEdit(t)} className="text-xs font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg">Editar</button>
                    <button onClick={() => toggleActive(t)} disabled={busyId === t.id}
                      className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50">
                      {busyId === t.id ? '…' : (t.active ? 'Ocultar' : 'Mostrar')}
                    </button>
                    <button onClick={() => setStatus(t, 'REJECTED')} disabled={busyId === t.id}
                      className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50">Quitar de la tienda</button>
                    <button onClick={() => remove(t)} disabled={busyId === t.id}
                      className="text-xs font-semibold text-rose-500 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg disabled:opacity-50">Eliminar</button>
                  </>
                )}
                {tab === 'REJECTED' && (
                  <>
                    <button onClick={() => remove(t)} disabled={busyId === t.id}
                      className="text-xs font-semibold text-rose-500 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg disabled:opacity-50">Eliminar</button>
                    <button onClick={() => setStatus(t, 'PENDING')} disabled={busyId === t.id}
                      className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50">Volver a pendientes</button>
                    <button onClick={() => setStatus(t, 'APPROVED')} disabled={busyId === t.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg disabled:opacity-50">
                      <CheckIcon className="h-3.5 w-3.5" /> Publicar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
