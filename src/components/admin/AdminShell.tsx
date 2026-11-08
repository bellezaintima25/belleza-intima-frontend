'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChartBarIcon,
  TagIcon,
  PhotoIcon,
  GiftIcon,
  ChatBubbleLeftRightIcon,
  ArchiveBoxIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import PendingBadge from '@/components/admin/PendingBadge';
import { adminApi } from '@/lib/adminApi';
import { clearSession, getSession } from '@/lib/auth';
import type { AdminUser } from '@/lib/auth';

const navItems = [
  { href: '/admin', label: 'Panel', Icon: ChartBarIcon },
  { href: '/admin/products', label: 'Productos', Icon: TagIcon },
  { href: '/admin/covers', label: 'Página de inicio', Icon: PhotoIcon },
  { href: '/admin/combos', label: 'Combos', Icon: GiftIcon },
  { href: '/admin/testimonios', label: 'Testimonios', Icon: ChatBubbleLeftRightIcon },
  { href: '/admin/orders', label: 'Pedidos', Icon: ArchiveBoxIcon },
  { href: '/admin/cuenta', label: 'Equipo', Icon: UsersIcon },
];

type Gate = 'checking' | 'ready' | 'error';

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';

  const [gate, setGate] = useState<Gate>('checking');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [attempt, setAttempt] = useState(0);

  const goToLogin = useCallback(
    (expired = false) => {
      clearSession();
      setGate('checking');
      router.replace(expired ? '/admin/login?expired=1' : '/admin/login');
    },
    [router],
  );

  // Antes de mostrar el panel: ¿hay sesión y el servidor la acepta?
  useEffect(() => {
    if (isLogin) return;
    const session = getSession();
    if (!session) {
      goToLogin();
      return;
    }
    setUser(session.user);
    let cancelled = false;
    setGate('checking');
    adminApi.auth
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setGate('ready');
      })
      // Un 401 ya redirige solo (adminApi). Cualquier otro fallo (sin internet, servidor dormido…) se reintenta a mano.
      .catch(() => { if (!cancelled && getSession()) setGate('error'); });
    return () => { cancelled = true; };
  }, [isLogin, attempt, goToLogin]);

  // Mientras el panel está abierto: si la sesión vence o se cierra en otra pestaña, volver al ingreso.
  useEffect(() => {
    if (isLogin) return;
    const check = () => { if (!getSession()) goToLogin(true); };
    const timer = setInterval(check, 30_000);
    window.addEventListener('storage', check);
    return () => { clearInterval(timer); window.removeEventListener('storage', check); };
  }, [isLogin, goToLogin]);

  const logout = () => {
    adminApi.auth.logout();
    setUser(null);
    setGate('checking');
    router.replace('/admin/login');
  };

  // La pantalla de ingreso va sola, sin menú ni cabecera del panel.
  if (isLogin) return <>{children}</>;

  if (gate !== 'ready') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        {gate === 'error' ? (
          <div className="text-center max-w-sm">
            <p className="text-gray-700 font-medium">No se pudo verificar tu sesión.</p>
            <p className="text-gray-400 text-sm mt-1">Revisa tu conexión a internet; si el servidor estaba dormido, puede tardar unos segundos.</p>
            <button
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <p className="text-gray-400 animate-pulse">Verificando tu sesión…</p>
        )}
      </div>
    );
  }

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
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <Link
                href="/admin/cuenta"
                className="hidden sm:block text-sm text-gray-500 hover:text-primary-600 max-w-[10rem] truncate"
                title="Mi cuenta"
              >
                {user.display_name}
              </Link>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-gray-500 hover:text-primary-700 border border-gray-200 hover:border-primary-200 hover:bg-primary-50 text-xs sm:text-sm font-semibold px-3 py-2 rounded-full transition-colors whitespace-nowrap"
              title="Cerrar sesión"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden">Salir</span>
            </button>
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
        </div>
      </header>

      <div className="md:flex">
        {/* Desktop sidebar — fija, llega hasta el fondo; el footer queda por encima */}
        <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col fixed top-14 bottom-0 z-10 shadow-sm">
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                <item.Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {item.label}
                {item.href === '/admin/testimonios' && <PendingBadge />}
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
              className="relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              <item.Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
              {item.href === '/admin/testimonios' && <PendingBadge compact />}
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
