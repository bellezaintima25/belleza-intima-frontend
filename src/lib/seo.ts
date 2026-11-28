/**
 * Utilidades de SEO que corren en el SERVIDOR (metadatos de cada página para Google y para las
 * vistas previas al compartir un enlace por WhatsApp, Instagram, etc.).
 */
import type { Combo, Product } from '@/lib/api';
import { imageSrc } from '@/lib/api';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://belleza-intima-frontend.vercel.app').replace(/\/$/, '');
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Pide un dato al backend sin bloquear la página: si tarda más de 3 s o falla, devuelve null. */
async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 300 },        // se reutiliza 5 minutos
      signal: AbortSignal.timeout(3000), // un backend dormido no debe frenar la página
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const isId = (id: string) => /^\d+$/.test(id);

export const getProductForSeo = (id: string) => (isId(id) ? fetchJson<Product>(`/products/${id}`) : Promise.resolve(null));
export const getComboForSeo = (id: string) => (isId(id) ? fetchJson<Combo>(`/combos/${id}`) : Promise.resolve(null));

/** Texto corto y limpio para la descripción (máximo ~155 caracteres, sin cortar palabras). */
export function shortText(...candidates: Array<string | null | undefined>): string {
  const text = (candidates.find((c) => c && c.trim()) ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= 155) return text;
  return text.slice(0, 152).replace(/\s+\S*$/, '') + '…';
}

/** Dirección absoluta de una imagen (las vistas previas la necesitan completa). */
export function absoluteImage(url: string | null | undefined): string | null {
  const src = imageSrc(url);
  if (!src) return null;
  return /^https?:\/\//i.test(src) ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}