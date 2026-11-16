/**
 * Búsqueda de productos e historial de búsquedas (solo en el navegador de cada persona).
 *
 * - `matchesProduct` se usa en el buscador del menú y en el catálogo, para que las
 *   sugerencias y los resultados siempre coincidan.
 * - El historial se guarda en localStorage de ESE dispositivo: no se envía a ningún
 *   servidor ni lo ve nadie más.
 */
import type { Product } from '@/lib/api';
import { categoryLabel } from '@/lib/format';

/** Minúsculas, sin tildes y con espacios simples: "Pijama  Sátin" -> "pijama satin". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ¿El producto coincide con lo escrito? Cada palabra escrita debe aparecer en el
 * nombre, la frase corta, la categoría (clave y nombre visible) o el código.
 * Ignora mayúsculas y tildes; el orden de las palabras no importa.
 */
export function matchesProduct(
  product: Pick<Product, 'name' | 'description' | 'category' | 'code'>,
  query: string,
): boolean {
  const tokens = normalizeText(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = normalizeText(
    [product.name, product.description ?? '', product.category, categoryLabel(product.category), product.code].join(' '),
  );
  return tokens.every((t) => haystack.includes(t));
}

// ------------------------- Historial de búsquedas ------------------------- //

const KEY = 'bi_recent_searches';
export const MAX_RECENT = 8;
const MIN_LEN = 2;
const MAX_LEN = 60;

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter((x) => x.length >= MIN_LEN && x.length <= MAX_LEN)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function write(list: string[]): string[] {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Navegación privada o almacenamiento lleno: el historial simplemente no se guarda.
  }
  return list;
}

export function getRecentSearches(): string[] {
  return read();
}

/** Guarda una búsqueda al principio de la lista (sin repetir, ignorando tildes y mayúsculas). */
export function addRecentSearch(query: string): string[] {
  const clean = query.replace(/\s+/g, ' ').trim();
  if (clean.length < MIN_LEN || clean.length > MAX_LEN) return read();
  const key = normalizeText(clean);
  const rest = read().filter((x) => normalizeText(x) !== key);
  return write([clean, ...rest].slice(0, MAX_RECENT));
}

export function removeRecentSearch(query: string): string[] {
  const key = normalizeText(query);
  return write(read().filter((x) => normalizeText(x) !== key));
}

export function clearRecentSearches(): string[] {
  return write([]);
}
