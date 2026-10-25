'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import { imageSrc } from '@/lib/api';
import type { Combo } from '@/lib/api';

interface Props {
  combo: Combo;
  priority?: boolean;
}

/** Tarjeta de combo para la tienda, al mismo estilo que ProductCard. */
export default function ComboCard({ combo, priority = false }: Props) {
  // Imagen: portada del combo, o la primera de su galería, o la del primer producto.
  const galleryFirst = [...(combo.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
  const fallbackImg = combo.items.find((it) => it.product?.images?.length)?.product?.images?.[0]?.url ?? null;
  const imageUrl = combo.image_url || galleryFirst || fallbackImg;

  return (
    <Link
      href={`/combos/${combo.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-shadow"
    >
      {/* Imagen */}
      <div className="aspect-[3/4] relative bg-gradient-to-br from-primary-50 to-primary-100">
        {imageUrl ? (
          <Image
            src={imageSrc(imageUrl)}
            alt={combo.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🎁</span>
          </div>
        )}

        {/* Badge de ahorro */}
        {combo.savings > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-primary-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            -{combo.savings_percent}%
          </span>
        )}
      </div>

      <div className="p-4">
        <span className="inline-block text-xs font-semibold text-primary-200 uppercase tracking-wider mb-1">
          Combo · {combo.items.length} producto{combo.items.length !== 1 ? 's' : ''}
        </span>
        <h3 className="font-serif text-lg text-gray-800 group-hover:text-primary-700 transition-colors leading-tight">
          {combo.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-primary-600 font-bold nums">{formatPrice(combo.final_price)}</p>
          {combo.savings > 0 && (
            <span className="text-xs text-gray-400 line-through nums">{formatPrice(combo.original_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
