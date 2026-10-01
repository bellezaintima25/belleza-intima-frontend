'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { StatsOut, AdminProduct, AdminOrder, PaymentStatus } from '@/lib/adminApi';
import { formatPrice, categoryLabel } from '@/lib/format';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 nums ${color ?? 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDIENTE: 'Pendientes', PAGADO: 'Pagados', ENVIADO: 'Enviados',
  ENTREGADO: 'Entregados', CANCELADO: 'Cancelados',
};
const STATUS_COLOR: Record<PaymentStatus, string> = {
  PENDIENTE: 'text-amber-600', PAGADO: 'text-emerald-600', ENVIADO: 'text-sky-600',
  ENTREGADO: 'text-violet-600', CANCELADO: 'text-rose-600',
};

function orderTotal(o: AdminOrder): number {
  return o.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsOut | null>(null);
  const [lowStock, setLowStock] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { enabled: recentlyViewedEnabled, setEnabled: setRecentlyViewedEnabled } = useRecentlyViewed();

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.products.list(), adminApi.orders.list()])
      .then(([s, products, ordersList]) => {
        setStats(s);
        setOrders(ordersList);
        const low = products.filter((p) => p.variants.some((v) => v.stock < 2));
        setLowStock(low);
      })
      .finally(() => setLoading(false));
  }, []);

  // Métricas de pedidos por estado e ingresos (ventas confirmadas).
  const byStatus = useMemo(() => {
    const acc: Record<PaymentStatus, number> = {
      PENDIENTE: 0, PAGADO: 0, ENVIADO: 0, ENTREGADO: 0, CANCELADO: 0,
    };
    orders.forEach((o) => {
      const st = (o.payment_status in acc ? o.payment_status : 'PENDIENTE') as PaymentStatus;
      acc[st] = (acc[st] ?? 0) + 1;
    });
    return acc;
  }, [orders]);

  // Ingresos = suma de totales de pedidos con venta confirmada (stock descontado).
  const revenue = useMemo(
    () => orders.filter((o) => o.stock_applied).reduce((s, o) => s + orderTotal(o), 0),
    [orders],
  );

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Panel de control</h1>
        <p className="text-gray-400 text-sm mt-1">Resumen general de tu tienda</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Accesos rápidos */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Link href="/admin/products/new" className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">+ Nuevo producto</Link>
            <Link href="/admin/products" className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Productos</Link>
            <Link href="/admin/orders" className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Pedidos</Link>
            <Link href="/admin/covers" className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Página de inicio</Link>
          </div>

          {/* Tarjetas principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Ingresos confirmados" value={formatPrice(revenue)} sub="pedidos con stock descontado" color="text-emerald-600" />
            <StatCard label="Pedidos" value={orders.length} sub="en total" />
            <StatCard label="Productos" value={stats.total_products} sub={`${stats.total_variants} variantes`} />
            <StatCard label="Stock total" value={stats.total_stock} sub="unidades" />
          </div>

          {/* Pedidos por estado */}
          <div className="mb-10">
            <h2 className="text-base font-bold text-gray-700 mb-3">Pedidos por estado</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {(Object.keys(STATUS_LABEL) as PaymentStatus[]).map((st) => (
                <Link
                  key={st}
                  href="/admin/orders"
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{STATUS_LABEL[st]}</p>
                  <p className={`text-2xl font-bold mt-1 nums ${STATUS_COLOR[st]}`}>{byStatus[st]}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Stock bajo destacado */}
          {stats.low_stock_variants > 0 && (
            <div className="mb-10">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <p className="text-sm text-amber-700">
                  <span className="font-bold">{stats.low_stock_variants}</span> variante(s) con stock bajo (menos de 2 uds.).
                </p>
                <Link href="/admin/products?stock=low" className="text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap">Ver productos →</Link>
              </div>
            </div>
          )}

          {/* Pedidos recientes */}
          {recentOrders.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-700">Pedidos recientes</h2>
                <Link href="/admin/orders" className="text-xs font-semibold text-primary-600 hover:underline">Ver todos →</Link>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left bg-gray-50">
                      <th className="px-5 py-3 font-semibold text-gray-500">Cliente</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Total</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => {
                      const st = (STATUS_LABEL[o.payment_status] ? o.payment_status : 'PENDIENTE') as PaymentStatus;
                      return (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800">{o.customer_name}</td>
                        <td className="px-5 py-3 text-gray-700 nums">{formatPrice(orderTotal(o))}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold ${STATUS_COLOR[st]}`}>
                            {STATUS_LABEL[st]}
                          </span>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recently viewed toggle */}
          <div className="mb-10">
            <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span>🕒</span> Productos vistos recientemente
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Mostrar sección en la tienda</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cuando está activo, los clientes verán los últimos 10 productos que visitaron
                  al fondo del catálogo y de cada producto.
                </p>
              </div>
              <button
                onClick={() => setRecentlyViewedEnabled(!recentlyViewedEnabled)}
                className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${
                  recentlyViewedEnabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={recentlyViewedEnabled}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    recentlyViewedEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-amber-400">⚠️</span> Productos con stock bajo
              </h2>
              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-5 py-3 font-semibold text-gray-500">Producto</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Categoría</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Talla</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Color</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Stock</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.flatMap((p) =>
                      p.variants
                        .filter((v) => v.stock < 2)
                        .map((v) => (
                          <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                            <td className="px-5 py-3 text-gray-500">{categoryLabel(p.category)}</td>
                            <td className="px-5 py-3 text-gray-600">{v.size}</td>
                            <td className="px-5 py-3 text-gray-600">{v.color}</td>
                            <td className="px-5 py-3">
                              <span className={`font-bold ${v.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                {v.stock === 0 ? 'Sin stock' : `${v.stock} ud.`}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <Link
                                href={`/admin/products/${p.id}`}
                                className="text-primary-600 hover:underline text-xs font-medium"
                              >
                                Editar →
                              </Link>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
