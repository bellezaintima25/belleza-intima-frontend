'use client';

/**
 * Render NO interactivo del hero en modo "posición libre" con lienzo escalado.
 * Soporta dos dispositivos con diseño independiente (Opción 3):
 *  - desktop: lienzo 16:7, usa layout/font_size/fondo de escritorio.
 *  - mobile:  lienzo 3:4, usa layout_mobile/font_size_mobile/fondo móvil,
 *             con fallback a los valores de escritorio cuando no estén definidos.
 *
 * El diseño se define sobre un lienzo base de ancho fijo y se escala con
 * transform: scale() para caber en cualquier ancho sin romperse ni solaparse.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HeroContent, HeroItemLayout } from '@/lib/api';
import { resolveHeroColor } from '@/lib/heroPalette';

export type HeroDevice = 'desktop' | 'mobile';

// Lienzos base por dispositivo.
export const HERO_BASE = {
  desktop: { w: 1120, h: Math.round((1120 * 7) / 16) },  // 16:7
  mobile: { w: 480, h: Math.round((480 * 4) / 3) },      // 3:4
} as const;

export default function HeroFreeView({
  hero,
  device = 'desktop',
  interactive = false,
}: {
  hero: HeroContent;
  device?: HeroDevice;
  interactive?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const base = HERO_BASE[device];

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / base.w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [base.w]);

  const isMobile = device === 'mobile';

  // Fondo según dispositivo (móvil cae al de escritorio si no tiene propio).
  const bgUrl = isMobile
    ? (hero.background.image_url_mobile || hero.background.image_url)
    : hero.background.image_url;
  const overlay = isMobile
    ? (hero.background.overlay_mobile ?? hero.background.overlay)
    : hero.background.overlay;

  const titleFallback = bgUrl ? '#ffffff' : '#450b3a';
  const paraFallback = bgUrl ? '#f3f4f6' : '#6b7280';

  // Devuelve el layout del dispositivo activo, con fallback al de escritorio.
  const pick = (desktop: HeroItemLayout | null | undefined, mobile: HeroItemLayout | null | undefined, def: HeroItemLayout) =>
    (isMobile ? (mobile ?? desktop) : desktop) ?? def;

  // Tamaños base por defecto, ajustados por dispositivo.
  const titleDefault = isMobile ? 30 : 44;
  const paraDefault = isMobile ? 15 : 18;
  const logoSize = isMobile ? 130 : 180;

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden" style={{ height: base.h * scale }}>
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: base.w, height: base.h, transform: `scale(${scale})` }}
      >
        {/* Fondo */}
        {bgUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black" style={{ opacity: overlay }} />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-white" />
        )}

        {/* Frases */}
        {hero.phrases.map((p, i) => {
          const l = pick(p.layout, p.layout_mobile, { x: 50, y: 20 + i * 14, rotation: 0 });
          const size = isMobile
            ? (p.font_size_mobile ?? p.font_size ?? (p.type === 'title' ? titleDefault : paraDefault))
            : (p.font_size ?? (p.type === 'title' ? titleDefault : paraDefault));
          const boxW = (isMobile ? (p.box_width_mobile ?? p.box_width) : p.box_width) ?? 80;
          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${l.x}%`,
            top: `${l.y}%`,
            transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
            textAlign: p.align ?? 'left',
            width: `${boxW}%`,
          };
          return p.type === 'title' ? (
            <h1 key={i} style={{ ...style, color: resolveHeroColor(p.color, titleFallback), fontSize: size }} className="font-serif font-semibold leading-tight">
              {p.text}
            </h1>
          ) : (
            <p key={i} style={{ ...style, color: resolveHeroColor(p.color, paraFallback), fontSize: size }}>
              {p.text}
            </p>
          );
        })}

        {/* Botones individuales */}
        {hero.buttons.map((b, i) => {
          const l = pick(b.layout, b.layout_mobile, { x: 50, y: 72 + i * 10, rotation: 0 });
          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${l.x}%`,
            top: `${l.y}%`,
            transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
          };
          const cls =
            b.variant === 'primary'
              ? 'bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-full transition-colors whitespace-nowrap'
              : 'bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 font-semibold px-8 py-3 rounded-full transition-colors whitespace-nowrap';
          return interactive ? (
            <span key={i} style={style} className={cls}>{b.label}</span>
          ) : (
            <Link key={i} href={b.href} style={style} className={cls}>{b.label}</Link>
          );
        })}

        {/* Logo */}
        {hero.show_logo && (() => {
          const l = pick(hero.logo_layout, hero.logo_layout_mobile, { x: 50, y: 48, rotation: 0 });
          const size = isMobile ? (hero.logo_size_mobile ?? hero.logo_size ?? logoSize) : (hero.logo_size ?? logoSize);
          return (
            <div className="absolute" style={{ left: `${l.x}%`, top: `${l.y}%`, transform: `translate(-50%, -50%) rotate(${l.rotation}deg)` }}>
              <div className="relative" style={{ height: size, width: size }}>
                {hero.logo_url ? <Image src={hero.logo_url} alt="Belleza Íntima" fill sizes="300px" className="object-contain" /> : null}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
