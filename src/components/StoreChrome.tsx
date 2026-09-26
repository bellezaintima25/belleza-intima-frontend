'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

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
      <main>{children}</main>
      <Footer />
    </>
  );
}
