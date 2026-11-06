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
      {/* Hero de confirmación */}
      <div className="text-center mb-10">
        {/* Ícono de check animado */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-10 h-10 text-green-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl font-semibold text-primary-700 mb-3">
          ¡Tu pedido está en camino!
        </h1>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          Recibimos tu pedido y lo enviamos a WhatsApp. Pronto nos comunicaremos contigo para coordinar la entrega.
        </p>
      </div>

      {/* Pasos de lo que sigue */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          {
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            ),
            label: 'Pedido recibido',
            done: true,
          },
          {
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            ),
            label: 'Te contactamos',
            done: false,
          },
          {
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            ),
            label: 'Recibe tu pedido',
            done: false,
          },
        ].map((step, i) => (
          <div key={i} className={`flex flex-col items-center text-center p-3 rounded-2xl border ${step.done ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
            {step.icon}
            <p className="text-xs font-medium mt-2">{step.label}</p>
          </div>
        ))}
      </div>

      {/* Comprobante */}
      {loading ? (
        <div className="bg-white rounded-2xl h-56 animate-pulse border border-gray-100" />
      ) : order ? (
        <>
          <p className="text-sm text-gray-400 mb-3 text-center">Guarda este comprobante:</p>
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
              className="text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm hover:shadow-md"
            >
              Seguir comprando
            </Link>
          </div>
          <p className="text-xs text-center text-gray-400 mt-4">
            Número de pedido: <span className="font-semibold nums text-gray-600">{orderNumber(order.id)}</span>
          </p>
        </>
      ) : (
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          {orderId && (
            <p className="text-sm text-gray-500 mb-2">
              Tu número de pedido es
            </p>
          )}
          {orderId && (
            <p className="font-serif text-2xl font-semibold text-primary-700 mb-6 nums">
              {orderNumber(Number(orderId))}
            </p>
          )}
          <Link
            href="/"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm hover:shadow-md"
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
