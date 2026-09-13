'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import type { Product } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import TopBar from '@/components/TopBar';
import CategoryCarousel from '@/components/CategoryCarousel';
import { categoryLabel } from '@/lib/format';

const DEFAULT_CATEGORIES = [
  { key: 'SET', image: '/images/ST005-Azul-claro-1.jpeg' },
  { key: 'CORSET', image: '/images/CT005-Rosa-1.jpeg' },
  { key: 'BODY', image: '/images/ST011-Azul-claro-1.jpeg' },
  { key: 'PIJAMA', image: '/images/ST015-Rojo-1.jpeg' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    // Load admin-managed cover images; fall back to defaults on any error.
    api.categories.covers()
      .then((covers) => {
        if (!covers || covers.length === 0) return;
        const byKey = new Map(covers.map((c) => [c.category, c.image_url]));
        setCategories(
          DEFAULT_CATEGORIES.map((c) => ({
            ...c,
            image: byKey.get(c.key) ?? c.image,
          }))
        );
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    // Prefer admin-selected featured products; fall back to the first few
    // products so the section is never empty if none are marked yet.
    api.products.featured()
      .then((featuredProducts) => {
        if (featuredProducts.length > 0) {
          setFeatured(featuredProducts.slice(0, 4));
          return;
        }
        return api.products.list().then((p) => setFeatured(p.slice(0, 4)));
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="bg-white rounded-3xl shadow-xl ring-1 ring-primary-100/60 px-8 py-10 sm:px-16 sm:py-14 flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16">
            {/* Left: text + actions */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-primary-700 leading-tight max-w-2xl">
                Tu belleza, tu esencia, tu momento.
              </h1>
              <p className="mt-4 text-gray-500 max-w-lg">
                Lencería que celebra la mujer que eres.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
                <Link
                  href="/catalogo"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
                >
                  Comprar ahora
                </Link>
                <Link
                  href="/nuestra-marca"
                  className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 font-semibold px-8 py-3 rounded-full transition-colors"
                >
                  Nuestra marca
                </Link>
              </div>
            </div>

            {/* Right: logo, sized to match the text block */}
            <div className="flex-1 flex justify-center md:justify-end">
              <Image
                src="/logo.svg"
                alt="Belleza Íntima"
                width={420}
                height={420}
                priority
                className="w-56 sm:w-72 md:w-full max-w-sm h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Scene divider — info bar right above the categories */}
      <TopBar />

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="font-serif text-2xl font-semibold text-primary-700 text-center mb-8">
          Explora por categoría
        </h2>
        {/* Mobile: arrow-driven carousel · Desktop: 4-column grid */}
        <CategoryCarousel categories={categories} />
      </section>

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-semibold text-primary-700">Los productos más amados</h2>
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
