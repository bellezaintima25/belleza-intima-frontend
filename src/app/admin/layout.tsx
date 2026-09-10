import Link from 'next/link';
import { ReactNode } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', emoji: '📊' },
  { href: '/admin/products', label: 'Productos', emoji: '👗' },
  { href: '/admin/orders', label: 'Pedidos', emoji: '📦' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col fixed h-full z-10 shadow-sm">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest">Belleza Íntima</p>
          <p className="text-sm font-bold text-gray-700 mt-0.5">Backoffice</p>
        </div>
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
        <div className="px-5 py-4 border-t border-gray-100">
          <Link href="/" className="text-xs text-gray-400 hover:text-primary-500 transition-colors">
            ← Ver tienda
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-bold text-primary-700">Backoffice</p>
          <Link href="/" className="text-xs text-gray-400 hover:text-primary-500">← Tienda</Link>
        </div>
        <nav className="flex border-t border-gray-100">
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
      </header>

      {/* Main content */}
      <div className="md:ml-56 flex-1 min-h-screen">
        {children}
      </div>
    </div>
  );
}
