import { ReactNode } from 'react';
import type { Metadata } from 'next';
import AdminShell from '@/components/admin/AdminShell';

// El panel no debe aparecer en buscadores.
export const metadata: Metadata = {
  title: 'Administración · Belleza Íntima',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  // El menú, la verificación de sesión y el cierre de sesión viven en AdminShell
  // (componente de cliente), porque dependen de la sesión guardada en el navegador.
  return <AdminShell>{children}</AdminShell>;
}
