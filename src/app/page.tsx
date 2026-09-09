'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { categoryLabel } from '@/lib/format';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.products.categories()
      .then(setCategories)
      .catch(() => null);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.products.list(selected ?? undefined)
      .then(setProducts)
      .catch(() => setError('No se pudieron cargar los productos. Verifica que el servidor esté corriendo.'))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Nuestra colección</h1>
        <p className="text-gray-500">Lencería y más, con amor 🌸</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setSelected(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
            selected === null
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
          }`}
        >
          Todo
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              selected === cat
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
            }`}
          >
            {categoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-400">
          <p>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No hay productos en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
