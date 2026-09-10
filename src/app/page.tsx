'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import type { Product } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { categoryLabel } from '@/lib/format';

const CATEGORIES = [
  { key: 'SET', emoji: '🎀' },
  { key: 'CORSET', emoji: '🖤' },
  { key: 'BODY', emoji: '✨' },
  { key: 'PIJAMA', emoji: '🌙' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.products.list()
      .then((p) => setFeatured(p.slice(0, 4)))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
          <Image src="/logo.svg" alt="Belleza Íntima" width={120} height={120} priority className="mb-6" />
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-primary-700 leading-tight max-w-2xl">
            Lencería que realza tu belleza
          </h1>
          <p className="mt-4 text-gray-500 max-w-lg">
            Sets, corsets y bodies pensados para ti. Elegancia, comodidad y estilo
            en cada prenda. 🌸
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href="/catalogo"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
            >
              Ver catálogo
            </Link>
            <Link
              href="/nuestra-marca"
              className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 font-semibold px-8 py-3 rounded-full transition-colors"
            >
              Nuestra marca
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="font-serif text-2xl font-semibold text-primary-700 text-center mb-8">
          Explora por categoría
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/catalogo?category=${cat.key}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all p-8 flex flex-col items-center gap-3"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
              <span className="font-medium text-gray-700 group-hover:text-primary-700 transition-colors">
                {categoryLabel(cat.key)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-semibold text-primary-700">Destacados</h2>
          <Link href="/catalogo" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Ver todo →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Brand teaser */}
      <section className="bg-primary-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="font-serif text-3xl font-semibold text-primary-700 mb-3">Hecho con amor</h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
            En Belleza Íntima creemos que cada mujer merece sentirse hermosa y segura.
            Seleccionamos cada prenda con cuidado, pensando en la calidad, el detalle y
            tu comodidad.
          </p>
          <Link
            href="/nuestra-marca"
            className="inline-block mt-6 text-primary-700 font-semibold hover:underline"
          >
            Conoce más sobre nosotras →
          </Link>
        </div>
      </section>
    </div>
  );
}
