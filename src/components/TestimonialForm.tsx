'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { XMarkIcon, CameraIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { api, imageSrc } from '@/lib/api';

const MAX_TEXT = 600;
const MIN_TEXT = 10;
const RATING_LABELS = ['', 'Podría mejorar', 'Regular', 'Bien', 'Muy bien', '¡Me encantó!'];

/** Vista previa de cómo se mostrará el nombre: "María G." (igual que en el servidor). */
function previewName(first: string, last: string): string {
  const f = first.trim().split(/\s+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const l = last.trim().charAt(0).toUpperCase();
  if (!f) return '';
  return l ? `${f} ${l}.` : f;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TestimonialForm({ open, onClose }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [trap, setTrap] = useState(''); // campo trampa: las personas nunca lo ven
  const firstRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Cerrar con Escape, bloquear el scroll del fondo y enfocar el primer campo.
  // onClose va en una ref para que el efecto solo dependa de `open` (si no, se
  // volvería a enfocar el primer campo mientras la persona escribe).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => firstRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  // El aviso de error se quita en cuanto la persona corrige algún campo.
  useEffect(() => { setError(null); }, [firstName, lastName, rating, text]);

  if (!open) return null;

  const shownRating = hover || rating;
  const name = previewName(firstName, lastName);
  const firstWord = firstName.trim().split(/\s+/)[0] ?? '';
  const thanksName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();

  const reset = () => {
    setFirstName(''); setLastName(''); setRating(0); setText('');
    setPhotoUrl(''); setError(null); setDone(false); setTrap('');
  };
  const close = () => { onClose(); if (done) reset(); };

  const handlePhoto = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const { url } = await api.testimonials.uploadPhoto(file);
      setPhotoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim()) return setError('Escribe tu nombre.');
    if (!lastName.trim()) return setError('Escribe tu apellido (solo se mostrará la inicial).');
    if (rating < 1) return setError('Elige cuántas estrellas nos das.');
    if (text.trim().length < MIN_TEXT) return setError(`Cuéntanos un poco más (mínimo ${MIN_TEXT} caracteres).`);
    setSending(true);
    try {
      await api.testimonials.submit({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        text: text.trim(),
        rating,
        photo_url: photoUrl || null,
        website: trap,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar tu comentario. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300';

  // Se pinta en <body> (portal) para quedar por encima del navbar y de cualquier contenedor con z-index.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="testimonial-form-title"
      onClick={close}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-3 right-3 h-9 w-9 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {done ? (
          <div className="px-6 py-12 text-center">
            <CheckCircleIcon className="h-14 w-14 text-emerald-500 mx-auto" aria-hidden="true" />
            <h2 id="testimonial-form-title" className="mt-4 font-serif text-2xl font-semibold text-primary-700">
              ¡Gracias, {thanksName}!
            </h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              Sentirte bien también merece ser contado. Gracias por tu historia: muy pronto lo verás brillar aquí.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-2.5 rounded-full transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-7 space-y-5" noValidate>
            <div className="pr-8">
              <h2 id="testimonial-form-title" className="font-serif text-2xl font-semibold text-primary-700">
                Cuéntanos tu experiencia
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Tu opinión nos ayuda a seguir mejorando. Primero la revisamos y luego la publicamos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tf-first" className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                <input
                  id="tf-first" ref={firstRef} className={inputCls} value={firstName} maxLength={30}
                  autoComplete="given-name" placeholder="María"
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="tf-last" className="block text-xs font-semibold text-gray-600 mb-1">Apellido</label>
                <input
                  id="tf-last" className={inputCls} value={lastName} maxLength={30}
                  autoComplete="family-name" placeholder="Gómez"
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 -mt-3">
              {name
                ? <>Se mostrará como: <span className="font-semibold text-gray-600">{name}</span></>
                : 'Por tu privacidad, solo mostramos tu nombre y la inicial de tu apellido.'}
            </p>

            <div>
              <span className="block text-xs font-semibold text-gray-600 mb-1">¿Cómo fue tu experiencia?</span>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onFocus={() => setHover(n)}
                    onBlur={() => setHover(0)}
                    className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                  >
                    <StarIcon className={`h-8 w-8 transition-colors ${n <= shownRating ? 'text-amber-400' : 'text-gray-200'}`} />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500">{RATING_LABELS[shownRating]}</span>
              </div>
            </div>

            <div>
              <label htmlFor="tf-text" className="block text-xs font-semibold text-gray-600 mb-1">Tu comentario</label>
              <textarea
                id="tf-text" className={`${inputCls} resize-none`} rows={4} value={text} maxLength={MAX_TEXT}
                placeholder="Cuéntanos qué te gustó: la calidad, el ajuste, la atención…"
                onChange={(e) => setText(e.target.value)}
              />
              <p className={`text-xs text-right mt-1 ${text.length > MAX_TEXT - 40 ? 'text-amber-600' : 'text-gray-400'}`}>
                {text.length}/{MAX_TEXT}
              </p>
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-600 mb-1">Tu foto (opcional)</span>
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 rounded-full overflow-hidden bg-primary-50 flex items-center justify-center flex-shrink-0">
                  {photoUrl ? (
                    <Image src={imageSrc(photoUrl)} alt="Tu foto" fill sizes="56px" className="object-cover" />
                  ) : (
                    <CameraIcon className="h-6 w-6 text-primary-300" aria-hidden="true" />
                  )}
                </div>
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ''; }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="text-sm font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-4 py-2 rounded-xl disabled:opacity-60"
                >
                  {uploading ? 'Subiendo…' : photoUrl ? 'Cambiar foto' : 'Subir foto'}
                </button>
                {photoUrl && (
                  <button type="button" onClick={() => setPhotoUrl('')} className="text-xs text-rose-500 hover:underline">
                    Quitar
                  </button>
                )}
              </div>
            </div>

            {/* Campo trampa: oculto para personas y lectores de pantalla; los robots lo llenan. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label>
                No llenes este campo
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
              </label>
            </div>

            {error && (
              <p role="alert" className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3.5 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending || uploading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-full transition-colors"
            >
              {sending ? 'Enviando…' : 'Enviar comentario'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
