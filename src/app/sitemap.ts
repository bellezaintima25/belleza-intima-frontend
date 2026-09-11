import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://belleza-intima-frontend.vercel.app';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface Product {
  id: number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/catalogo`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/nuestra-marca`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Category routes
  const categories = ['SET', 'CORSET', 'BODY', 'PIJAMA', 'COMBO'];
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/catalogo?category=${cat}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Dynamic product routes — fetched from the API
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/products`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const products: Product[] = await res.json();
      productRoutes = products.map((p) => ({
        url: `${SITE_URL}/products/${p.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch {
    // If the API is unreachable at build time, skip product URLs
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
