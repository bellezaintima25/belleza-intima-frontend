'use client';

import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/api';

interface Props {
  /** Product IDs to exclude (e.g. the one currently being viewed). */
  excludeIds?: number[];
}

export default function RecentlyViewedSection({ excludeIds = [] }: Props) {
  const { items } = useRecentlyViewed();

  const visible = items.filter((p: Product) => !excludeIds.includes(p.id));

  if (visible.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="font-serif text-2xl font-semibold text-primary-700 mb-6">
        Visto recientemente
      </h2>

      {/* Horizontal scroll on mobile, wrap on larger screens */}
      <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
        {visible.map((product: Product) => (
          <div key={product.id} className="flex-shrink-0 w-44 sm:w-auto">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
