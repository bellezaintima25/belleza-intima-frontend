'use client';

import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/api';

interface Props {
  /** Product IDs to exclude (e.g. the one currently being viewed). */
  excludeIds?: number[];
}

export default function RecentlyViewedSection({ excludeIds = [] }: Props) {
  const { items, enabled } = useRecentlyViewed();

  if (!enabled) return null;

  const visible = items.filter((p: Product) => !excludeIds.includes(p.id));

  if (visible.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="font-serif text-2xl font-semibold text-primary-700 mb-6">
        Visto recientemente
      </h2>

      {/* Always horizontal scroll — cards are fixed width so they overflow naturally */}
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
        {visible.map((product: Product) => (
          <div key={product.id} className="flex-shrink-0 w-44 sm:w-52">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
