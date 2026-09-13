const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface StatsOut {
  total_products: number;
  total_variants: number;
  total_stock: number;
  low_stock_variants: number;
  orders_total: number;
  orders_sent: number;
}

export interface VariantOut {
  id: number;
  product_id: number;
  size: string;
  color: string;
  stock: number;
  price: number | null;
}

export interface ImageOut {
  id: number;
  product_id: number;
  url: string;
  color: string | null;
  sort_order: number;
}

export interface CategoryCoverOut {
  category: string;
  image_url: string;
}

export interface AdminProduct {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: string;
  base_price: number;
  featured: boolean;
  variants: VariantOut[];
  images: ImageOut[];
}

export interface OrderItemDetail {
  id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  variant: {
    id: number;
    size: string;
    color: string;
    product_id: number;
    stock: number;
    price: number | null;
    product: {
      id: number;
      name: string;
      code: string;
      category: string;
      base_price: number;
    };
  } | null;
}

export interface AdminOrder {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: 'PENDING' | 'SENT';
  created_at: string;
  sent_at: string | null;
  items: OrderItemDetail[];
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  stats: () => req<StatsOut>('/products/stats'),

  products: {
    list: () => req<AdminProduct[]>('/products'),
    get: (id: number) => req<AdminProduct>(`/products/${id}`),
    create: (data: object) => req<AdminProduct>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => req<AdminProduct>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => req<void>(`/products/${id}`, { method: 'DELETE' }),
  },

  variants: {
    add: (productId: number, data: object) =>
      req<VariantOut>(`/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(data) }),
    updateStock: (productId: number, variantId: number, stock: number) =>
      req<VariantOut>(`/products/${productId}/variants/${variantId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock }),
      }),
    delete: (productId: number, variantId: number) =>
      req<void>(`/products/${productId}/variants/${variantId}`, { method: 'DELETE' }),
  },

  images: {
    upload: (productId: number, file: File, color: string | null, sortOrder: number) => {
      const form = new FormData();
      form.append('file', file);
      if (color) form.append('color', color);
      form.append('sort_order', String(sortOrder));
      return req<ImageOut>(`/products/${productId}/images/upload`, { method: 'POST', body: form });
    },
    delete: (productId: number, imageId: number) =>
      req<void>(`/products/${productId}/images/${imageId}`, { method: 'DELETE' }),
  },

  orders: {
    list: () => req<AdminOrder[]>('/orders/detailed'),
  },

  categories: {
    covers: () => req<CategoryCoverOut[]>('/categories/covers'),
    setCover: (category: string, imageUrl: string) =>
      req<CategoryCoverOut>(`/categories/covers/${encodeURIComponent(category)}`, {
        method: 'PUT',
        body: JSON.stringify({ image_url: imageUrl }),
      }),
    uploadCover: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return req<ImageOut>('/categories/covers/upload', { method: 'POST', body: form });
    },
  },
};
