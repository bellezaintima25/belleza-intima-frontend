import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, categoryLabel } from '@/lib/format';
import { getImageForColor } from '@/lib/api';
import type { Product } from '@/lib/api';

interface Props {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: Props) {
  // Show the first available image (no specific color preference on the card)
  const imageUrl = getImageForColor(product.images);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-shadow"
    >
      {/* Image */}
      <div className="aspect-[3/4] relative bg-gradient-to-br from-primary-50 to-primary-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🌸</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <span className="inline-block text-xs font-semibold text-primary-500 uppercase tracking-wider mb-1">
          {categoryLabel(product.category)}
        </span>
        <h3 className="font-serif text-lg text-gray-800 group-hover:text-primary-700 transition-colors leading-tight">
          {product.name}
        </h3>
        <p className="mt-1 text-primary-600 font-bold">{formatPrice(product.base_price)}</p>
      </div>
    </Link>
  );
}
