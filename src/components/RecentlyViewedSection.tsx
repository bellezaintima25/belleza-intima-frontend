'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/api';

interface Props {
  /** Product IDs to exclude (e.g. the one currently being viewed). */
  excludeIds?: number[];
}

export default function RecentlyViewedSection({ excludeIds = [] }: Props) {
  const { items, enabled } = useRecentlyViewed();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const visible = items.filter((p: Product) => !excludeIds.includes(p.id));

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
  }, [visible.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -(el.clientWidth * 0.75) : el.clientWidth * 0.75, behavior: 'smooth' });
  };

  if (!enabled || visible.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="font-serif text-2xl font-semibold text-primary-700 mb-6">
        Visto recientemente
      </h2>

      {/* Carousel wrapper — arrows are absolute, centered vertically over the cards */}
      <div className="relative group">

        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
                       w-9 h-9 flex items-center justify-center
                       bg-white border border-gray-200 rounded-full shadow-md
                       text-gray-600 hover:text-primary-600 hover:border-primary-400
                       transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Siguiente"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
                       w-9 h-9 flex items-center justify-center
                       bg-white border border-gray-200 rounded-full shadow-md
                       text-gray-600 hover:text-primary-600 hover:border-primary-400
                       transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        )}

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((product: Product) => (
            <div key={product.id} className="flex-shrink-0 w-44 sm:w-52">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
