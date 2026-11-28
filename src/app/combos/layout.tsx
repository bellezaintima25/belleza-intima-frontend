import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Se repite la plantilla para que /combos/[id] también termine en "| Belleza Íntima".
  title: { default: 'Combinaciones', template: '%s | Belleza Íntima' },
  description: 'Combos de lencería pensados para ti, con ahorro. Envíos a toda Colombia.',
  alternates: { canonical: '/combos' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
