import { apiFetch, readApiError } from './apiError';
import { clearSession, getToken, replaceSession, saveSession } from './auth';
import type { AdminUser } from './auth';

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

export interface HeroItemLayout {
  x: number;
  y: number;
  rotation: number;
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

export interface HeroVersion {
  id: number;
  name: string | null;
  content: HeroContent;
  is_current: boolean;
  is_pinned: boolean;
  created_at: string;
}

export interface AdminProduct {
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

export type PaymentStatus = 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

export interface AdminOrder {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_city?: string | null;
  status: 'PENDING' | 'SENT';
  payment_status: PaymentStatus;
  stock_applied: boolean;
  created_at: string;
  sent_at: string | null;
  combo_id?: number | null;
  combo_name?: string | null;
  items: OrderItemDetail[];
}

export type ComboPricingMode = 'none' | 'fixed' | 'percent';

export interface ComboItemIn {
  product_id: number;
  quantity: number;
  pricing_mode: ComboPricingMode;
  special_price?: number | null;
  discount_percent?: number | null;
}

export interface ComboItemOut {
  id: number;
  product_id: number;
  quantity: number;
  pricing_mode: ComboPricingMode;
  special_price: number | null;
  discount_percent: number | null;
  product: {
    id: number;
    code: string;
    name: string;
    category: string;
    base_price: number;
    images: ImageOut[];
  } | null;
  // Calculados por el backend:
  unit_price: number;
  line_original: number;
  line_final: number;
  line_savings: number;
}

export interface ComboImageOut {
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
  items: ComboItemOut[];
  images: ComboImageOut[];
  sort_order: number;
  include_product_images: boolean;
  tag: string | null;
  tag_color: string | null;
  // Calculados por el backend:
  original_price: number;
  final_price: number;
  savings: number;
  savings_percent: number;
}

export interface ComboInput {
  name: string;
  description?: string | null;
  image_url?: string | null;
  active: boolean;
  include_product_images: boolean;
  tag?: string | null;
  tag_color?: string | null;
  items: ComboItemIn[];
}

export interface Testimonial {
  id: number;
  customer_name: string;
  text: string;
  rating: number;
  photo_url: string | null;
  active: boolean;
  sort_order: number;
  /** PENDING = esperando revisión · APPROVED = publicado · REJECTED = descartado */
  status: TestimonialStatus;
  /** true si lo envió una clienta desde la tienda; false si lo creó el admin. */
  from_customer: boolean;
  created_at: string;
}

export type TestimonialStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TestimonialInput {
  customer_name: string;
  text: string;
  rating: number;
  photo_url?: string | null;
  active: boolean;
}

/** Lleva a la pantalla de ingreso (una sola vez) cuando la sesión venció o no es válida. */
function sessionExpired(): void {
  clearSession();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
    window.location.assign('/admin/login?expired=1');
  }
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await apiFetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      // Con FormData el navegador pone el Content-Type (con el boundary) por su cuenta.
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  if (res.status === 401) {
    sessionExpired();
    throw new Error('Tu sesión venció. Ingresa de nuevo.');
  }
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface LoginResponse {
  access_token: string;
  expires_at: string;
  user: AdminUser;
}

export interface TeamMember {
  id: number;
  username: string;
  display_name: string;
  active: boolean;
  created_at: string | null;
  last_login_at: string | null;
  is_me: boolean;
}

export const adminApi = {
  stats: () => req<StatsOut>('/products/stats'),

  auth: {
    /** Inicia sesión. No usa `req`: un 401 aquí es "clave incorrecta", no "sesión vencida". */
    login: async (username: string, password: string, remember: boolean): Promise<void> => {
      const res = await apiFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, remember }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = (await res.json()) as LoginResponse;
      saveSession({ token: data.access_token, expiresAt: data.expires_at, user: data.user }, remember);
    },
    me: () => req<AdminUser>('/auth/me'),
    logout: () => clearSession(),
    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      const data = await req<LoginResponse>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      // El servidor cierra las demás sesiones y entrega un token nuevo para esta.
      replaceSession({ token: data.access_token, expiresAt: data.expires_at, user: data.user });
    },
  },

