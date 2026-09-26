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
    setError(null);

    // Validación: nombre y apellido (al menos dos palabras de 2+ letras).
    const words = name.trim().split(/\s+/).filter((w) => w.length >= 2);
    if (words.length < 2) {
      setError('Ingresa tu nombre y apellido (al menos dos palabras).');
      return;
    }

    // Validación: teléfono celular colombiano de exactamente 10 dígitos.
    // Contamos solo los dígitos (ignorando espacios, guiones o el símbolo +).
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Ingresa un número de celular válido de 10 dígitos.');
      return;
    }

    setLoading(true);

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
                <p className="font-semibold text-gray-800 nums">{formatPrice(price * item.quantity)}</p>
              </div>
            );
          })}
          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-800">
            <span>Total</span>
            <span className="text-primary-600 nums">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre y apellido
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Ej: María García"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <p className="text-xs text-gray-400 mt-1">Escribe tu nombre y apellido.</p>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Tu teléfono / WhatsApp
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              placeholder="Ej: 3001234567"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <p className="text-xs text-gray-400 mt-1">Número de celular de 10 dígitos.</p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              'Enviando...'
            ) : (
              <>
                Enviar pedido por WhatsApp
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/>
                </svg>
              </>
            )}
          </button>
          <p className="text-xs text-center text-gray-400">
            Se abrirá WhatsApp con tu pedido listo para enviar.
          </p>
        </form>
      </div>
    </div>
  );
}
