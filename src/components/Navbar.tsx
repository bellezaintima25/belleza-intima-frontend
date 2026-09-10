'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-primary-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Belleza Íntima — Inicio">
          <Image
            src="/logo.svg"
            alt="Belleza Íntima"
            width={88}
            height={88}
            priority
          />
          <span className="text-base font-bold text-primary-700 tracking-tight hidden sm:block">
            Belleza Íntima
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
            Catálogo
          </Link>
          <button
            onClick={openCart}
            className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
            aria-label="Abrir carrito"
          >
            <ShoppingBagIcon className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
