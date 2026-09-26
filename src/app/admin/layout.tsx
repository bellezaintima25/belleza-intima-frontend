import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

const navItems = [
  { href: '/admin', label: 'Panel', emoji: '📊' },
  { href: '/admin/products', label: 'Productos', emoji: '👗' },
  { href: '/admin/covers', label: 'Página de inicio', emoji: '🖼️' },
  { href: '/admin/orders', label: 'Pedidos', emoji: '📦' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header superior del panel de administración */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <Image src="/logo.svg" alt="Belleza Íntima" width={36} height={36} className="h-9 w-9 flex-shrink-0" />
            <span className="flex items-baseline gap-2 min-w-0">
              <span className="font-serif text-lg font-semibold text-primary-600 truncate">Belleza Íntima</span>
              <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-widest text-primary-400 bg-primary-50 px-2 py-0.5 rounded-full">
                Administración
              </span>
            </span>
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full shadow-sm transition-colors whitespace-nowrap"
            title="Abrir la tienda en una pestaña nueva"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l1.5-5h15L21 9" />
              <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z" />
              <path d="M9 13h6" />
            </svg>
            <span className="hidden sm:inline">Ver tienda</span>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current opacity-80" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 5h5v5" />
              <path d="M19 5l-8 8" />
              <path d="M19 14v5H5V5h5" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="md:flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col fixed h-[calc(100%-3.5rem)] z-10 shadow-sm">
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                <span>{item.emoji}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile nav bar */}
        <nav className="md:hidden flex bg-white border-b border-gray-100 shadow-sm sticky top-[3.25rem] z-20">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              <span className="text-base">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Main content */}
        <div className="md:ml-56 flex-1 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
}
