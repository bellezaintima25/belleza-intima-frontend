import type { Metadata } from 'next';
import { effectivePrice } from '@/lib/api';
import { SITE_URL, absoluteImage, getProductForSeo, shortText } from '@/lib/seo';

type Props = { params: { id: string }; children: React.ReactNode };

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const p = await getProductForSeo(params.id);
  const canonical = `/products/${params.id}`;
  if (!p) return { title: 'Producto', alternates: { canonical } };

  const image = absoluteImage(p.images?.[0]?.url);
  const description = shortText(p.description, p.detail, `${p.name}. Lencería que celebra la mujer que eres. Envíos a toda Colombia.`);
  return {
    title: p.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      siteName: 'Belleza Íntima',
      title: p.name,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image, alt: p.name }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: p.name, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const p = await getProductForSeo(params.id);
  // Datos estructurados: permiten a Google mostrar precio y disponibilidad en los resultados.
  const jsonLd = p && {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.code,
    category: p.category,
    description: shortText(p.detail, p.description, p.name),
    image: (p.images ?? []).map((i) => absoluteImage(i.url)).filter(Boolean),
    brand: { '@type': 'Brand', name: 'Belleza Íntima' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${p.id}`,
      priceCurrency: 'COP',
      price: effectivePrice(p, null),
      availability: (p.variants ?? []).some((v) => v.stock > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // "<" escapado para que un texto del producto nunca pueda cerrar la etiqueta.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      {children}
    </>
  );
}