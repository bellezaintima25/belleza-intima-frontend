'use client';

/**
 * Editor visual del hero (modo libre) sobre el MISMO lienzo base escalado que
 * HeroFreeView, de modo que lo que editas es idéntico a lo que se publica
 * (correlación 1:1). Soporta dos dispositivos:
 *  - desktop: lienzo 16:7 (HERO_BASE.desktop), edita *_desktop.
 *  - mobile:  lienzo 3:4 (HERO_BASE.mobile), edita *_mobile.
 *
 * Interacciones: mover (drag), rotar (tirador superior), redimensionar el ancho
 * del recuadro de texto (tirador lateral) y el tamaño del logo (tirador esquina).
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { HeroContent, HeroItemLayout } from '@/lib/adminApi';
import { resolveHeroColor } from '@/lib/heroPalette';
import { HERO_BASE } from '@/components/HeroFreeView';

type Device = 'desktop' | 'mobile';
type ElementId = { kind: 'phrase'; index: number } | { kind: 'button'; index: number } | { kind: 'logo' };
type Guide = { axis: 'x' | 'y'; pos: number };
type Mode = 'move' | 'rotate' | 'width' | 'logo';

const SNAP_TOLERANCE = 1.5;

function idKey(id: ElementId): string {
  if (id.kind === 'phrase') return `phrase-${id.index}`;
  if (id.kind === 'button') return `button-${id.index}`;
  return 'logo';
}

function defaultLayoutFor(id: ElementId): HeroItemLayout {
  if (id.kind === 'phrase') return { x: 50, y: 24 + id.index * 14, rotation: 0 };
  if (id.kind === 'button') return { x: 50, y: 74 + id.index * 10, rotation: 0 };
  return { x: 50, y: 48, rotation: 0 };
}

export default function HeroCanvas({
  hero,
  onChange,
  device = 'desktop',
}: {
  hero: HeroContent;
  onChange: (next: HeroContent) => void;
  device?: Device;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [hud, setHud] = useState<string | null>(null);
  const dragState = useRef<{ id: ElementId; mode: Mode; centerPx: { x: number; y: number } } | null>(null);

  const isMobile = device === 'mobile';
  const base = isMobile ? HERO_BASE.mobile : HERO_BASE.desktop;

  // Fondo según dispositivo.
  const bgUrl = isMobile ? (hero.background.image_url_mobile || hero.background.image_url) : hero.background.image_url;
  const overlay = isMobile ? (hero.background.overlay_mobile ?? hero.background.overlay) : hero.background.overlay;

  const getLayout = useCallback(
    (id: ElementId): HeroItemLayout => {
      const pick = (d?: HeroItemLayout | null, m?: HeroItemLayout | null) => (isMobile ? (m ?? d) : d) ?? defaultLayoutFor(id);
      if (id.kind === 'phrase') { const p = hero.phrases[id.index]; return pick(p?.layout, p?.layout_mobile); }
      if (id.kind === 'button') { const b = hero.buttons[id.index]; return pick(b?.layout, b?.layout_mobile); }
      return pick(hero.logo_layout, hero.logo_layout_mobile);
    },
    [hero, isMobile],
  );

  const setLayout = useCallback(
    (id: ElementId, layout: HeroItemLayout) => {
      const field = isMobile ? 'layout_mobile' : 'layout';
      if (id.kind === 'phrase') onChange({ ...hero, phrases: hero.phrases.map((p, i) => (i === id.index ? { ...p, [field]: layout } : p)) });
      else if (id.kind === 'button') onChange({ ...hero, buttons: hero.buttons.map((b, i) => (i === id.index ? { ...b, [field]: layout } : b)) });
      else onChange({ ...hero, [isMobile ? 'logo_layout_mobile' : 'logo_layout']: layout });
    },
    [hero, onChange, isMobile],
  );

  const phraseWidth = (i: number): number => {
    const p = hero.phrases[i];
    return (isMobile ? (p?.box_width_mobile ?? p?.box_width) : p?.box_width) ?? 80;
  };
  const setPhraseWidth = (i: number, w: number) => {
    const field = isMobile ? 'box_width_mobile' : 'box_width';
    onChange({ ...hero, phrases: hero.phrases.map((p, idx) => (idx === i ? { ...p, [field]: Math.max(10, Math.min(100, Math.round(w))) } : p)) });
  };

  const logoSize = (): number => (isMobile ? (hero.logo_size_mobile ?? hero.logo_size) : hero.logo_size) ?? (isMobile ? 130 : 180);
  const setLogoSize = (s: number) => onChange({ ...hero, [isMobile ? 'logo_size_mobile' : 'logo_size']: Math.max(40, Math.min(base.w * 0.9, Math.round(s))) });

  const elements: ElementId[] = useMemo(() => {
    const els: ElementId[] = hero.phrases.map((_, i) => ({ kind: 'phrase', index: i } as ElementId));
    hero.buttons.forEach((_, i) => els.push({ kind: 'button', index: i }));
    if (hero.show_logo) els.push({ kind: 'logo' });
    return els;
  }, [hero.phrases, hero.buttons, hero.show_logo]);

  const beginDrag = (e: React.PointerEvent, id: ElementId, mode: Mode) => {
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
    // Coordenadas del cursor en el lienzo base (deshaciendo la escala).
    const bx = (e.clientX - rect.left) / scale; // px en base
    const by = (e.clientY - rect.top) / scale;

    if (st.mode === 'move') {
      let x = (bx / base.w) * 100;
      let y = (by / base.h) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      const activeGuides: Guide[] = [];
      const others = elements.filter((el) => idKey(el) !== idKey(st.id));
      const xTargets = [50, ...others.map((el) => getLayout(el).x)];
      const yTargets = [50, ...others.map((el) => getLayout(el).y)];
      for (const t of xTargets) { if (Math.abs(x - t) <= SNAP_TOLERANCE) { x = t; activeGuides.push({ axis: 'x', pos: t }); break; } }
      for (const t of yTargets) { if (Math.abs(y - t) <= SNAP_TOLERANCE) { y = t; activeGuides.push({ axis: 'y', pos: t }); break; } }
      setGuides(activeGuides);
      setHud(`x: ${x.toFixed(0)}%  y: ${y.toFixed(0)}%`);
      setLayout(st.id, { ...getLayout(st.id), x, y });
    } else if (st.mode === 'rotate') {
      const cx = (st.centerPx.x / 100) * base.w;
      const cy = (st.centerPx.y / 100) * base.h;
      let deg = (Math.atan2(by - cy, bx - cx) * 180) / Math.PI + 90;
      const near = Math.round(deg / 15) * 15;
      if (Math.abs(deg - near) <= 3) deg = near;
      deg = Math.round(deg);
      setHud(`${deg}°`);
      setLayout(st.id, { ...getLayout(st.id), rotation: deg });
    } else if (st.mode === 'width' && st.id.kind === 'phrase') {
      // Ancho = distancia horizontal del cursor al centro del elemento, x2, en % del lienzo.
      const cxPct = getLayout(st.id).x;
      const cursorPct = (bx / base.w) * 100;
      const w = Math.abs(cursorPct - cxPct) * 2;
      setHud(`ancho: ${Math.round(Math.max(10, Math.min(100, w)))}%`);
      setPhraseWidth(st.id.index, w);
    } else if (st.mode === 'logo') {
      // Tamaño del logo = distancia del cursor al centro, x2 (en px base).
      const cx = (st.centerPx.x / 100) * base.w;
      const cy = (st.centerPx.y / 100) * base.h;
      const d = Math.hypot(bx - cx, by - cy) * 2 / Math.SQRT2; // diagonal → lado
      setHud(`logo: ${Math.round(d)}px`);
      setLogoSize(d);
    }
  };

  const endDrag = () => { dragState.current = null; setGuides([]); setHud(null); };

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

  const Handle = ({ id, mode, className, title }: { id: ElementId; mode: Mode; className: string; title: string }) =>
    isSel(id) ? (
      <span
        onPointerDown={(e) => beginDrag(e, id, mode)}
        title={title}
        style={{ touchAction: 'none' }}
        className={`absolute h-4 w-4 rounded-full bg-primary-600 border-2 border-white shadow z-20 ${className}`}
      />
    ) : null;

  const titleFallback = bgUrl ? '#ffffff' : '#450b3a';
  const paraFallback = bgUrl ? '#f3f4f6' : '#6b7280';
  const titleDefault = isMobile ? 30 : 44;
  const paraDefault = isMobile ? 15 : 18;

  const sizeOf = (p: HeroContent['phrases'][number]) =>
    isMobile ? (p.font_size_mobile ?? p.font_size ?? (p.type === 'title' ? titleDefault : paraDefault))
             : (p.font_size ?? (p.type === 'title' ? titleDefault : paraDefault));

  // ResizeObserver imperativo con callback ref para recalcular la escala.
  const setWrap = (el: HTMLDivElement | null) => {
    wrapRef.current = el;
    if (el) {
      setScale(el.clientWidth / base.w);
      const ro = new ResizeObserver(() => setScale(el.clientWidth / base.w));
      ro.observe(el);
    }
  };

  return (
    <div ref={setWrap} className="relative w-full overflow-hidden rounded-2xl ring-1 ring-primary-100/60 select-none" style={{ height: base.h * scale }}>
      <div
        ref={boxRef}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: base.w, height: base.h, transform: `scale(${scale})` }}
      >
        {/* Fondo */}
        {bgUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: overlay }} />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-white pointer-events-none" />
        )}

        {/* Guías */}
        {guides.map((g, i) =>
          g.axis === 'x' ? (
            <div key={i} className="absolute top-0 bottom-0 w-px bg-rose-400/80 z-30 pointer-events-none" style={{ left: `${g.pos}%` }} />
          ) : (
            <div key={i} className="absolute left-0 right-0 h-px bg-rose-400/80 z-30 pointer-events-none" style={{ top: `${g.pos}%` }} />
          ),
        )}

        {/* HUD */}
        {hud && (
          <div className="absolute top-2 left-2 z-40 bg-black/70 text-white font-mono px-2 py-1 rounded pointer-events-none" style={{ fontSize: 14 }}>
            {hud}
          </div>
        )}

        {/* Frases */}
        {hero.phrases.map((p, i) => {
          const id: ElementId = { kind: 'phrase', index: i };
          return (
            <div
              key={`ph-${i}`}
              style={{ ...posStyle(id), textAlign: p.align ?? 'left', width: `${phraseWidth(i)}%` }}
              onPointerDown={(e) => beginDrag(e, id, 'move')}
              className={`z-10 ${ring(id)}`}
            >
              <Handle id={id} mode="rotate" title="Girar" className="left-1/2 -top-7 -translate-x-1/2 cursor-grab" />
              <Handle id={id} mode="width" title="Ancho del recuadro" className="top-1/2 -right-2 -translate-y-1/2 cursor-ew-resize" />
              {p.type === 'title' ? (
                <span className="font-serif font-semibold leading-tight block pointer-events-none"
                  style={{ color: resolveHeroColor(p.color, titleFallback), fontSize: sizeOf(p) }}>
                  {p.text || 'Título…'}
                </span>
              ) : (
                <span className="block pointer-events-none"
                  style={{ color: resolveHeroColor(p.color, paraFallback), fontSize: sizeOf(p) }}>
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
            <div key={`btn-${i}`} style={posStyle(id)} onPointerDown={(e) => beginDrag(e, id, 'move')} className={`z-10 ${ring(id)}`}>
              <Handle id={id} mode="rotate" title="Girar" className="left-1/2 -top-7 -translate-x-1/2 cursor-grab" />
              <span className={`font-semibold px-8 py-3 rounded-full block pointer-events-none whitespace-nowrap ${
                b.variant === 'primary' ? 'bg-primary-600 text-white' : 'bg-white text-primary-700 border border-primary-200'
              }`} style={{ fontSize: 15 }}>
                {b.label || 'Botón'}
              </span>
            </div>
          );
        })}

        {/* Logo */}
        {hero.show_logo && (() => {
          const id: ElementId = { kind: 'logo' };
          const s = logoSize();
          return (
            <div style={posStyle(id)} onPointerDown={(e) => beginDrag(e, id, 'move')} className={`z-10 ${ring(id)}`}>
              <Handle id={id} mode="rotate" title="Girar" className="left-1/2 -top-7 -translate-x-1/2 cursor-grab" />
              <Handle id={id} mode="logo" title="Tamaño del logo" className="-right-2 -bottom-2 cursor-nwse-resize" />
              <div className="relative pointer-events-none" style={{ height: s, width: s }}>
                {hero.logo_url ? <Image src={hero.logo_url} alt="Logo" fill sizes="300px" className="object-contain" /> : null}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
