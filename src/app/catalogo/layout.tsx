import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Sets, corsets, bodies y pijamas de lencería. Encuentra tu favorito. Envíos a toda Colombia.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
