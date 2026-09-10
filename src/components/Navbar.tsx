'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBagIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';

const navLinks = [
  { href: '/', label: 'INICIO' },
  { href: '/catalogo', label: 'CATÁLOGO' },
  { href: '/catalogo?category=BODY', label: 'BODIES' },
  { href: '/catalogo?category=CORSET', label: 'CORSETS' },
  { href: '/catalogo?category=SET', label: 'SETS' },
  { href: '/catalogo?category=PIJAMA', label: 'PIJAMAS' },
  { href: '/catalogo?category=COMBO', label: 'COMBOS' },
  { href: '/nuestra-marca', label: 'NUESTRA MARCA' },
];

export default function Navbar() {
  const { itemCount, openCart } = useCart();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/catalogo?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-primary-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" aria-label="Belleza Íntima — Inicio">
          <Image src="/logo.svg" alt="Belleza Íntima" width={72} height={72} priority />
          <span className="font-serif text-lg font-semibold text-primary-600 tracking-tight hidden xl:block">
            Belleza Íntima
          </span>
        </Link>

        {/* Nav menu — desktop */}
        <nav className="hidden lg:flex items-center gap-5 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-medium tracking-wide text-gray-600 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search + cart */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={submitSearch} className="relative">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
                placeholder="Buscar..."
                className="w-40 sm:w-52 pl-9 pr-8 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setQuery(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Cerrar búsqueda"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              aria-label="Buscar"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
          )}

          {/* Cart */}
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
        </div>
      </div>

      {/* Nav menu — mobile (scrollable row) */}
      <nav className="lg:hidden border-t border-primary-50 overflow-x-auto">
        <div className="flex items-center gap-4 px-4 py-2.5 whitespace-nowrap">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-medium tracking-wide text-gray-600 hover:text-primary-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
