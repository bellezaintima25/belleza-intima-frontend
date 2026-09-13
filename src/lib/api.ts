const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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
  category: string;
  base_price: number;
  featured: boolean;
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
  items: Array<{
    id: number;
    variant_id: number;
    quantity: number;
    unit_price: number;
  }>;
}

export interface WhatsAppLinkOut {
  order_id: number;
  whatsapp_url: string;
}

export interface CategoryCover {
  category: string;
  image_url: string;
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
    categories: () => request<string[]>('/products/categories'),
    get: (id: number) => request<Product>(`/products/${id}`),
  },
  categories: {
    covers: () => request<CategoryCover[]>('/categories/covers'),
  },
  orders: {
    create: (data: OrderCreate) =>
      request<OrderOut>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    sendWhatsApp: (orderId: number) =>
      request<WhatsAppLinkOut>(`/orders/${orderId}/send-whatsapp`, { method: 'POST' }),
    list: () => request<OrderOut[]>('/orders'),
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
