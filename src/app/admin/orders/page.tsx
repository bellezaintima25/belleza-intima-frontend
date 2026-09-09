'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import type { AdminOrder } from '@/lib/adminApi';
import { formatPrice } from '@/lib/format';

function orderTotal(order: AdminOrder): number {
  return order.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    adminApi.orders.list()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        <p className="text-gray-400 text-sm mt-1">{orders.length} pedidos registrados</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <span className="text-5xl block mb-3">📦</span>
          <p>Aún no hay pedidos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Row */}
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="font-semibold text-gray-800">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Fecha</p>
                    <p className="text-gray-700">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Total</p>
                    <p className="font-semibold text-gray-800">{formatPrice(orderTotal(order))}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'SENT'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status === 'SENT' ? '✓ Enviado' : '⏳ Pendiente'}
                    </span>
                  </div>
                </div>
                <span className="text-gray-300 text-xs">{expanded === order.id ? '▲' : '▼'}</span>
              </button>

              {/* Expanded items */}
              {expanded === order.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs">
                        <th className="pb-2">Producto</th>
                        <th className="pb-2">Talla</th>
                        <th className="pb-2">Color</th>
                        <th className="pb-2">Cant.</th>
                        <th className="pb-2">Precio unit.</th>
                        <th className="pb-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100">
                          <td className="py-2 font-medium text-gray-800">
                            {item.variant?.product?.name ?? `Variante #${item.variant_id}`}
                          </td>
                          <td className="py-2 text-gray-600">{item.variant?.size ?? '—'}</td>
                          <td className="py-2 text-gray-600">{item.variant?.color ?? '—'}</td>
                          <td className="py-2 text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-gray-600">{formatPrice(item.unit_price)}</td>
                          <td className="py-2 font-semibold text-gray-800">{formatPrice(item.unit_price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={5} className="pt-3 text-right font-semibold text-gray-700 text-sm pr-4">Total</td>
                        <td className="pt-3 font-bold text-primary-600">{formatPrice(orderTotal(order))}</td>
                      </tr>
                    </tfoot>
                  </table>
                  {order.sent_at && (
                    <p className="text-xs text-gray-400 mt-3">Enviado a WhatsApp: {formatDate(order.sent_at)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
