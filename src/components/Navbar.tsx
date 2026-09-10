'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';

const navLinks = [
  { href: '/', label: 'Catálogo' },
  { href: '/?category=SET', label: 'Sets' },
  { href: '/?category=CORSET', label: 'Corsets' },
  { href: '/?category=BODY', label: 'Bodies' },
  { href: '/?category=PANTY', label: 'Pantys' },
  { href: '/?category=PIJAMA', label: 'Pijamas' },
];

export default function Navbar() {
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-primary-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 h-24 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" aria-label="Belleza Íntima — Inicio">
          <Image src="/logo.svg" alt="Belleza Íntima" width={88} height={88} priority />
          <span className="text-base font-bold text-primary-700 tracking-tight hidden lg:block">
            Belleza Íntima
          </span>
        </Link>

        {/* Nav menu — desktop */}
        <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Cart */}
        <button
          onClick={openCart}
          className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors flex-shrink-0"
          aria-label="Abrir carrito"
        >
          <ShoppingBagIcon className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Nav menu — mobile (scrollable row below header) */}
      <nav className="md:hidden border-t border-primary-50 overflow-x-auto">
        <div className="flex items-center gap-4 px-4 py-2.5 whitespace-nowrap">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
