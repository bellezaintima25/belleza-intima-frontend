'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { formatPrice, categoryLabel } from '@/lib/format';
import { getImageForColor } from '@/lib/api';
import type { Product } from '@/lib/api';
import { useFavorites } from '@/context/FavoritesContext';

interface Props {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: Props) {
  // Show the first available image (no specific color preference on the card)
  const imageUrl = getImageForColor(product.images);
  const { isFavorite, toggle } = useFavorites();
  const favorite = isFavorite(product.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    // The card is a <Link>; prevent navigation when tapping the heart.
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-shadow"
    >
      {/* Image */}
      <div className="aspect-[3/4] relative bg-gradient-to-br from-primary-50 to-primary-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🌸</span>
          </div>
        )}

        {/* Favorite (me gusta) button — top-right */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? 'Quitar de me gusta' : 'Agregar a me gusta'}
          title={favorite ? 'Quitar de me gusta' : 'Agregar a me gusta'}
          className="absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-white/85 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition-colors"
        >
          {favorite ? (
            <HeartSolid className="h-5 w-5 text-primary-600" />
          ) : (
            <HeartOutline className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>
      <div className="p-4">
        <span className="inline-block text-xs font-semibold text-primary-200 uppercase tracking-wider mb-1">
          {categoryLabel(product.category)}
        </span>
        <h3 className="font-serif text-lg text-gray-800 group-hover:text-primary-700 transition-colors leading-tight">
          {product.name}
        </h3>
        <p className="mt-1 text-primary-600 font-bold nums">{formatPrice(product.base_price)}</p>
      </div>
    </Link>
  );
}
