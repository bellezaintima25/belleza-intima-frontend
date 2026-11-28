import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Especiales',
  description: 'Productos de lencería con descuento por tiempo limitado.',
  alternates: { canonical: '/especiales' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
