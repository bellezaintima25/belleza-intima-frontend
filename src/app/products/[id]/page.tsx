'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingBagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { api, getImageForColor } from '@/lib/api';
import type { Product, ProductVariant } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import { formatPrice, categoryLabel } from '@/lib/format';
import RecentlyViewedSection from '@/components/RecentlyViewedSection';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, items } = useCart();
  const { trackProduct } = useRecentlyViewed();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

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

  const price = selectedVariant?.price ?? product.base_price;

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
              <Image
                src={displayImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl">🌸</span>
              </div>
            )}
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
          <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
            {categoryLabel(product.category)}
          </span>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-primary-700">{product.name}</h1>
          <p className="mt-1 text-2xl font-bold text-primary-600">{formatPrice(price)}</p>

          {product.description && (
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Talla</p>
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
            className={`mt-4 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold transition-all ${
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
        </div>
      </div>
    </div>

    <RecentlyViewedSection excludeIds={product ? [product.id] : []} />
    </>
  );
}
