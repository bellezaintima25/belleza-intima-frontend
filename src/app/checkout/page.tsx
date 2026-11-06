'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { api, effectivePrice, getImageForColor } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Ahorro total
  const totalSavings = items.reduce((acc, item) => {
    const base = item.product.base_price;
    const final = effectivePrice(item.product, item.variant);
    return acc + (base - final) * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.2} className="w-20 h-20 mb-4 text-primary-200">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 24V18a12 12 0 0 1 24 0v6" />
          <rect x="10" y="24" width="44" height="34" rx="6" strokeLinecap="round" />
          <path strokeLinecap="round" d="M26 36a6 6 0 0 0 12 0" />
        </svg>
        <p className="font-serif text-lg text-gray-400 mb-1">Tu carrito está vacío</p>
        <p className="text-sm text-gray-300 mb-6">Agrega algo que te haga brillar</p>
        <Link href="/catalogo" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
          ← Ir al catálogo
        </Link>
      </div>
    );
  }

  const validateName = (value: string) => {
    const words = value.trim().split(/\s+/).filter((w) => w.length >= 2);
    if (!value.trim()) return 'Este campo es obligatorio.';
    if (words.length < 2) return 'Ingresa tu nombre y apellido.';
    return null;
  };

  const validatePhone = (value: string) => {
    if (!value.trim()) return 'Este campo es obligatorio.';
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10) return 'Ingresa un número de celular de 10 dígitos.';
    return null;
  };

  const validateCity = (value: string) => {
    if (!value.trim()) return 'Este campo es obligatorio.';
    if (value.trim().length < 2) return 'Ingresa una ciudad válida.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const nErr = validateName(name);
    const pErr = validatePhone(phone);
    const cErr = validateCity(city);
    setNameError(nErr);
    setPhoneError(pErr);
    setCityError(cErr);
    if (nErr || pErr || cErr) return;

    setLoading(true);
    try {
      const order = await api.orders.create({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_city: city.trim(),
        items: items.map((item) => ({
          variant_id: item.variant.id,
          quantity: item.quantity,
          unit_price: effectivePrice(item.product, item.variant),
        })),
      });

      const { whatsapp_url } = await api.orders.sendWhatsApp(order.id);
      clearCart();
      window.open(whatsapp_url, '_blank');
      const tokenQs = order.token ? `&token=${encodeURIComponent(order.token)}` : '';
      router.push(`/checkout/success?order=${order.id}${tokenQs}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error. Intenta de nuevo.';
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-red-300 bg-red-50/40 focus:ring-red-300 focus:border-red-400'
        : 'border-gray-200 hover:border-gray-300 focus:ring-primary-400 focus:border-primary-400'
    }`;

  const labelClass = "block text-sm font-medium text-gray-600 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold text-primary-700 mb-8">Finalizar pedido</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resumen del pedido */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3 h-fit">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">Resumen</h2>
          {items.map((item) => {
            const price = effectivePrice(item.product, item.variant);
            const hasDiscount = item.product.base_price > price;
            const imageUrl = getImageForColor(item.product.images, item.variant.color);
            return (
              <div key={item.variant.id} className="flex gap-3 text-sm">
                {/* Imagen del producto */}
                <div className="w-14 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-primary-50 relative">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-6 h-6 text-primary-200">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.variant.size} · {item.variant.color} × {item.quantity}
                  </p>
                  {hasDiscount && (
                    <p className="text-xs text-gray-400 mt-0.5 line-through nums">
                      {formatPrice(item.product.base_price * item.quantity)}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="font-semibold text-gray-800 nums">{formatPrice(price * item.quantity)}</p>
                  {hasDiscount && (
                    <p className="text-xs text-green-600 font-medium">-{Math.round(item.product.discount_percent)}%</p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="border-t border-gray-100 pt-3 space-y-2">
            {totalSavings > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l2.25 2.25L15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Ahorro total
                </span>
                <span className="font-semibold nums">{formatPrice(totalSavings)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800">
              <span>Total</span>
              <span className="text-primary-600 nums">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className={labelClass}>Nombre y apellido</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError(validateName(e.target.value)); }}
              onBlur={(e) => setNameError(validateName(e.target.value))}
              autoComplete="name"
              placeholder="Ej: María García"
              className={inputClass(!!nameError)}
            />
            {nameError ? (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {nameError}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1.5">Escribe tu nombre y apellido.</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="phone" className={labelClass}>Tu teléfono / WhatsApp</label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(validatePhone(e.target.value)); }}
              onBlur={(e) => setPhoneError(validatePhone(e.target.value))}
              autoComplete="tel"
              placeholder="Ej: 3001234567"
              className={inputClass(!!phoneError)}
            />
            {phoneError ? (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {phoneError}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1.5">Número de celular de 10 dígitos.</p>
            )}
          </div>

          {/* Ciudad */}
          <div>
            <label htmlFor="city" className={labelClass}>Ciudad</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => { setCity(e.target.value); if (cityError) setCityError(validateCity(e.target.value)); }}
              onBlur={(e) => setCityError(validateCity(e.target.value))}
              autoComplete="address-level2"
              placeholder="Ej: Bogotá"
              className={inputClass(!!cityError)}
            />
            {cityError ? (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {cityError}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1.5">Ciudad donde recibirás tu pedido.</p>
            )}
          </div>

          {submitError && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 flex-shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Enviando...
              </span>
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
