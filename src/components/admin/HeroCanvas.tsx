'use client';

/**
 * Editor visual del hero: permite mover (drag), rotar y alinear los elementos
 * (frases, botones individuales y logo) dentro del recuadro del hero.
 *
 * - Posiciones en % del recuadro (x,y = centro del elemento).
 * - Guías de alineación: aparecen cuando el centro de un elemento coincide con
 *   el centro del contenedor o con el centro de otro elemento (con snap).
 * - Rotación mediante un tirador encima del elemento seleccionado.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { HeroContent, HeroItemLayout } from '@/lib/adminApi';
import { resolveHeroColor } from '@/lib/heroPalette';

type ElementId =
  | { kind: 'phrase'; index: number }
  | { kind: 'button'; index: number }
  | { kind: 'logo' };

type Guide = { axis: 'x' | 'y'; pos: number };

const SNAP_TOLERANCE = 1.5; // en % del recuadro

function idKey(id: ElementId): string {
  if (id.kind === 'phrase') return `phrase-${id.index}`;
  if (id.kind === 'button') return `button-${id.index}`;
  return 'logo';
}

function defaultLayoutFor(id: ElementId): HeroItemLayout {
  if (id.kind === 'phrase') return { x: 35, y: 28 + id.index * 12, rotation: 0 };
  if (id.kind === 'button') return { x: 30 + id.index * 18, y: 72, rotation: 0 };
  return { x: 80, y: 45, rotation: 0 }; // logo
}

export default function HeroCanvas({
  hero,
  onChange,
}: {
  hero: HeroContent;
  onChange: (next: HeroContent) => void;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [hud, setHud] = useState<string | null>(null);
  // Guardamos lo necesario del arrastre en una ref (no provoca re-render).
  const dragState = useRef<{
    id: ElementId;
    mode: 'move' | 'rotate';
    centerPx: { x: number; y: number };
  } | null>(null);

  const bgUrl = hero.background.image_url;
  const isFree = hero.layout === 'free';

  const getLayout = useCallback(
    (id: ElementId): HeroItemLayout => {
      if (id.kind === 'phrase') return hero.phrases[id.index]?.layout ?? defaultLayoutFor(id);
      if (id.kind === 'button') return hero.buttons[id.index]?.layout ?? defaultLayoutFor(id);
      return hero.logo_layout ?? defaultLayoutFor(id);
    },
    [hero],
  );

  const setLayout = useCallback(
    (id: ElementId, layout: HeroItemLayout) => {
      if (id.kind === 'phrase') {
        onChange({ ...hero, phrases: hero.phrases.map((p, i) => (i === id.index ? { ...p, layout } : p)) });
      } else if (id.kind === 'button') {
        onChange({ ...hero, buttons: hero.buttons.map((b, i) => (i === id.index ? { ...b, layout } : b)) });
      } else {
        onChange({ ...hero, logo_layout: layout });
      }
    },
    [hero, onChange],
  );

  const elements: ElementId[] = useMemo(() => {
    const els: ElementId[] = hero.phrases.map((_, i) => ({ kind: 'phrase', index: i } as ElementId));
    hero.buttons.forEach((_, i) => els.push({ kind: 'button', index: i }));
    if (hero.show_logo) els.push({ kind: 'logo' });
    return els;
  }, [hero.phrases, hero.buttons, hero.show_logo]);

  const beginDrag = (e: React.PointerEvent, id: ElementId, mode: 'move' | 'rotate') => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setSelected(idKey(id));
    const l = getLayout(id);
    dragState.current = { id, mode, centerPx: { x: l.x, y: l.y } };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const st = dragState.current;
    const box = boxRef.current;
    if (!st || !box) return;
    const rect = box.getBoundingClientRect();

    if (st.mode === 'move') {
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      const activeGuides: Guide[] = [];
      const others = elements.filter((el) => idKey(el) !== idKey(st.id));
      const xTargets = [50, ...others.map((el) => getLayout(el).x)];
      const yTargets = [50, ...others.map((el) => getLayout(el).y)];

      for (const t of xTargets) {
        if (Math.abs(x - t) <= SNAP_TOLERANCE) { x = t; activeGuides.push({ axis: 'x', pos: t }); break; }
      }
      for (const t of yTargets) {
        if (Math.abs(y - t) <= SNAP_TOLERANCE) { y = t; activeGuides.push({ axis: 'y', pos: t }); break; }
      }

      setGuides(activeGuides);
      setHud(`x: ${x.toFixed(0)}%  y: ${y.toFixed(0)}%`);
      const prev = getLayout(st.id);
      setLayout(st.id, { ...prev, x, y });
    } else {
      const cx = rect.left + (st.centerPx.x / 100) * rect.width;
      const cy = rect.top + (st.centerPx.y / 100) * rect.height;
      let deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
      const near = Math.round(deg / 15) * 15;
      if (Math.abs(deg - near) <= 3) deg = near;
      deg = Math.round(deg);
      setHud(`${deg}°`);
      const prev = getLayout(st.id);
      setLayout(st.id, { ...prev, rotation: deg });
    }
  };

  const endDrag = () => {
    dragState.current = null;
    setGuides([]);
    setHud(null);
  };

  const posStyle = (id: ElementId): React.CSSProperties => {
    const l = getLayout(id);
    return {
      position: 'absolute',
      left: `${l.x}%`,
      top: `${l.y}%`,
      transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
      touchAction: 'none',
      cursor: 'move',
    };
  };

  const isSel = (id: ElementId) => selected === idKey(id);
  const ring = (id: ElementId) => (isSel(id) ? 'outline outline-2 outline-primary-500 outline-offset-2' : '');

  const RotateHandle = ({ id }: { id: ElementId }) =>
    isSel(id) ? (
      <span
        onPointerDown={(e) => beginDrag(e, id, 'rotate')}
        title="Girar"
        style={{ touchAction: 'none' }}
        className="absolute left-1/2 -top-7 -translate-x-1/2 h-5 w-5 rounded-full bg-primary-600 border-2 border-white shadow cursor-grab z-20"
      />
    ) : null;

  const textColorFallback = bgUrl ? '#ffffff' : '#450b3a';
  const paraColorFallback = bgUrl ? '#f3f4f6' : '#6b7280';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500">Vista previa / editor visual</p>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => onChange({ ...hero, layout: e.target.checked ? 'free' : 'flow' })}
          />
          Posición libre (arrastrar y rotar)
        </label>
      </div>

      <div
        ref={boxRef}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        className="relative rounded-2xl ring-1 ring-primary-100/60 overflow-hidden select-none"
        style={{ aspectRatio: '16 / 7', minHeight: 260 }}
      >
        {/* Fondo (no captura el puntero) */}
        {bgUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: hero.background.overlay }} />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-white pointer-events-none" />
        )}

        {/* Guías de alineación */}
        {guides.map((g, i) =>
          g.axis === 'x' ? (
            <div key={i} className="absolute top-0 bottom-0 w-px bg-rose-400/80 z-30 pointer-events-none" style={{ left: `${g.pos}%` }} />
          ) : (
            <div key={i} className="absolute left-0 right-0 h-px bg-rose-400/80 z-30 pointer-events-none" style={{ top: `${g.pos}%` }} />
          ),
        )}

        {/* HUD con coordenadas/ángulo */}
        {hud && (
          <div className="absolute top-2 left-2 z-40 bg-black/70 text-white text-[10px] font-mono px-2 py-1 rounded pointer-events-none">
            {hud}
          </div>
        )}

        {isFree ? (
          <>
            {/* Frases */}
            {hero.phrases.map((p, i) => {
              const id: ElementId = { kind: 'phrase', index: i };
              return (
                <div
                  key={`ph-${i}`}
                  style={{ ...posStyle(id), textAlign: p.align ?? 'left', maxWidth: '70%' }}
                  onPointerDown={(e) => beginDrag(e, id, 'move')}
                  className={`z-10 px-1 ${ring(id)}`}
                >
                  <RotateHandle id={id} />
                  {p.type === 'title' ? (
                    <span className="font-serif text-2xl font-semibold leading-tight block pointer-events-none"
                      style={{ color: resolveHeroColor(p.color, textColorFallback), fontSize: p.font_size ? `${p.font_size}px` : undefined }}>
                      {p.text || 'Título…'}
                    </span>
                  ) : (
                    <span className="text-sm block pointer-events-none"
                      style={{ color: resolveHeroColor(p.color, paraColorFallback), fontSize: p.font_size ? `${p.font_size}px` : undefined }}>
                      {p.text || 'Párrafo…'}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Botones individuales */}
            {hero.buttons.map((b, i) => {
              const id: ElementId = { kind: 'button', index: i };
              return (
                <div
                  key={`btn-${i}`}
                  style={posStyle(id)}
                  onPointerDown={(e) => beginDrag(e, id, 'move')}
                  className={`z-10 ${ring(id)}`}
                >
                  <RotateHandle id={id} />
                  <span className={`text-xs font-semibold px-4 py-2 rounded-full block pointer-events-none ${
                    b.variant === 'primary' ? 'bg-primary-600 text-white' : 'bg-white text-primary-700 border border-primary-200'
                  }`}>
                    {b.label || 'Botón'}
                  </span>
                </div>
              );
            })}

            {/* Logo */}
            {hero.show_logo && (() => {
              const id: ElementId = { kind: 'logo' };
              return (
                <div
                  style={posStyle(id)}
                  onPointerDown={(e) => beginDrag(e, id, 'move')}
                  className={`z-10 ${ring(id)}`}
                >
                  <RotateHandle id={id} />
                  <div className="relative h-24 w-24 pointer-events-none">
                    {hero.logo_url ? <Image src={hero.logo_url} alt="Logo" fill sizes="96px" className="object-contain" /> : null}
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          /* Modo flujo (clásico apilado) — solo vista previa, sin drag */
          <div className="relative p-6 flex flex-col-reverse sm:flex-row items-center gap-6 h-full">
            <div className="flex-1">
              {hero.phrases.map((p, i) => (
                <div key={i} style={{ textAlign: p.align ?? 'left' }}>
                  {p.type === 'title' ? (
                    <h3 className="font-serif text-2xl font-semibold leading-tight" style={{ color: resolveHeroColor(p.color, textColorFallback), fontSize: p.font_size ? `${p.font_size}px` : undefined }}>
                      {p.text || 'Título…'}
                    </h3>
                  ) : (
                    <p className="mt-1 text-sm" style={{ color: resolveHeroColor(p.color, paraColorFallback), fontSize: p.font_size ? `${p.font_size}px` : undefined }}>
                      {p.text || 'Párrafo…'}
                    </p>
                  )}
                </div>
              ))}
              <div className="mt-4 flex flex-wrap gap-2">
                {hero.buttons.map((b, i) => (
                  <span key={i} className={`text-xs font-semibold px-4 py-2 rounded-full ${
                    b.variant === 'primary' ? 'bg-primary-600 text-white' : 'bg-white text-primary-700 border border-primary-200'
                  }`}>{b.label || 'Botón'}</span>
                ))}
              </div>
            </div>
            {hero.show_logo && (
              <div className="flex-1 flex justify-center">
                <div className="relative h-28 w-28">
                  {hero.logo_url ? <Image src={hero.logo_url} alt="Logo" fill sizes="112px" className="object-contain" /> : null}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isFree && (
        <p className="text-[11px] text-gray-400 mt-2">
          Haz clic en un elemento para seleccionarlo, arrástralo para moverlo y usa el punto azul superior para
          girarlo. Las líneas rosas aparecen cuando se alinea con el centro u otro elemento.
        </p>
      )}
    </div>
  );
}
