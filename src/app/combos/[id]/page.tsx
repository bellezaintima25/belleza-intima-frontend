'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassPlusIcon, XMarkIcon, GiftIcon, SparklesIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { api, getImageForColor, imageSrc, tagBadgeStyle } from '@/lib/api';
import type { Combo } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/context/CartContext';

export default function ComboDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addCombo } = useCart();
  const [combo, setCombo] = useState<Combo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Para el gesto de swipe en móvil.
  const touchStartX = useRef<number | null>(null);
  // Selecciones de talla/color por producto del combo (clave = product_id).
  const [selections, setSelections] = useState<Record<number, { size: string | null; color: string | null }>>({});
  // Visor de imagen a pantalla completa (lightbox).
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.combos.get(Number(id))
      .then((c) => {
        setCombo(c);
        setActiveIndex(0);
        // Inicializa selecciones: autocompleta cuando solo hay una opción EN STOCK.
        const init: Record<number, { size: string | null; color: string | null }> = {};
        for (const it of c.items) {
          const vs = (it.product?.variants ?? []).filter((v) => v.stock > 0);
          const sizes = [...new Set(vs.map((v) => v.size))];
          const colors = [...new Set(vs.map((v) => v.color))];
          init[it.product_id] = {
            size: sizes.length === 1 ? sizes[0] : null,
            color: colors.length === 1 ? colors[0] : null,
          };
        }
        setSelections(init);
      })
      .catch(() => setError('No se pudo cargar el combo.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Lightbox: cerrar con Escape, navegar con flechas y bloquear scroll de fondo.
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowRight') setActiveIndex((i) => i + 1);
      else if (e.key === 'ArrowLeft') setActiveIndex((i) => i - 1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-[4/5] bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-7 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <GiftIcon className="h-14 w-14 mx-auto mb-4 text-primary-200" />
        <p className="text-gray-500 mb-4">{error ?? 'Combo no encontrado.'}</p>
        <Link href="/combos" className="text-primary-600 hover:underline">← Ver todos los combos</Link>
      </div>
    );
  }

  const galleryImages = [...(combo.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  // Fotos de respaldo: TODAS las imágenes de los productos incluidos (en orden),
  // deduplicadas. Así, sin fotos propias, se ven todos los productos del combo.
  const productImagesAll: string[] = (() => {
    const urls: string[] = [];
    const seen = new Set<string>();
    for (const it of combo.items) {
      for (const img of it.product?.images ?? []) {
        if (img.url && !seen.has(img.url)) { seen.add(img.url); urls.push(img.url); }
      }
    }
    return urls;
  })();

  // Lista final de URLs para la galería:
  // 1) galería propia del combo (si tiene).
  // 2) si include_product_images: también las fotos de los productos.
  // La portada (image_url) va primero cuando no hay galería propia.
  const thumbs = (() => {
    const list: string[] = [];
    const seen = new Set<string>();
    const push = (u: string | null | undefined) => {
      if (u && !seen.has(u)) { seen.add(u); list.push(u); }
    };
    if (galleryImages.length > 0) {
      galleryImages.forEach((im) => push(im.url));
    } else {
      push(combo.image_url);
    }
    if (combo.include_product_images) {
      productImagesAll.forEach(push);
    }
    return list;
  })();
  const count = thumbs.length;
  const safeIndex = count > 0 ? ((activeIndex % count) + count) % count : 0;
  const mainImage = thumbs[safeIndex] ?? null;

  const goNext = () => setActiveIndex((i) => (count ? (i + 1) % count : 0));
  const goPrev = () => setActiveIndex((i) => (count ? (i - 1 + count) % count : 0));

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
  };

  // ---- Selección de talla/color por producto (validación de combinaciones) ----
  const variantsOf = (productId: number) =>
    combo.items.find((it) => it.product_id === productId)?.product?.variants ?? [];

  const pickSize = (productId: number, size: string) => {
    setSelections((prev) => {
      const cur = prev[productId] ?? { size: null, color: null };
      const nextSize = cur.size === size ? null : size;
      // Si el color actual ya no existe para la talla elegida, se limpia.
      const colorsForSize = new Set(variantsOf(productId).filter((v) => v.size === nextSize).map((v) => v.color));
      const nextColor = nextSize && cur.color && !colorsForSize.has(cur.color) ? null : cur.color;
      return { ...prev, [productId]: { size: nextSize, color: nextColor } };
    });
  };

  const pickColor = (productId: number, color: string) => {
    setSelections((prev) => {
      const cur = prev[productId] ?? { size: null, color: null };
      const nextColor = cur.color === color ? null : color;
      // Si la talla actual ya no existe para el color elegido, se limpia.
      const sizesForColor = new Set(variantsOf(productId).filter((v) => v.color === nextColor).map((v) => v.size));
      const nextSize = nextColor && cur.size && !sizesForColor.has(cur.size) ? null : cur.size;
      return { ...prev, [productId]: { size: nextSize, color: nextColor } };
    });
  };

  // Variante exacta elegida para un producto (según talla+color), o null.
  const chosenVariant = (productId: number) => {
    const sel = selections[productId] ?? { size: null, color: null };
    const vs = variantsOf(productId);
    if (!sel.size || !sel.color) return null;
    return vs.find((v) => v.size === sel.size && v.color === sel.color) ?? null;
  };

  // ¿Están completas todas las selecciones necesarias? (productos con variantes).
  const missing = combo.items.filter((it) => {
    const vs = it.product?.variants ?? [];
    if (vs.length === 0) return false; // sin variantes: no requiere elección
    const sizes = [...new Set(vs.map((v) => v.size))];
    const colors = [...new Set(vs.map((v) => v.color))];
    const sel = selections[it.product_id] ?? { size: null, color: null };
    if (sizes.length > 0 && !sel.size) return true;
    if (colors.length > 0 && !sel.color) return true;
    return false;
  });
  const allChosen = missing.length === 0;

  // Productos cuya combinación elegida está agotada (stock 0).
  const outOfStockItems = combo.items.filter((it) => {
    const vs = it.product?.variants ?? [];
    if (vs.length === 0) return false;
    const v = chosenVariant(it.product_id);
    return v !== null && v.stock <= 0;
  });
  // Productos cuyo combo pide más unidades de las disponibles.
  const insufficientItems = combo.items.filter((it) => {
    const v = chosenVariant(it.product_id);
    return v !== null && v.stock > 0 && v.stock < it.quantity;
  });
  // Un combo es pedible si todo está elegido y hay stock suficiente.
  const canOrder = allChosen && outOfStockItems.length === 0 && insufficientItems.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/combos" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <ArrowLeftIcon className="h-4 w-4" /> Volver a combos
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galería */}
        <div className="space-y-3">
          <div
            className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 select-none"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {mainImage ? (
              <Image
                src={imageSrc(mainImage)}
                alt={combo.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"><GiftIcon className="h-20 w-20 text-primary-200" /></div>
            )}
            {combo.savings > 0 && (
              <span className="absolute top-3 left-3 bg-primary-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow z-10">
                Ahorra {combo.savings_percent}%
              </span>
            )}
            {mainImage && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Ver imagen en grande"
                className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-gray-700"
              >
                <MagnifyingGlassPlusIcon className="h-5 w-5" />
              </button>
            )}

            {/* Flechas laterales (solo si hay más de una imagen) */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Imagen anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-gray-700 transition-colors"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Imagen siguiente"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-gray-700 transition-colors"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>

                {/* Indicadores (puntos) */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                  {thumbs.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      aria-label={`Ir a la imagen ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${i === safeIndex ? 'w-5 bg-white' : 'w-2 bg-white/60 hover:bg-white/90'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Miniaturas (solo si hay más de una) */}
          {count > 1 && (
            <div className="flex gap-2 flex-wrap">
              {thumbs.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`relative h-16 w-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === safeIndex ? 'border-primary-600' : 'border-transparent hover:border-primary-300'
                  }`}
                >
                  <Image src={imageSrc(url)} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalle */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-block text-xs font-semibold text-primary-300 uppercase tracking-wider">
              Combo especial
            </span>
            {combo.tag && (
              <span
                className="inline-block text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border"
                style={tagBadgeStyle(combo.tag_color)}
              >
                {combo.tag}
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl font-semibold text-primary-700 leading-tight">{combo.name}</h1>
          {combo.description && <p className="text-gray-500 mt-2">{combo.description}</p>}

          {/* Precio */}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary-600 nums">{formatPrice(combo.final_price)}</span>
            {combo.savings > 0 && (
              <span className="text-lg text-gray-400 line-through nums">{formatPrice(combo.original_price)}</span>
            )}
          </div>
          {combo.savings > 0 && (
            <p className="text-emerald-600 font-semibold text-sm mt-1">
              Ahorras {formatPrice(combo.savings)} ({combo.savings_percent}%)
            </p>
          )}

          {/* Productos incluidos */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Incluye {combo.items.length} producto{combo.items.length !== 1 ? 's' : ''}
            </h2>
            <ul className="space-y-3">
              {combo.items.map((it) => {
                const img = it.product ? getImageForColor(it.product.images) : null;
                const vs = it.product?.variants ?? [];
                const sizes = [...new Set(vs.map((v) => v.size))];
                const colors = [...new Set(vs.map((v) => v.color))];
                const sel = selections[it.product_id] ?? { size: null, color: null };
                // Disponibilidad cruzada SOLO con variantes en stock.
                const inStock = vs.filter((v) => v.stock > 0);
                const sizesForColor = sel.color
                  ? new Set(inStock.filter((v) => v.color === sel.color).map((v) => v.size))
                  : new Set(inStock.map((v) => v.size));
                const colorsForSize = sel.size
                  ? new Set(inStock.filter((v) => v.size === sel.size).map((v) => v.color))
                  : new Set(inStock.map((v) => v.color));
                const hasVariants = vs.length > 0;
                // ¿El producto entero está agotado (ninguna variante con stock)?
                const productSoldOut = hasVariants && inStock.length === 0;
                // Variante elegida y su estado de stock.
                const chosen = chosenVariant(it.product_id);
                const chosenSoldOut = chosen !== null && chosen.stock <= 0;
                const chosenInsufficient = chosen !== null && chosen.stock > 0 && chosen.stock < it.quantity;
                return (
                  <li key={it.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-primary-50">
                        {img ? <Image src={imageSrc(img)} alt="" fill sizes="56px" className="object-cover" /> : (
                          <span className="absolute inset-0 flex items-center justify-center"><SparklesIcon className="h-6 w-6 text-primary-300" /></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {it.product ? (
                          <Link href={`/products/${it.product.id}`} className="text-sm font-medium text-gray-800 hover:text-primary-700 truncate block">
                            {it.quantity}× {it.product.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-gray-800">{it.quantity}× Producto</span>
                        )}
                        {productSoldOut && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wide bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                            Se fue volando
                          </span>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatPrice(it.unit_price)} c/u
                          {it.line_savings > 0 && (
                            <span className="text-emerald-600 font-semibold ml-2">ahorras {formatPrice(it.line_savings)}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 nums">{formatPrice(it.line_final)}</span>
                    </div>

                    {/* Selectores de talla/color (solo si el producto tiene variantes) */}
                    {hasVariants && (
                      <div className="mt-3 space-y-2">
                        {sizes.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-gray-500 mb-1">Talla</p>
                            <div className="flex flex-wrap gap-1.5">
                              {sizes.map((s) => {
                                const disabled = !sizesForColor.has(s);
                                const active = sel.size === s;
                                return (
                                  <button key={s} type="button" disabled={disabled}
                                    onClick={() => pickSize(it.product_id, s)}
                                    className={`min-w-[2.2rem] px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                      active ? 'bg-primary-600 text-white border-primary-600'
                                      : disabled ? 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                                      : 'border-gray-200 text-gray-700 hover:border-primary-300'
                                    }`}>
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {colors.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-gray-500 mb-1">Color</p>
                            <div className="flex flex-wrap gap-1.5">
                              {colors.map((col) => {
                                const disabled = !colorsForSize.has(col);
                                const active = sel.color === col;
                                return (
                                  <button key={col} type="button" disabled={disabled}
                                    onClick={() => pickColor(it.product_id, col)}
                                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                      active ? 'bg-primary-600 text-white border-primary-600'
                                      : disabled ? 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                                      : 'border-gray-200 text-gray-700 hover:border-primary-300'
                                    }`}>
                                    {col}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Mensaje de stock para este producto */}
                        {productSoldOut ? (
                          <p className="text-xs text-primary-600">Este producto se fue volando. Vuelve a mirar pronto, puede que ya esté de regreso.</p>
                        ) : chosenSoldOut ? (
                          <p className="text-xs text-primary-600">Esta combinación se fue volando. Elige otra talla o color, o vuelve a mirar pronto.</p>
                        ) : chosenInsufficient ? (
                          <p className="text-xs text-rose-500">
                            Quedan {chosen?.stock} y el combo necesita {it.quantity}. Elige otra combinación.
                          </p>
                        ) : chosen ? (
                          <p className="text-xs text-gray-400">Disponible: quedan {chosen.stock}.</p>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Aviso si faltan elecciones o hay stock insuficiente */}
          {!allChosen ? (
            <p className="mt-4 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Elige talla y color de cada producto para continuar.
            </p>
          ) : !canOrder ? (
            <p className="mt-4 text-xs text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
              Algunas piezas de este combo se fueron volando o quedan pocas unidades. Ajusta las tallas o colores, o vuelve a mirar pronto.
            </p>
          ) : null}

          {/* Agrega el combo (con las tallas y colores elegidos) al carrito, junto a los demás productos */}
          <button
            onClick={() => addCombo(combo, selections, 1)}
            disabled={!canOrder}
            className="mt-5 w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            Agregar al carrito
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">Puedes sumar más productos y pedir todo junto por WhatsApp.</p>
        </div>
      </div>

      {/* Lightbox: imagen a pantalla completa con navegación */}
      {lightboxOpen && mainImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Cerrar */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Cerrar"
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Flechas (si hay más de una) */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Imagen anterior"
                className="absolute left-3 sm:left-6 z-10 h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              >
                <ChevronLeftIcon className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Imagen siguiente"
                className="absolute right-3 sm:right-6 z-10 h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              >
                <ChevronRightIcon className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Imagen (clic en la imagen no cierra; el fondo sí) */}
          <div
            className="relative w-[92vw] h-[85vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <Image src={imageSrc(mainImage)} alt={combo.name} fill sizes="92vw" className="object-contain" />
          </div>

          {/* Contador */}
          {count > 1 && (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
              {safeIndex + 1} / {count}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
