'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GiftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { api, effectivePrice, getImageForColor, imageSrc } from '@/lib/api';
import type { Combo, Product } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';

const MAX_OFFERS = 3;
const CACHE_MS = 5 * 60 * 1000; // no se vuelve a pedir al servidor cada vez que se abre el carrito

let cache: { at: number; products: Product[]; combos: Combo[] } | null = null;

async function loadOffers(): Promise<{ products: Product[]; combos: Combo[] }> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  // Si una de las dos falla, la otra igual se muestra.
  const [products, combos] = await Promise.all([
    api.products.onSale().catch(() => [] as Product[]),
    api.combos.list().catch(() => [] as Combo[]),
  ]);
  cache = { at: Date.now(), products, combos };
  return cache;
}

type Offer =
  | { kind: 'combo'; id: number; href: string; name: string; image: string | null; price: number; oldPrice: number; badge: string; weight: number }
  | { kind: 'product'; id: number; href: string; name: string; image: string | null; price: number; oldPrice: number; badge: string; weight: number };

/**
 * Tira "Pensado para ti" dentro del carrito: productos en oferta y combos que la clienta
 * todavía NO tiene. Lo que ya está en el carrito no se vuelve a mostrar (ni como suelto, ni dentro
 * de un combo), y cuando no queda nada que ofrecer, el bloque desaparece.
 */
export default function CartOffers({ onNavigate }: { onNavigate: () => void }) {
  const { items, combos: cartCombos } = useCart();
  const [data, setData] = useState<{ products: Product[]; combos: Combo[] } | null>(null);

  useEffect(() => {
    let alive = true;
    loadOffers().then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);

  const offers = useMemo<Offer[]>(() => {
    if (!data) return [];
    // Productos que ya tiene: sueltos o dentro de algún combo del carrito.
    const inCartProducts = new Set<number>(items.map((i) => i.product.id));
    cartCombos.forEach((c) => c.items.forEach((i) => inCartProducts.add(i.productId)));
    const inCartCombos = new Set<number>(cartCombos.map((c) => c.comboId));

    const hasStock = (p: Product | null | undefined, qty = 1) =>
      !!p && (p.variants ?? []).some((v) => v.stock >= qty);

    const comboOffers: Offer[] = data.combos
      .filter((c) =>
        c.active &&
        c.items.length > 0 &&
        c.savings > 0 &&
        !inCartCombos.has(c.id) &&
        // si ya tiene alguna de sus piezas, el combo se le haría repetido
        !c.items.some((i) => inCartProducts.has(i.product_id)) &&
        // y solo se ofrece si hay existencias para armarlo
        c.items.every((i) => hasStock(i.product as unknown as Product, i.quantity)),
      )
      .map((c) => ({
        kind: 'combo' as const,
        id: c.id,
        href: `/combos/${c.id}`,
        name: c.name,
        image: c.image_url ?? c.images?.[0]?.url ?? getImageForColor(c.items[0]?.product?.images ?? []) ?? null,
        price: c.final_price,
        oldPrice: c.original_price,
        badge: `Ahorra ${Math.round(c.savings_percent)}%`,
        weight: 1000 + c.savings_percent,
      }));

    const productOffers: Offer[] = data.products
      .filter((p) => p.on_sale && !inCartProducts.has(p.id) && hasStock(p))
      .map((p) => ({
        kind: 'product' as const,
        id: p.id,
        href: `/products/${p.id}`,
        name: p.name,
        image: getImageForColor(p.images) ?? null,
        price: effectivePrice(p, null),
        oldPrice: p.base_price,
        badge: `-${Math.round(p.discount_percent)}%`,
        weight: p.discount_percent,
      }));

    // Primero los combos (ticket más alto) y luego lo que más descuento tiene.
    return [...comboOffers, ...productOffers].sort((a, b) => b.weight - a.weight).slice(0, MAX_OFFERS);
  }, [data, items, cartCombos]);

  if (offers.length === 0) return null;

  return (
    <section
      aria-label="Ofertas para ti"
      className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-50 p-3"
    >
      <div className="flex items-start gap-2 mb-2.5 px-1">
        <SparklesIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary-600" />
        <div>
          <h3 className="text-sm font-bold leading-tight text-primary-700">Pensado para ti</h3>
          <p className="text-xs italic text-gray-500">Esto te puede encantar</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 no-scrollbar">
        {offers.map((o) => (
          <div
            key={`${o.kind}-${o.id}`}
            className="w-36 flex-shrink-0 snap-start rounded-xl bg-white border border-primary-100 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="relative aspect-[3/4] bg-primary-50">
              {o.image ? (
                <Image src={imageSrc(o.image)} alt={o.name} fill sizes="144px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-primary-200">
                  <GiftIcon className="h-8 w-8" />
                </div>
              )}
              <span className="absolute top-2 left-2 bg-primary-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow nums">
                {o.badge}
              </span>
              {o.kind === 'combo' && (
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 bg-white/90 text-primary-700 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                  <GiftIcon className="h-3 w-3" /> Combo
                </span>
              )}
            </div>

            <div className="p-2.5 flex flex-col flex-1">
              <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 min-h-[2rem]">{o.name}</p>
              <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-primary-600 nums">{formatPrice(o.price)}</span>
                {o.oldPrice > o.price && (
                  <span className="text-[11px] text-gray-400 line-through nums">{formatPrice(o.oldPrice)}</span>
                )}
              </div>
              <Link
                href={o.href}
                onClick={onNavigate}
                className="mt-2 block text-center text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white py-1.5 rounded-lg transition-colors"
              >
                Ver oferta
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
