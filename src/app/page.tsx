'use client';

import { useEffect, useState, useRef } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
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
import TestimonialForm from '@/components/TestimonialForm';

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

/** Título de sección con separador decorativo */
function SectionTitle({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' }) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <h2 className="font-serif text-2xl font-semibold text-primary-700">{children}</h2>
    </div>
  );
}

/** Sección con fade-in al entrar en el viewport */
function FadeInSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </section>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [specials, setSpecials] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialFormOpen, setTestimonialFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);

  useEffect(() => {
    api.site.hero()
      .then((h) => { if (h) setHero(h); })
      .catch(() => null);
  }, []);

  useEffect(() => {
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
    api.products.onSale()
      .then((p) => setSpecials(p.slice(0, 4)))
      .catch(() => null);
  }, []);

  useEffect(() => {
    api.combos.list()
      .then((c) => setCombos(c.slice(0, 4)))
      .catch(() => null);
  }, []);

  useEffect(() => {
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

      {/* TopBar */}
      <TopBar />

      {/* Categories */}
      <FadeInSection className="max-w-6xl mx-auto px-4 py-14">
        <div className="mb-8">
          <SectionTitle align="center">Explora por categoría</SectionTitle>
        </div>
        <CategoryCarousel categories={categories} />
      </FadeInSection>

      {/* Featured products */}
      <FadeInSection className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <SectionTitle>Los productos más amados</SectionTitle>
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
      </FadeInSection>

      {/* Encantos especiales */}
      {specials.length > 0 && (
        <FadeInSection className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <SectionTitle>Encantos especiales</SectionTitle>
            <Link href="/especiales" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              Ver todo →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {specials.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </FadeInSection>
      )}

      {/* Un mundo de combinaciones */}
      {combos.length > 0 && (
        <FadeInSection className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <SectionTitle>Un mundo de combinaciones</SectionTitle>
            <Link href="/combos" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              Ver todo →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {combos.map((c, i) => (
              <ComboCard key={c.id} combo={c} priority={i < 4} />
            ))}
          </div>
        </FadeInSection>
      )}

      {/* Momentos Belleza Íntima */}
      <FadeInSection className="bg-primary-50/60">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-10">
              <SectionTitle align="center">Momentos Belleza Íntima</SectionTitle>
              <p className="text-gray-500 mt-3">Lo que sienten quienes se atreven a sentirse bien.</p>
            </div>
            {testimonials.length === 0 && (
              <p className="text-center text-gray-500 text-sm mb-6">
                Aún no hay comentarios. ¡Sé la primera en contarnos tu experiencia!
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <figure key={t.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-primary-100/60 p-5 flex flex-col">
                  <div className="flex items-center gap-0.5 mb-3" aria-label={`${t.rating} de 5 estrellas`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <StarIcon key={n} className={`h-4 w-4 ${n <= t.rating ? 'text-amber-400' : 'text-gray-200'}`} aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-gray-600 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</blockquote>
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
            <div className="text-center mt-10">
              <button
                type="button"
                onClick={() => setTestimonialFormOpen(true)}
                className="inline-flex items-center gap-2 bg-white hover:bg-primary-600 text-primary-700 hover:text-white font-semibold px-7 py-3 rounded-full ring-1 ring-primary-200 hover:ring-primary-600 shadow-sm transition-colors"
              >
                <StarIcon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                Cuéntanos tu experiencia
              </button>
            </div>
          </div>
      </FadeInSection>
      <TestimonialForm open={testimonialFormOpen} onClose={() => setTestimonialFormOpen(false)} />

      {/* Brand teaser */}
      <FadeInSection className="bg-primary-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <SectionTitle align="center">Hecho con amor</SectionTitle>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mt-4">
            En Belleza Íntima creemos que cada persona merece sentirse hermosa y segura.
            Seleccionamos cada prenda con cuidado, pensando en la calidad, el detalle y
            tu comodidad.
          </p>
          <Link
            href="/nuestra-marca"
            className="inline-block mt-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-sm hover:shadow-md"
          >
            Conoce más sobre nosotras
          </Link>
        </div>
      </FadeInSection>
    </div>
  );
}
