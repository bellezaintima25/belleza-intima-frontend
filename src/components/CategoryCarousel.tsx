'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { categoryLabel } from '@/lib/format';

export interface Category {
  key: string;
  image: string;
}

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // A small tolerance avoids flicker from sub-pixel rounding.
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll by ~80% of the visible width for a natural paging feel.
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        type="button"
        onClick={() => scrollByAmount('left')}
        aria-label="Anterior"
        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-opacity ${
          canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      {/* Scroller */}
      <div
        ref={scrollerRef}
        className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth no-scrollbar"
      >
        {categories.map((cat) => (
          <Link
            key={cat.key}
            href={`/catalogo?category=${cat.key}`}
            className="group relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex-shrink-0 w-40 md:w-auto aspect-square snap-start"
          >
            <Image
              src={cat.image}
              alt={categoryLabel(cat.key)}
              fill
              sizes="(max-width: 768px) 160px, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Dark gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/20" />
            {/* Label centered over the photo */}
            <span className="absolute inset-0 flex items-center justify-center p-3 font-serif text-xl sm:text-2xl font-semibold text-white tracking-wide text-center [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
              {categoryLabel(cat.key)}
            </span>
          </Link>
        ))}
      </div>

      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scrollByAmount('right')}
        aria-label="Siguiente"
        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-opacity ${
          canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
