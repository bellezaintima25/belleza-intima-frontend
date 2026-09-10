'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import type { Product } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { categoryLabel } from '@/lib/format';

// Categories to always show as filter pills, even if empty right now.
const FILTER_CATEGORIES = ['SET', 'CORSET', 'BODY', 'PIJAMA', 'COMBO'];

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlCategory = searchParams.get('category');
  const urlQuery = searchParams.get('q') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(urlQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selected = urlCategory;

  // Keep local search in sync when arriving with ?q= from the header
  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  const setSelected = (cat: string | null) => {
    router.push(cat ? `/catalogo?category=${encodeURIComponent(cat)}` : '/catalogo');
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.products.list(selected ?? undefined)
      .then(setProducts)
      .catch(() => setError('No se pudieron cargar los productos. Verifica que el servidor esté corriendo.'))
      .finally(() => setLoading(false));
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl font-semibold text-primary-700 mb-2">
          {selected ? categoryLabel(selected) : 'Nuestra colección'}
        </h1>
        <p className="text-gray-500">Lencería y más, con amor 🌸</p>
      </div>

      {/* Category filter pills */}
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
        {FILTER_CATEGORIES.map((cat) => (
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

      {/* Results count when searching */}
      {search && !loading && (
        <p className="text-sm text-gray-400 mb-4 text-center">
          {filtered.length === 0
            ? `Sin resultados para "${search}"`
            : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} para "${search}"`}
        </p>
      )}

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
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? (
            <p>No encontramos &quot;{search}&quot;.</p>
          ) : selected === 'COMBO' ? (
            <>
              <span className="text-5xl block mb-3">🎁</span>
              <p>Muy pronto tendremos combos de promoción.</p>
            </>
          ) : selected === 'PIJAMA' ? (
            <>
              <span className="text-5xl block mb-3">🌙</span>
              <p>Muy pronto agregaremos pijamas a esta sección.</p>
            </>
          ) : (
            <p>No hay productos en esta categoría.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">Cargando...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
