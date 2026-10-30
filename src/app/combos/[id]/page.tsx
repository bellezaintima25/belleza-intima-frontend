'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api, getImageForColor, imageSrc } from '@/lib/api';
import type { Combo } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export default function ComboDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [combo, setCombo] = useState<Combo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Para el gesto de swipe en móvil.
  const touchStartX = useRef<number | null>(null);
  // Selecciones de talla/color por producto del combo (clave = product_id).
  const [selections, setSelections] = useState<Record<number, { size: string | null; color: string | null }>>({});
  // Datos del cliente para crear el pedido real.
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // Modal de datos de contacto (se pide DESPUÉS de pulsar "Pedir").
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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

  // Paso 1: abre el modal de contacto (solo valida que haya selecciones).
  const openCheckout = () => {
    setFormError(null);
    setCheckoutOpen(true);
  };

  // Paso 2: valida los datos de contacto y crea el pedido. Si algo falla, el
  // modal permanece abierto y las selecciones del combo NO se pierden.
  const submitOrder = async () => {
    if (!combo) return;
    setFormError(null);

    // Validación: nombre y apellido (al menos dos palabras de 2+ letras).
    const words = name.trim().split(/\s+/).filter((w) => w.length >= 2);
    if (words.length < 2) {
      setFormError('Ingresa tu nombre y apellido (al menos dos palabras).');
      return;
    }
    // Validación: celular de 10 dígitos.
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setFormError('Ingresa un número de celular válido de 10 dígitos.');
      return;
    }

    setSending(true);
    try {
      const payload = combo.items
        .filter((it) => (it.product?.variants?.length ?? 0) > 0)
        .map((it) => ({
          product_id: it.product_id,
          size: selections[it.product_id]?.size ?? null,
          color: selections[it.product_id]?.color ?? null,
        }));
      const { order_id, token, whatsapp_url } = await api.combos.order(combo.id, {
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        selections: payload,
      });
      // Abre WhatsApp con el pedido listo y lleva a la página de éxito.
      window.open(whatsapp_url, '_blank');
      const tokenQs = token ? `&token=${encodeURIComponent(token)}` : '';
      router.push(`/checkout/success?order=${order_id}${tokenQs}`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No se pudo crear el pedido. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

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
        <span className="text-5xl block mb-4">🎁</span>
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
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-7xl">🎁</span></div>
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
          <span className="inline-block text-xs font-semibold text-primary-300 uppercase tracking-wider mb-1">
            Combo especial
          </span>
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
                          <span className="absolute inset-0 flex items-center justify-center text-xl">🌸</span>
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
                          <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                            Agotado
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
                          <p className="text-xs text-rose-500">Este producto está agotado por ahora.</p>
                        ) : chosenSoldOut ? (
                          <p className="text-xs text-rose-500">Sin stock en esta combinación. Elige otra talla o color.</p>
                        ) : chosenInsufficient ? (
                          <p className="text-xs text-rose-500">
                            Quedan {chosen?.stock} y el combo necesita {it.quantity}. Elige otra combinación.
                          </p>
                        ) : chosen ? (
                          <p className="text-xs text-gray-400">Disponible ({chosen.stock} en stock).</p>
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
            <p className="mt-4 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              Hay productos sin stock suficiente. Ajusta las tallas o colores para poder pedir el combo.
            </p>
          ) : null}

          {/* Botón: abre el modal de contacto (las selecciones se conservan) */}
          <button
            onClick={openCheckout}
            disabled={!canOrder}
            className="mt-5 w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Pedir este combo por WhatsApp
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/>
            </svg>
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">Elegirás tus datos de contacto en el siguiente paso.</p>
        </div>
      </div>

      {/* Modal de datos de contacto (se abre tras pulsar "Pedir") */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Fondo */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !sending && setCheckoutOpen(false)}
            aria-hidden="true"
          />
          {/* Tarjeta */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Datos de contacto"
            className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 m-0 sm:m-4"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-gray-800">Tus datos de contacto</h2>
              <button
                onClick={() => !sending && setCheckoutOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Tu selección del combo se mantiene. Solo faltan tus datos para enviar el pedido.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="combo-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre y apellido</label>
                <input
                  id="combo-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Ej: María García"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <div>
                <label htmlFor="combo-phone" className="block text-sm font-medium text-gray-700 mb-1">Tu teléfono / WhatsApp</label>
                <input
                  id="combo-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="Ej: 3001234567"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <p className="text-xs text-gray-400 mt-1">Número de celular de 10 dígitos.</p>
              </div>

              {formError && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
              )}

              <button
                onClick={submitOrder}
                disabled={sending}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {sending ? 'Creando pedido…' : 'Enviar pedido por WhatsApp'}
              </button>
              <button
                onClick={() => !sending && setCheckoutOpen(false)}
                className="w-full text-sm font-semibold text-gray-500 hover:text-gray-700 py-1"
              >
                Volver a la selección
              </button>
            </div>
          </div>
        </div>
      )}

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
