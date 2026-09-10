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

  // Update arrow visibility whenever scroll position or items change
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
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!enabled || visible.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-semibold text-primary-700">
          Visto recientemente
        </h2>

        {/* Arrow buttons — only show when there's something to scroll */}
        {(canScrollLeft || canScrollRight) && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Anterior"
              className={`p-2 rounded-full border transition-colors ${
                canScrollLeft
                  ? 'border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600'
                  : 'border-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Siguiente"
              className={`p-2 rounded-full border transition-colors ${
                canScrollRight
                  ? 'border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600'
                  : 'border-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable container — native scrollbar hidden via CSS */}
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
    </section>
  );
}
