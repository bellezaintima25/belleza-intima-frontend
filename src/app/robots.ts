import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://belleza-intima-frontend.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep the admin backoffice and checkout out of search results
      disallow: ['/admin', '/checkout'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
