'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingBagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { api, getImageForColor } from '@/lib/api';
import type { Product, ProductVariant } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import { formatPrice, categoryLabel } from '@/lib/format';
import SizeGuide from '@/components/SizeGuide';
import RecentlyViewedSection from '@/components/RecentlyViewedSection';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, items } = useCart();
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { trackProduct } = useRecentlyViewed();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  // Lightbox / zoom de la imagen principal
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Nivel de zoom (1 = ajustado a pantalla). Se controla con la rueda del ratón.
  const [zoom, setZoom] = useState(1);
  // Contenedor scrollable del lightbox, para centrar el zoom en el cursor.
  const zoomScrollRef = useRef<HTMLDivElement | null>(null);
  // Imagen del lightbox y su ancho "ajustado" (object-contain) a zoom 1,
  // que sirve de base para que el primer paso de zoom sea suave.
  const zoomImgRef = useRef<HTMLImageElement | null>(null);
  const fittedWidthRef = useRef<number>(0);
  // Estado del arrastre (pan) con el ratón. En refs para no re-renderizar en
  // cada movimiento; `dragMoved` distingue un arrastre real de un clic simple.
  const dragState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  }>({ active: false, startX: 0, startY: 0, startScrollLeft: 0, startScrollTop: 0 });
  const dragMoved = useRef(false);

  useEffect(() => {
    api.products.get(Number(id))
      .then((p) => {
        setProduct(p);
        trackProduct(p);
        const variants = p.variants ?? [];
        const sizes = [...new Set(variants.map((v) => v.size))];
        const colors = [...new Set(variants.map((v) => v.color))];
        const autoSize = sizes.length === 1 ? sizes[0] : null;
        const autoColor = colors.length === 1 ? colors[0] : null;
        setSelectedSize(autoSize);
        setSelectedColor(autoColor);
        if (autoSize && autoColor) {
          const match = variants.find((v) => v.size === autoSize && v.color === autoColor) ?? null;
          setSelectedVariant(match);
        }
        setActiveImage(getImageForColor(p.images, autoColor));
      })
      .catch(() => setError('Producto no encontrado.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Cerrar el lightbox con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  // Al cerrar el lightbox, reiniciar el zoom.
  useEffect(() => {
    if (!lightboxOpen) setZoom(1);
  }, [lightboxOpen]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <div className="aspect-[3/4] bg-gray-200 rounded-2xl" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg" />)}
            </div>
          </div>
          <div className="space-y-4 py-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
        <p>{error ?? 'Producto no encontrado.'}</p>
        <button onClick={() => router.back()} className="mt-4 text-primary-600 hover:underline">
          ← Volver
        </button>
      </div>
    );
  }

  const variants = product.variants ?? [];
  const sizes = [...new Set(variants.map((v) => v.size))];
  const colors = [...new Set(variants.map((v) => v.color))];

  // Which sizes are valid for the currently selected color (and vice versa)?
  const validSizesForColor = (color: string | null): Set<string> => {
    if (!color) return new Set(sizes);
    return new Set(variants.filter((v) => v.color === color).map((v) => v.size));
  };

  const validColorsForSize = (size: string | null): Set<string> => {
    if (!size) return new Set(colors);
    return new Set(variants.filter((v) => v.size === size).map((v) => v.color));
  };

  const availableSizes = validSizesForColor(selectedColor);
  const availableColors = validColorsForSize(selectedSize);

  const findVariant = (size: string | null, color: string | null) => {
    if (!size || !color) return null;
    return variants.find((v) => v.size === size && v.color === color) ?? null;
  };

  const handleSizeSelect = (size: string) => {
    // Clicking the already-selected size deselects it
    if (selectedSize === size) {
      setSelectedSize(null);
      setSelectedVariant(null);
      return;
    }
    // If this size isn't valid for the current color, clear the color
    const colorsForSize = validColorsForSize(size);
    const newColor = selectedColor && colorsForSize.has(selectedColor) ? selectedColor : null;
    setSelectedSize(size);
    setSelectedColor(newColor);
    setSelectedVariant(findVariant(size, newColor));
    if (newColor) {
      const img = getImageForColor(product.images, newColor);
      if (img) setActiveImage(img);
    }
  };

  const handleColorSelect = (color: string) => {
    // Clicking the already-selected color deselects it
    if (selectedColor === color) {
      setSelectedColor(null);
      setSelectedVariant(null);
      return;
    }
    // If this color isn't valid for the current size, clear the size
    const sizesForColor = validSizesForColor(color);
    const newSize = selectedSize && sizesForColor.has(selectedSize) ? selectedSize : null;
    setSelectedColor(color);
    setSelectedSize(newSize);
    setSelectedVariant(findVariant(newSize, color));
    const img = getImageForColor(product.images, color);
    if (img) setActiveImage(img);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem(product, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  // Zoom con la rueda del ratón, centrado en la posición del cursor.
  // Mantiene bajo el cursor el mismo punto de la imagen al acercar/alejar.
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 4;
  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = zoomScrollRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    // Posición del cursor relativa al área visible.
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Punto del contenido bajo el cursor, como fracción (0..1) del total actual.
    const fracX =
      container.scrollWidth > 0
        ? (container.scrollLeft + cursorX) / container.scrollWidth
        : 0.5;
    const fracY =
      container.scrollHeight > 0
        ? (container.scrollTop + cursorY) / container.scrollHeight
        : 0.5;

    // Nuevo nivel de zoom. El factor es proporcional a la magnitud del desliz
    // para que funcione bien tanto con rueda de ratón (deltaY grande, ~100) como
    // con trackpad de portátil (deltaY pequeño y muchos eventos).
    // Normalizamos el modo de desplazamiento (línea vs pixel).
    const unit = e.deltaMode === 1 ? 16 : 1; // 1 = líneas -> ~16px
    const delta = e.deltaY * unit;
    // Coeficiente pequeño = incrementos suaves y graduales (cada paso pequeño).
    const SENSITIVITY = 0.0009;
    const factor = Math.exp(-delta * SENSITIVITY);
    const nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * factor));
    if (Math.abs(nextZoom - zoom) < 0.0005) return;

    // Al arrancar el zoom desde el estado ajustado (object-contain), medimos el
    // ancho renderizado real de la imagen para usarlo como base. Así el primer
    // paso agranda solo un poco respecto al tamaño ajustado, sin brinco.
    if (zoom <= 1 && zoomImgRef.current) {
      fittedWidthRef.current = zoomImgRef.current.getBoundingClientRect().width;
    }

    // Predecimos con precisión las dimensiones del contenido tras el zoom, a
    // partir del tamaño AJUSTADO real de la imagen (fittedWidth) y del nuevo
    // nivel. Así el centrado es exacto y la imagen no "se va" hacia un lado al
    // empezar a ampliar.
    const imgRect = zoomImgRef.current?.getBoundingClientRect();
    const fitted = fittedWidthRef.current || (imgRect ? imgRect.width : container.clientWidth);
    const aspect = imgRect && imgRect.width > 0 ? imgRect.height / imgRect.width : 1;
    const predImgW = fitted * nextZoom;
    const predImgH = predImgW * aspect;
    const predScrollW = Math.max(container.clientWidth, predImgW);
    const predScrollH = Math.max(container.clientHeight, predImgH);

    setZoom(nextZoom);

    // Punto objetivo bajo el cursor. Cuando el contenido apenas supera al
    // contenedor (primeros pasos), el margen desplazable es pequeño y el
    // resultado queda esencialmente centrado; conforme crece, sigue al cursor.
    const targetLeft = Math.max(0, Math.min(predScrollW - container.clientWidth, fracX * predScrollW - cursorX));
    const targetTop = Math.max(0, Math.min(predScrollH - container.clientHeight, fracY * predScrollH - cursorY));
    requestAnimationFrame(() => {
      const c = zoomScrollRef.current;
      if (!c) return;
      c.scrollLeft = targetLeft;
      c.scrollTop = targetTop;
    });
  };

  // --- Arrastre (pan) con el ratón cuando hay zoom -------------------- //
  // Guardamos el estado del arrastre en refs (declaradas arriba, antes de los
  // returns condicionales, para respetar las reglas de los hooks).
  const handlePanStart = (e: React.MouseEvent<HTMLDivElement>) => {
    const c = zoomScrollRef.current;
    if (!c || zoom <= 1) return; // solo se arrastra cuando hay zoom
    if (e.button !== 0) return; // solo botón izquierdo
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: c.scrollLeft,
      startScrollTop: c.scrollTop,
    };
    dragMoved.current = false;
  };

  const handlePanMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const s = dragState.current;
    const c = zoomScrollRef.current;
    if (!s.active || !c) return;
    e.preventDefault();
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true;
    // Arrastrar en la dirección deseada: mover el ratón a la derecha desplaza
    // el contenido hacia la derecha (scrollLeft disminuye).
    c.scrollLeft = s.startScrollLeft - dx;
    c.scrollTop = s.startScrollTop - dy;
  };

  const handlePanEnd = () => {
    dragState.current.active = false;
  };

  // Cierra el visor si el clic cae en la zona negra FUERA de la imagen, dejando
  // un margen de tolerancia alrededor de la imagen para evitar cierres
  // accidentales cuando se hace clic cerca del borde.
  const CLOSE_MARGIN_PX = 28;
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    // Un arrastre no debe interpretarse como intento de cerrar.
    if (dragMoved.current) {
      dragMoved.current = false;
      return;
    }
    const img = zoomImgRef.current;
    if (!img) {
      setLightboxOpen(false);
      return;
    }
    const r = img.getBoundingClientRect();
    const outside =
      e.clientX < r.left - CLOSE_MARGIN_PX ||
      e.clientX > r.right + CLOSE_MARGIN_PX ||
      e.clientY < r.top - CLOSE_MARGIN_PX ||
      e.clientY > r.bottom + CLOSE_MARGIN_PX;
    if (outside) setLightboxOpen(false);
  };

  const price = selectedVariant?.price ?? product.base_price;

  // Whether this product is in the user's favorites (me gusta)
  const favorite = isFavorite(product.id);

  // How many of this variant are already in the cart
  const qtyInCart = items.find((i) => i.variant.id === selectedVariant?.id)?.quantity ?? 0;
  const canAddMore = selectedVariant ? qtyInCart < selectedVariant.stock : false;
  // Always show all images in the gallery — highlight color-matched ones
  const galleryImages = product.images;
  const displayImage = activeImage ?? getImageForColor(product.images, selectedColor);

  // Determine add-to-cart button state
  const bothSelected = selectedSize !== null && selectedColor !== null;
  const combinationInvalid = bothSelected && !selectedVariant;
  const outOfStock = selectedVariant !== null && selectedVariant.stock === 0;

  return (
    <>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver al catálogo
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image gallery */}
        <div className="flex flex-col gap-3">
          <div className="aspect-[3/4] relative bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl overflow-hidden">
            {displayImage ? (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group absolute inset-0 w-full h-full cursor-zoom-in"
                aria-label="Ampliar imagen"
              >
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                />
                {/* Indicador de ampliar (zoom) */}
                <span className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-white/85 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-600 group-hover:text-primary-600 transition-colors">
                  <MagnifyingGlassPlusIcon className="h-5 w-5" />
                </span>
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl">🌸</span>
              </div>
            )}

            {/* Favoritos (me gusta) — encima de la imagen, esquina superior derecha */}
            <button
              type="button"
              onClick={() => toggleFavorite(product)}
              aria-pressed={favorite}
              aria-label={favorite ? 'Quitar de me gusta' : 'Agregar a me gusta'}
              title={favorite ? 'Quitar de me gusta' : 'Agregar a me gusta'}
              className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-white/85 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              {favorite ? (
                <HeartSolid className="h-6 w-6 text-primary-600" />
              ) : (
                <HeartOutline className="h-6 w-6 text-gray-500" />
              )}
            </button>
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img) => {
                const isColorMatch = !selectedColor || !img.color || img.color.toLowerCase() === selectedColor.toLowerCase();
                return (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.url)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === img.url
                        ? 'border-primary-500'
                        : 'border-transparent hover:border-primary-300'
                    } ${!isColorMatch ? 'opacity-35' : ''}`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${img.color ?? ''}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-primary-200 uppercase tracking-wider">
            {categoryLabel(product.category)}
          </span>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-primary-700">{product.name}</h1>
          <p className="mt-1 text-2xl font-bold text-primary-600 nums">{formatPrice(price)}</p>

          {product.description && (
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Talla</p>
                <SizeGuide />
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isAvailable = availableSizes.has(size);
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => isAvailable && handleSizeSelect(size)}
                      disabled={!isAvailable}
                      title={!isAvailable ? 'No disponible en este color' : undefined}
                      className={`relative px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600'
                          : isAvailable
                          ? 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'
                          : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color selector */}
          {colors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const isAvailable = availableColors.has(color);
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => isAvailable && handleColorSelect(color)}
                      disabled={!isAvailable}
                      title={!isAvailable ? 'No disponible en esta talla' : undefined}
                      className={`relative px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600'
                          : isAvailable
                          ? 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'
                          : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status message */}
          <div className="mt-3 text-sm min-h-[20px]">
            {outOfStock && (
              <p className="text-red-400">Sin stock en esta combinación.</p>
            )}
            {combinationInvalid && (
              <p className="text-gray-400">Esta combinación no está disponible.</p>
            )}
            {selectedVariant && !outOfStock && (
              <p className="text-gray-400">
                Stock disponible: {selectedVariant.stock} unidad{selectedVariant.stock !== 1 ? 'es' : ''}
              </p>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || outOfStock || !canAddMore}
            className={`mt-4 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold transition-all ${
              added
                ? 'bg-green-500 text-white'
                : selectedVariant && !outOfStock && canAddMore
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBagIcon className="h-5 w-5" />
            {added
              ? '¡Agregado! ✓'
              : outOfStock
              ? 'Sin stock'
              : !canAddMore && selectedVariant
              ? `Máximo en carrito (${selectedVariant.stock})`
              : selectedVariant
              ? 'Agregar al carrito'
              : 'Selecciona talla y color'}
          </button>

          {/* Breve descripción del producto */}
          {product.detail && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.detail}</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Lightbox / zoom de la imagen */}
    {lightboxOpen && displayImage && (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Imagen ampliada"
        onClick={handleBackdropClick}
      >
        {/* Cerrar */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
          className="absolute top-4 right-4 z-10 h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Área scrollable con la imagen. El zoom se controla con la rueda del
            ratón; al ampliar, la imagen crece en tamaño real (no con transform)
            y se muestra como bloque dentro del contenedor con overflow-auto, de
            modo que el scroll llegue a los cuatro bordes (incluido el izquierdo). */}
        <div
          ref={zoomScrollRef}
          className={`lightbox-scroll w-full h-full max-w-6xl max-h-[92vh] mx-auto overflow-auto select-none grid place-items-center ${
            zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onWheel={handleWheelZoom}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
          onClick={handleBackdropClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={zoomImgRef}
            src={displayImage}
            alt={product.name}
            className={`select-none ${
              zoom > 1
                ? 'block max-w-none'
                : 'max-h-[92vh] max-w-full w-auto h-auto object-contain'
            }`}
            style={
              zoom > 1
                ? {
                    // El ancho se basa en el tamaño AJUSTADO real de la imagen
                    // multiplicado por el nivel de zoom, de modo que el primer
                    // paso solo agranda un poco (sin brinco desde "contain").
                    width:
                      fittedWidthRef.current > 0
                        ? `${fittedWidthRef.current * zoom}px`
                        : `${zoom * 100}%`,
                    height: 'auto',
                    maxWidth: 'none',
                    // Transición suave: el zoom crece/decrece de forma
                    // progresiva y gradual entre niveles.
                    transition: 'width 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }
                : undefined
            }
            draggable={false}
          />
        </div>

        {/* Ayuda */}
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs pointer-events-none">
          {zoom > 1
            ? `Zoom ${zoom.toFixed(1)}× · rueda o trackpad para acercar/alejar · clic y arrastra para mover`
            : 'Usa la rueda del ratón o el trackpad sobre la imagen para acercar'}
        </p>
      </div>
    )}

    <RecentlyViewedSection excludeIds={product ? [product.id] : []} />
    </>
  );
}
