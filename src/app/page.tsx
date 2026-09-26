'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import type { Product, HeroContent } from '@/lib/api';
import { resolveHeroColor } from '@/lib/heroPalette';
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

const DEFAULT_HERO: HeroContent = {
  phrases: [
    { text: 'Tu belleza, tu esencia, tu momento.', type: 'title', color: 'primary-700' },
    { text: 'Lencería que celebra la mujer que eres.', type: 'paragraph', color: '' },
  ],
  buttons: [
    { label: 'Comprar ahora', href: '/catalogo', variant: 'primary' },
    { label: 'Nuestra marca', href: '/nuestra-marca', variant: 'secondary' },
  ],
  background: { image_url: '', overlay: 0.35 },
  show_logo: true,
  logo_url: '/logo.svg',
};

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);

  useEffect(() => {
    // Contenido del hero gestionado por el admin; fallback a los valores por defecto.
    api.site.hero()
      .then((h) => { if (h) setHero(h); })
      .catch(() => null);
  }, []);

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
          <div className="relative bg-white rounded-3xl shadow-xl ring-1 ring-primary-100/60 overflow-hidden">
            {/* Imagen de fondo opcional con oscurecido para legibilidad */}
            {hero.background.image_url && (
              <>
                <Image
                  src={hero.background.image_url}
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: hero.background.overlay }}
                  aria-hidden="true"
                />
              </>
            )}

            <div className={`relative px-8 py-10 sm:px-16 sm:py-14 flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16 ${
              hero.background.image_url ? 'text-white' : ''
            }`}>
              {/* Left: frases + botones dinámicos */}
              <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                {hero.phrases.map((p, i) =>
                  p.type === 'title' ? (
                    <h1
                      key={i}
                      className="font-serif text-4xl sm:text-5xl font-semibold leading-tight max-w-2xl"
                      style={{ color: resolveHeroColor(p.color, hero.background.image_url ? '#ffffff' : '#450b3a') }}
                    >
                      {p.text}
                    </h1>
                  ) : (
                    <p
                      key={i}
                      className="mt-4 max-w-lg"
                      style={{ color: resolveHeroColor(p.color, hero.background.image_url ? '#f3f4f6' : '#6b7280') }}
                    >
                      {p.text}
                    </p>
                  )
                )}

                {hero.buttons.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
                    {hero.buttons.map((b, i) =>
                      b.variant === 'primary' ? (
                        <Link
                          key={i}
                          href={b.href}
                          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
                        >
                          {b.label}
                        </Link>
                      ) : (
                        <Link
                          key={i}
                          href={b.href}
                          className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 font-semibold px-8 py-3 rounded-full transition-colors"
                        >
                          {b.label}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Right: logo (ocultable) */}
              {hero.show_logo && (
                <div className="flex-1 flex justify-center md:justify-end">
                  <Image
                    src={hero.logo_url}
                    alt="Belleza Íntima"
                    width={420}
                    height={420}
                    priority
                    className="w-56 sm:w-72 md:w-full max-w-sm h-auto"
                  />
                </div>
              )}
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
