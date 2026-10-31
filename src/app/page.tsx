'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, imageSrc } from '@/lib/api';
import type { Product, HeroContent, Combo, Testimonial } from '@/lib/api';
import HeroFreeView from '@/components/HeroFreeView';
import HeroFlowView from '@/components/HeroFlowView';
import ProductCard from '@/components/ProductCard';
import ComboCard from '@/components/ComboCard';
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
  const [specials, setSpecials] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
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

  useEffect(() => {
    // Productos en descuento para la sección "Encantos especiales".
    api.products.onSale()
      .then((p) => setSpecials(p.slice(0, 4)))
      .catch(() => null);
  }, []);

  useEffect(() => {
    // Combos activos para la sección "Un mundo de combinaciones".
    api.combos.list()
      .then((c) => setCombos(c.slice(0, 4)))
      .catch(() => null);
  }, []);

  useEffect(() => {
    // Testimonios activos para la sección "Momentos Belleza Íntima".
    api.testimonials.list()
      .then((t) => setTestimonials(t.slice(0, 6)))
      .catch(() => null);
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

            {hero.layout === 'free' ? (
              /* ---- Modo libre: lienzo escalado en escritorio, clásico apilado en móvil ---- */
              <>
                <div className="hidden md:block">
                  <HeroFreeView hero={hero} device="desktop" />
                </div>
                <div className="md:hidden">
                  <HeroFreeView hero={hero} device="mobile" />
                </div>
              </>
            ) : (
              <HeroFlowView hero={hero} />
            )}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Encantos especiales (productos en descuento) — solo si hay */}
      {specials.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-semibold text-primary-700">Encantos especiales</h2>
            <Link href="/especiales" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              Ver todo →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {specials.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </section>
      )}

      {/* Un mundo de combinaciones (combos) — solo si hay */}
      {combos.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-semibold text-primary-700">Un mundo de combinaciones</h2>
            <Link href="/combos" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              Ver todo →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {combos.map((c, i) => (
              <ComboCard key={c.id} combo={c} priority={i < 4} />
            ))}
          </div>
        </section>
      )}

      {/* Momentos Belleza Íntima (testimonios) — solo si hay */}
      {testimonials.length > 0 && (
        <section className="bg-primary-50/60">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl font-semibold text-primary-700 mb-2">Momentos Belleza Íntima</h2>
              <p className="text-gray-500">Lo que viven y sienten nuestras clientas.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <figure key={t.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-primary-100/60 p-5 flex flex-col">
                  {/* Estrellas */}
                  <div className="flex items-center gap-0.5 mb-3" aria-label={`${t.rating} de 5 estrellas`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={n <= t.rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
                    ))}
                  </div>
                  {/* Texto */}
                  <blockquote className="text-gray-600 text-sm leading-relaxed flex-1">“{t.text}”</blockquote>
                  {/* Autora */}
                  <figcaption className="mt-4 flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-primary-100 flex-shrink-0 flex items-center justify-center">
                      {t.photo_url ? (
                        <Image src={imageSrc(t.photo_url)} alt={t.customer_name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <span className="text-primary-500 font-serif">{t.customer_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{t.customer_name}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

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
