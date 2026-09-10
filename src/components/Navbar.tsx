'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
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
  const [menuOpen, setMenuOpen] = useState(false);
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
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMenuOpen(true)}
          className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-primary-600 transition-colors"
          aria-label="Abrir menú"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

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
          {searchOpen ? (
            <form onSubmit={submitSearch} className="relative">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
                placeholder="Buscar..."
                className="w-36 sm:w-52 pl-9 pr-8 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
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

      {/* Mobile menu — slide-in drawer */}
      {/* Overlay */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* Drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-72 max-w-[80%] bg-white z-50 shadow-2xl transform transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Belleza Íntima" width={40} height={40} />
            <span className="font-serif text-base font-semibold text-primary-600">Belleza Íntima</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar menú"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col py-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-5 py-3 text-sm font-medium tracking-wide text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors border-b border-gray-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
