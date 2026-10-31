const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * Resuelve la URL de una imagen para <Image>/<img>.
 * - URLs absolutas (http/https, p. ej. de R2) se usan tal cual.
 * - Rutas relativas que empiezan con "/images/" las sirve el backend (no el
 *   frontend), así que se les antepone la URL del backend.
 * - Otras rutas estáticas (p. ej. "/logo.svg" o "/images/ST005..." incluidas en
 *   public/) se dejan relativas para que las sirva el frontend.
 */
export function imageSrc(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  // Las imágenes subidas en local quedan como "/images/<hash>-<nombre>".
  // Las de ejemplo del repo también están en "/images/" pero existen en public/.
  // Para distinguir: las subidas llevan un prefijo hash de 8 hex y un guion.
  if (/^\/images\/[0-9a-f]{8}-/i.test(url)) return `${API_URL}${url}`;
  return url;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  color: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  size: string;
  color: string;
  stock: number;
  price: number | null;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string | null;
  detail?: string | null;
  category: string;
  base_price: number;
  featured: boolean;
  discount_percent: number;
  discount_active: boolean;
  final_price: number;
  discount_amount: number;
  on_sale: boolean;
  images: ProductImage[];
  variants?: ProductVariant[];
}

export interface OrderItem {
  variant_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderCreate {
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
}

export interface OrderOut {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: 'PENDING' | 'SENT';
  created_at: string;
  sent_at: string | null;
  token?: string;
  items: Array<{
    id: number;
    variant_id: number;
    quantity: number;
    unit_price: number;
  }>;
}

export type PaymentStatus = 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

export interface OrderTrackItem {
  product_name: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  original_unit_price: number;
  line_original: number;
  line_savings: number;
}

export interface OrderTrack {
  id: number;
  token: string;
  customer_name: string;
  status: 'PENDING' | 'SENT';
  payment_status: PaymentStatus;
  created_at: string;
  combo_name: string | null;
  items: OrderTrackItem[];
  total: number;
  original_total: number;
  savings: number;
}

export interface WhatsAppLinkOut {
  order_id: number;
  whatsapp_url: string;
}

export interface CategoryCover {
  category: string;
  image_url: string;
}

// --- Combos (tienda pública) ---

export interface ComboItemPublic {
  id: number;
  product_id: number;
  quantity: number;
  pricing_mode: 'none' | 'fixed' | 'percent';
  special_price: number | null;
  discount_percent: number | null;
  product: {
    id: number;
    code: string;
    name: string;
    category: string;
    base_price: number;
    images: ProductImage[];
    variants: ProductVariant[];
  } | null;
  unit_price: number;
  line_original: number;
  line_final: number;
  line_savings: number;
}

export interface ComboImagePublic {
  id: number;
  combo_id: number;
  url: string;
  sort_order: number;
}

export interface Combo {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
  items: ComboItemPublic[];
  images: ComboImagePublic[];
  sort_order: number;
  include_product_images: boolean;
  tag: string | null;
  tag_color: string | null;
  original_price: number;
  final_price: number;
  savings: number;
  savings_percent: number;
}

export interface HeroPhrase {
  text: string;
  type: 'title' | 'paragraph';
  color: string;
  align?: 'left' | 'center' | 'right';
  font_size?: number | null;
  font_size_mobile?: number | null;
  box_width?: number | null;
  box_width_mobile?: number | null;
  layout?: HeroItemLayout | null;
  layout_mobile?: HeroItemLayout | null;
}

export interface HeroItemLayout {
  x: number;
  y: number;
  rotation: number;
}

export interface HeroButton {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
  layout?: HeroItemLayout | null;
  layout_mobile?: HeroItemLayout | null;
}

export interface HeroBackground {
  image_url: string;
  overlay: number;
  image_url_mobile?: string;
  overlay_mobile?: number;
  color?: string;
  color_mobile?: string;
}

export interface HeroContent {
  phrases: HeroPhrase[];
  buttons: HeroButton[];
  background: HeroBackground;
  show_logo: boolean;
  logo_url: string;
  layout?: 'flow' | 'free';
  buttons_layout?: HeroItemLayout | null;
  logo_layout?: HeroItemLayout | null;
  logo_layout_mobile?: HeroItemLayout | null;
  logo_size?: number | null;
  logo_size_mobile?: number | null;
}

export interface Testimonial {
  id: number;
  customer_name: string;
  text: string;
  rating: number;
  photo_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  products: {
    list: (category?: string) => {
      const qs = category ? `?category=${encodeURIComponent(category)}` : '';
      return request<Product[]>(`/products${qs}`);
    },
    featured: () => request<Product[]>(`/products?featured=true`),
    onSale: () => request<Product[]>(`/products?on_sale=true`),
    categories: () => request<string[]>('/products/categories'),
    get: (id: number) => request<Product>(`/products/${id}`),
  },
  categories: {
    covers: () => request<CategoryCover[]>('/categories/covers'),
  },
  site: {
    hero: () => request<HeroContent>('/site/hero'),
  },
  orders: {
    create: (data: OrderCreate) =>
      request<OrderOut>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    sendWhatsApp: (orderId: number) =>
      request<WhatsAppLinkOut>(`/orders/${orderId}/send-whatsapp`, { method: 'POST' }),
    list: () => request<OrderOut[]>('/orders'),
    trackByToken: (token: string) => request<OrderTrack>(`/orders/track/${encodeURIComponent(token)}`),
    trackByPhone: (orderId: number, phone: string) =>
      request<OrderTrack>('/orders/track', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId, customer_phone: phone }),
      }),
  },
  combos: {
    list: () => request<Combo[]>('/combos?active=true'),
    get: (id: number) => request<Combo>(`/combos/${id}`),
    whatsapp: (
      id: number,
      selections?: Array<{ product_id: number; size: string | null; color: string | null }>,
    ) =>
      request<{ combo_id: number; whatsapp_url: string }>(`/combos/${id}/whatsapp`, {
        method: 'POST',
        body: JSON.stringify({ selections: selections ?? [] }),
      }),
    order: (
      id: number,
      data: {
        customer_name: string;
        customer_phone: string;
        selections: Array<{ product_id: number; size: string | null; color: string | null }>;
      },
    ) =>
      request<{ order_id: number; token: string; whatsapp_url: string }>(`/combos/${id}/order`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  testimonials: {
    list: () => request<Testimonial[]>('/testimonials?active=true'),
  },
};

/** Returns the best matching image URL for a given color, or the first image, or null. */
export function getImageForColor(images: ProductImage[], color?: string | null): string | null {
  if (!images || images.length === 0) return null;
  if (color) {
    const match = images.find((img) => img.color?.toLowerCase() === color.toLowerCase());
    if (match) return match.url;
  }
  // Fallback: first image with no color, then just the first image
  return images.find((img) => !img.color)?.url ?? images[0].url;
}

/** Returns all images for a given color (plus generic ones with no color). */
export function getImagesForColor(images: ProductImage[], color?: string | null): ProductImage[] {
  if (!images || images.length === 0) return [];
  if (!color) return images;
  return images.filter((img) => !img.color || img.color.toLowerCase() === color.toLowerCase());
}

/**
 * Precio efectivo (a cobrar) de un producto/variante, aplicando el descuento
 * del producto si está activo. La variante puede sobreescribir el precio base;
 * el descuento por porcentaje se aplica sobre ese precio aplicable.
 */
export function effectivePrice(
  product: Pick<Product, 'base_price' | 'discount_percent' | 'discount_active'>,
  variant?: { price: number | null } | null,
): number {
  const basis = variant?.price ?? product.base_price;
  if (product.discount_active && product.discount_percent > 0) {
    const pct = Math.min(100, Math.max(0, product.discount_percent));
    return Math.round(basis * (1 - pct / 100));
  }
  return basis;
}

/**
 * Estilo "soft/pastel" para la etiqueta de un combo: fondo tenue, texto del
 * mismo tono (oscuro y legible) y borde sutil. Evita badges chillones y se ve
 * elegante sobre fotos o fondos claros.
 * Admite el token 'primary-600' o un color hex de la paleta del admin.
 */
export function tagBadgeStyle(color: string | null | undefined): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} {
  // Mapa de cada color elegible -> su versión suave {bg, text, border}.
  const MAP: Record<string, { bg: string; text: string; border: string }> = {
    'primary-600': { bg: '#f7e8ee', text: '#8B1A3A', border: '#e4c4cf' }, // vino
    '#dc2626':     { bg: '#fde8e8', text: '#b91c1c', border: '#f6caca' }, // rojo
    '#f97316':     { bg: '#fdecd8', text: '#c2560c', border: '#f8d5ad' }, // naranja
    '#16a34a':     { bg: '#e3f5e8', text: '#15803d', border: '#bfe7ca' }, // verde
    '#2563eb':     { bg: '#e6edfd', text: '#1d4ed8', border: '#c5d6fa' }, // azul
    '#7c3aed':     { bg: '#eee6fb', text: '#6d28d9', border: '#d7c6f5' }, // morado
    '#db2777':     { bg: '#fce4f0', text: '#be185d', border: '#f6c3dd' }, // rosa
    '#111827':     { bg: '#e8eaed', text: '#111827', border: '#cfd3da' }, // negro/gris
  };
  const key = color || 'primary-600';
  const style = MAP[key] ?? MAP['primary-600'];
  return { backgroundColor: style.bg, color: style.text, borderColor: style.border };
}
