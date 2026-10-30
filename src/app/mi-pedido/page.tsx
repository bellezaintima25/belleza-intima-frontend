'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { OrderTrack } from '@/lib/api';
import { parseOrderNumber } from '@/lib/format';
import OrderTrackView from '@/components/OrderTrackView';

function MiPedidoContent() {
  const params = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = params.get('token');

  const [order, setOrder] = useState<OrderTrack | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenFromUrl));
  const [error, setError] = useState<string | null>(null);

  // Formulario de consulta por número + teléfono.
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);

  // Si llega con ?token= en la URL, carga el pedido directamente.
  useEffect(() => {
    if (!tokenFromUrl) return;
    setLoading(true);
    setError(null);
    api.orders.trackByToken(tokenFromUrl)
      .then(setOrder)
      .catch(() => setError('No encontramos un pedido con ese enlace.'))
      .finally(() => setLoading(false));
  }, [tokenFromUrl]);

  const searchByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const idNum = parseOrderNumber(orderId);
    if (!idNum) { setError('Escribe el número de tu pedido (ej. BI-100001).'); return; }
    if (phone.replace(/\D/g, '').length < 7) { setError('Escribe el teléfono con el que hiciste el pedido.'); return; }
    setSearching(true);
    try {
      const found = await api.orders.trackByPhone(idNum, phone.trim());
      // Quita el token viejo de la URL para que al refrescar no vuelva al pedido anterior.
      if (tokenFromUrl) router.replace('/mi-pedido');
      setOrder(found);
    } catch {
      setError('No encontramos un pedido con ese número y teléfono. Revisa los datos.');
      setOrder(null);
    } finally {
      setSearching(false);
    }
  };

  // Vuelve al formulario vacío y limpia el token de la URL (arregla el refrescar).
  const consultarOtro = () => {
    setOrder(null);
    setOrderId('');
    setPhone('');
    setError(null);
    if (tokenFromUrl) router.replace('/mi-pedido');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl font-semibold text-primary-700 mb-2">Sigue tu pedido</h1>
        <p className="text-gray-500">Consulta el estado de tu pedido en cualquier momento.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl h-56 animate-pulse border border-gray-100" />
      ) : order ? (
        <>
          <OrderTrackView order={order} />
          <div className="text-center mt-5">
            <button
              onClick={consultarOtro}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Consultar otro pedido
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={searchByPhone} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Ingresa el número de tu pedido y el teléfono con el que lo hiciste.
          </p>
          <div>
            <label htmlFor="order-id" className="block text-sm font-medium text-gray-700 mb-1">Número de pedido</label>
            <input
              id="order-id"
              type="text"
              inputMode="numeric"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Ej: BI-100001"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label htmlFor="order-phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono del pedido</label>
            <input
              id="order-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 3001234567"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={searching}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {searching ? 'Buscando…' : 'Ver mi pedido'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function MiPedidoPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Cargando…</div>}>
      <MiPedidoContent />
    </Suspense>
  );
}
