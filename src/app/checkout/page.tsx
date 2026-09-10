'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <span className="text-5xl block mb-4">🛍️</span>
        <p className="text-gray-500 mb-4">Tu carrito está vacío.</p>
        <Link href="/" className="text-primary-600 hover:underline">← Ir al catálogo</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Create order in backend
      const order = await api.orders.create({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        items: items.map((item) => ({
          variant_id: item.variant.id,
          quantity: item.quantity,
          unit_price: item.variant.price ?? item.product.base_price,
        })),
      });

      // 2. Get WhatsApp link
      const { whatsapp_url } = await api.orders.sendWhatsApp(order.id);

      // 3. Clear cart
      clearCart();

      // 4. Open WhatsApp in new tab
      window.open(whatsapp_url, '_blank');

      // 5. Redirect to success page
      router.push(`/checkout/success?order=${order.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error. Intenta de nuevo.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl font-semibold text-primary-700 mb-6">Finalizar pedido</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order summary */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3 h-fit">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Resumen</h2>
          {items.map((item) => {
            const price = item.variant.price ?? item.product.base_price;
            return (
              <div key={item.variant.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{item.product.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.variant.size} · {item.variant.color} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-gray-800">{formatPrice(price * item.quantity)}</p>
              </div>
            );
          })}
          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-800">
            <span>Total</span>
            <span className="text-primary-600">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Tu nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: María García"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Tu teléfono / WhatsApp
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Ej: 3001234567"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Enviando...' : 'Enviar pedido por WhatsApp 💬'}
          </button>
          <p className="text-xs text-center text-gray-400">
            Se abrirá WhatsApp con tu pedido listo para enviar.
          </p>
        </form>
      </div>
    </div>
  );
}
