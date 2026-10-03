'use client';

/**
 * Render del hero en modo "flujo" (clásico apilado y responsive):
 * en móvil se apila en vertical (texto y logo) y en escritorio va en fila.
 * Se usa como vista por defecto del modo flujo y como versión móvil del modo
 * libre (Opción 2): escritorio = diseño libre, móvil = este diseño clásico.
 */

import Link from 'next/link';
import Image from 'next/image';
import type { HeroContent } from '@/lib/api';
import { resolveHeroColor } from '@/lib/heroPalette';

export default function HeroFlowView({
  hero,
  interactive = false,
}: {
  hero: HeroContent;
  interactive?: boolean;
}) {
  const bg = hero.background.image_url;

  return (
    <div
      className={`relative px-8 py-10 sm:px-16 sm:py-14 flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16 ${
        bg ? 'text-white' : ''
      }`}
    >
      {/* Texto + botones */}
      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
        {hero.phrases.map((p, i) =>
          p.type === 'title' ? (
            <h1
              key={i}
              className="font-serif text-4xl sm:text-5xl font-semibold leading-tight max-w-2xl"
              style={{ color: resolveHeroColor(p.color, bg ? '#ffffff' : '#450b3a'), textAlign: p.align ?? undefined, fontSize: p.font_size ? `${p.font_size}px` : undefined }}
            >
              {p.text}
            </h1>
          ) : (
            <p
              key={i}
              className="mt-4 max-w-lg"
              style={{ color: resolveHeroColor(p.color, bg ? '#f3f4f6' : '#6b7280'), textAlign: p.align ?? undefined, fontSize: p.font_size ? `${p.font_size}px` : undefined }}
            >
              {p.text}
            </p>
          ),
        )}

        {hero.buttons.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
            {hero.buttons.map((b, i) => {
              const cls =
                b.variant === 'primary'
                  ? 'bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-full transition-colors'
                  : 'bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 font-semibold px-8 py-3 rounded-full transition-colors';
              return interactive ? (
                <span key={i} className={cls}>{b.label}</span>
              ) : (
                <Link key={i} href={b.href} className={cls}>{b.label}</Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Logo (ocultable) */}
      {hero.show_logo && (
        <div className="flex-1 flex justify-center md:justify-end">
          <Image
            src={hero.logo_url}
            alt="Belleza Íntima"
            width={420}
            height={420}
            priority
            className="w-56 sm:w-72 md:w-full max-w-sm h-auto"
          />
        </div>
      )}
    </div>
  );
}
