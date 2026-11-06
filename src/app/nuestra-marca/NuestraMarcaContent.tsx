'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const values = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    title: 'Calidad',
    description: 'Cada prenda pasa por una selección cuidadosa. Buscamos telas, acabados y diseños que se sientan tan bien como se ven.',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    color: 'text-rose-400',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
    title: 'Cercanía',
    description: 'Estamos contigo en cada paso. Atención personalizada por WhatsApp, desde que eliges hasta que recibes tu pedido.',
    bg: 'bg-primary-50',
    border: 'border-primary-100',
    color: 'text-primary-400',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
    title: 'Estilo',
    description: 'Diseños que celebran quien eres. Prendas que no solo se usan: se sienten, se viven y te hacen brillar.',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    color: 'text-amber-400',
  },
];

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

export default function NuestraMarcaContent() {
  return (
    <div>
      {/* Hero — sin fade para que aparezca de inmediato */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center flex flex-col items-center">
          <Image src="/logo.svg" alt="Belleza Íntima" width={260} height={260} className="mb-8 drop-shadow-md" />
          <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-primary-700 leading-tight">
            Belleza Íntima
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-xl leading-relaxed">
            Más que lencería: una experiencia pensada para que cada persona
            se sienta hermosa, cómoda y completamente segura de sí misma.
          </p>
        </div>
      </section>

      {/* Quiénes somos + Promesa */}
      <FadeInSection className="max-w-3xl mx-auto px-4 py-14">
        <div className="flex flex-col sm:flex-row gap-8">
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-semibold text-primary-700 mb-3">Quiénes somos</h2>
            <p className="text-gray-600 leading-relaxed">
              Belleza Íntima nació con un propósito claro: ofrecer lencería de calidad
              que combine elegancia, comodidad y estilo. Cada prenda es seleccionada
              con dedicación, pensando en resaltar lo mejor de cada persona.
            </p>
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-semibold text-primary-700 mb-3">Nuestra promesa</h2>
            <p className="text-gray-600 leading-relaxed">
              Queremos que cada compra sea una experiencia agradable y cercana.
              Desde que eliges tu prenda hasta que la recibes, estamos aquí
              para acompañarte con atención real y personalizada.
            </p>
          </div>
        </div>
      </FadeInSection>

      {/* Frase inspiradora */}
      <FadeInSection className="bg-primary-600">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-snug">
            &ldquo;Tu belleza, tu esencia,<br className="hidden sm:block" /> tu momento.&rdquo;
          </p>
        </div>
      </FadeInSection>

      {/* Valores */}
      <FadeInSection className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl font-semibold text-primary-700 text-center mb-10">
          Lo que nos mueve
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {values.map((v) => (
            <div
              key={v.title}
              className={`${v.bg} ${v.border} border rounded-3xl p-8 flex flex-col items-center text-center shadow-sm`}
            >
              <span className={`${v.color} mb-5`}>{v.icon}</span>
              <h3 className="font-serif text-xl font-semibold text-gray-800 mb-3">{v.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{v.description}</p>
            </div>
          ))}
        </div>
      </FadeInSection>

      {/* CTA */}
      <FadeInSection className="bg-primary-50">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <h2 className="font-serif text-2xl font-semibold text-primary-700 mb-3">
            ¿Lista para sentirte bien?
          </h2>
          <p className="text-gray-500 mb-8">
            Explora nuestra colección y encuentra la prenda que te haga brillar.
          </p>
          <Link
            href="/catalogo"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-10 py-3 rounded-full transition-colors shadow-sm hover:shadow-md"
          >
            Ver colección
          </Link>
        </div>
      </FadeInSection>
    </div>
  );
}
