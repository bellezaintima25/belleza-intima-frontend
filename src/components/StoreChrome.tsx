'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

function ParallaxWatermark() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      // Movimiento muy leve — casi fijo pero con vida
      const offset = window.scrollY * 0.04;
      ref.current.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-[-1] overflow-hidden"
      style={{ top: '80px', bottom: '0', left: '0', right: '0' }}
      aria-hidden="true"
    >
      <div ref={ref} className="absolute -left-48 -top-10 will-change-transform">
        <Image
          src="/logo.svg"
          alt=""
          width={900}
          height={900}
          className="opacity-[0.018] select-none"
          priority={false}
        />
      </div>
    </div>
  );
}

/**
 * Envoltorio que decide qué "chrome" mostrar según la ruta:
 * - En el panel de administración (/admin) NO se muestra el Navbar de la tienda
 *   ni el carrito, y el Footer es una versión reducida (marca, derechos y
 *   volver arriba). El admin tiene su propio header.
 * - En el resto del sitio se muestra el Navbar, el carrito y el Footer completo.
 */
export default function StoreChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isHome = pathname === '/';

  if (isAdmin) {
    return (
      <>
        <main>{children}</main>
        <Footer compact />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="relative">
        {!isHome && <ParallaxWatermark />}
        <div className="relative z-10">{children}</div>
      </main>
      <Footer />
    </>
  );
}