  team: {
    list: () => req<TeamMember[]>('/admin-users'),
    create: (data: { username: string; display_name: string; password: string }) =>
      req<TeamMember>('/admin-users', { method: 'POST', body: JSON.stringify(data) }),
    resetPassword: (id: number, password: string) =>
      req<TeamMember>(`/admin-users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
    setActive: (id: number, active: boolean) =>
      req<TeamMember>(`/admin-users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  },

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
    updateVariant: (productId: number, variantId: number, data: { stock?: number; price?: number | null }) =>
      req<VariantOut>(`/products/${productId}/variants/${variantId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    updateStock: (productId: number, variantId: number, stock: number) =>
      req<VariantOut>(`/products/${productId}/variants/${variantId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock }),
      }),
    delete: (productId: number, variantId: number) =>
      req<void>(`/products/${productId}/variants/${variantId}`, { method: 'DELETE' }),
  },

  colors: {
    rename: (productId: number, oldColor: string, newColor: string) =>
      req<AdminProduct>(`/products/${productId}/colors/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ old_color: oldColor, new_color: newColor }),
      }),
  },

  images: {
    upload: (productId: number, file: File, color: string | null, sortOrder: number) => {
      const form = new FormData();
      form.append('file', file);
      if (color) form.append('color', color);
      form.append('sort_order', String(sortOrder));
      return req<ImageOut>(`/products/${productId}/images/upload`, { method: 'POST', body: form });
    },
    setColor: (productId: number, imageId: number, color: string | null) =>
      req<ImageOut>(`/products/${productId}/images/${imageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ color }),
      }),
    delete: (productId: number, imageId: number) =>
      req<void>(`/products/${productId}/images/${imageId}`, { method: 'DELETE' }),
  },

  orders: {
    list: () => req<AdminOrder[]>('/orders/detailed'),
    updateStatus: (orderId: number, paymentStatus: PaymentStatus) =>
      req<AdminOrder>(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: paymentStatus }),
      }),
    delete: (orderId: number) =>
      req<void>(`/orders/${orderId}`, { method: 'DELETE' }),
    addItem: (orderId: number, variantId: number, quantity: number, unitPrice?: number) =>
      req<AdminOrder>(`/orders/${orderId}/items`, {
        method: 'POST',
        body: JSON.stringify({ variant_id: variantId, quantity, unit_price: unitPrice ?? null }),
      }),
    updateItemQty: (orderId: number, itemId: number, quantity: number) =>
      req<AdminOrder>(`/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      }),
    deleteItem: (orderId: number, itemId: number) =>
      req<AdminOrder>(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' }),
    updateCustomer: (orderId: number, data: { customer_name?: string; customer_phone?: string; customer_city?: string }) =>
      req<AdminOrder>(`/orders/${orderId}/customer`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
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

  site: {
    getHero: () => req<HeroContent>('/site/hero'),
    getDefault: () => req<HeroContent>('/site/hero/default'),
    updateHero: (data: HeroContent, name?: string) =>
      req<HeroContent>('/site/hero', {
        method: 'PUT',
        body: JSON.stringify({ content: data, name: name ?? null }),
      }),
    uploadLogo: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return req<ImageOut>('/site/hero/logo/upload', { method: 'POST', body: form });
    },
    // Historial de versiones del hero
    history: () => req<HeroVersion[]>('/site/hero/history'),
    restoreVersion: (versionId: number) =>
      req<HeroContent>(`/site/hero/history/${versionId}/restore`, { method: 'POST' }),
    deleteVersion: (versionId: number) =>
      req<void>(`/site/hero/history/${versionId}`, { method: 'DELETE' }),
    renameVersion: (versionId: number, name: string) =>
      req<HeroVersion>(`/site/hero/history/${versionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    duplicateVersion: (versionId: number) =>
      req<HeroVersion>(`/site/hero/history/${versionId}/duplicate`, { method: 'POST' }),
    pinVersion: (versionId: number) =>
      req<HeroVersion>(`/site/hero/history/${versionId}/pin`, { method: 'POST' }),
  },

  combos: {
    list: () => req<Combo[]>('/combos'),
    get: (id: number) => req<Combo>(`/combos/${id}`),
    create: (data: ComboInput) => req<Combo>('/combos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ComboInput>) =>
      req<Combo>(`/combos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => req<void>(`/combos/${id}`, { method: 'DELETE' }),
    reorder: (orderedIds: number[]) =>
      req<Combo[]>('/combos/reorder', { method: 'PUT', body: JSON.stringify(orderedIds) }),
    uploadImage: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return req<{ url: string }>('/combos/image/upload', { method: 'POST', body: form });
    },
    // Galería de varias fotos por combo
    images: (comboId: number) => req<ComboImageOut[]>(`/combos/${comboId}/images`),
    uploadGalleryImage: (comboId: number, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return req<ComboImageOut>(`/combos/${comboId}/images/upload`, { method: 'POST', body: form });
    },
    deleteImage: (comboId: number, imageId: number) =>
      req<void>(`/combos/${comboId}/images/${imageId}`, { method: 'DELETE' }),
    reorderImages: (comboId: number, orderedIds: number[]) =>
      req<ComboImageOut[]>(`/combos/${comboId}/images/reorder`, {
        method: 'PUT',
        body: JSON.stringify(orderedIds),
      }),
  },

  testimonials: {
    /** Todos los comentarios (pendientes, publicados y rechazados). */
    list: () => req<Testimonial[]>('/testimonials/admin/list'),
    pendingCount: () => req<{ count: number }>('/testimonials/admin/pending-count'),
    setStatus: (id: number, status: TestimonialStatus) =>
      req<Testimonial>(`/testimonials/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    create: (data: TestimonialInput) => req<Testimonial>('/testimonials', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<TestimonialInput>) =>
      req<Testimonial>(`/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => req<void>(`/testimonials/${id}`, { method: 'DELETE' }),
    reorder: (orderedIds: number[]) =>
      req<Testimonial[]>('/testimonials/reorder', { method: 'PUT', body: JSON.stringify(orderedIds) }),
    uploadPhoto: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return req<{ url: string }>('/testimonials/photo/upload', { method: 'POST', body: form });
    },
  },
};
