'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { OrderTrack } from '@/lib/api';
import { orderNumber } from '@/lib/format';
import OrderTrackView from '@/components/OrderTrackView';

function SuccessContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const orderId = params.get('order');

  const [order, setOrder] = useState<OrderTrack | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.orders.trackByToken(token)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <span className="text-6xl block mb-3">🎉</span>
        <h1 className="font-serif text-3xl font-semibold text-primary-700 mb-2">¡Pedido enviado!</h1>
        <p className="text-gray-500">
          Tu pedido fue enviado a WhatsApp. Pronto nos comunicaremos contigo para confirmar la entrega.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl h-56 animate-pulse border border-gray-100" />
      ) : order ? (
        <>
          <p className="text-center text-sm text-gray-400 mb-3">Este es tu comprobante:</p>
          <OrderTrackView order={order} />
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/mi-pedido?token=${encodeURIComponent(order.token)}`}
              className="text-center bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Sigue tu pedido
            </Link>
            <Link
              href="/"
              className="text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Seguir comprando
            </Link>
          </div>
          <p className="text-xs text-center text-gray-400 mt-4">
            Guarda tu número de pedido <span className="font-semibold nums">{orderNumber(order.id)}</span> para consultar su estado cuando quieras.
          </p>
        </>
      ) : (
        <div className="text-center">
          {orderId && (
            <p className="text-sm text-gray-500 mb-4">
              Tu número de pedido es <span className="font-semibold nums">{orderNumber(Number(orderId))}</span>.
            </p>
          )}
          <Link
            href="/"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Cargando…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
