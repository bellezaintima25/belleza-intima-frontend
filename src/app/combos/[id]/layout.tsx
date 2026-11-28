import type { Metadata } from 'next';
import { absoluteImage, getComboForSeo, shortText } from '@/lib/seo';

type Props = { params: { id: string }; children: React.ReactNode };

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const c = await getComboForSeo(params.id);
  const canonical = `/combos/${params.id}`;
  if (!c) return { title: 'Combo', alternates: { canonical } };

  const image = absoluteImage(c.image_url ?? c.images?.[0]?.url ?? c.items?.[0]?.product?.images?.[0]?.url);
  const description = shortText(c.description, `${c.name}: un combo pensado para ti, con ahorro. Envíos a toda Colombia.`);
  return {
    title: c.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      siteName: 'Belleza Íntima',
      title: c.name,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image, alt: c.name }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: c.name, description, ...(image ? { images: [image] } : {}) },
  };
}

export default function ComboLayout({ children }: Props) {
  return <>{children}</>;
}