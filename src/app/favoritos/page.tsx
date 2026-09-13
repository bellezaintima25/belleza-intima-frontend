'use client';

import Link from 'next/link';
import { HeartIcon } from '@heroicons/react/24/outline';
import { useFavorites } from '@/context/FavoritesContext';
import ProductCard from '@/components/ProductCard';

export default function FavoritesPage() {
  const { items, count, clear } = useFavorites();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-semibold text-primary-700">Me gusta</h1>
        {count > 0 && (
          <button
            onClick={clear}
            className="text-sm font-medium text-gray-400 hover:text-primary-600 transition-colors"
          >
            Vaciar lista
          </button>
        )}
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <HeartIcon className="h-16 w-16 text-primary-200 mb-4" />
          <p className="text-gray-500 mb-6">Aún no has guardado productos en tu lista de me gusta.</p>
          <Link
            href="/catalogo"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
