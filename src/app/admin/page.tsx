'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { StatsOut, AdminProduct } from '@/lib/adminApi';
import { formatPrice, categoryLabel } from '@/lib/format';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsOut | null>(null);
  const [lowStock, setLowStock] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { enabled: recentlyViewedEnabled, setEnabled: setRecentlyViewedEnabled } = useRecentlyViewed();

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.products.list()])
      .then(([s, products]) => {
        setStats(s);
        const low = products.filter((p) =>
          p.variants.some((v) => v.stock < 2)
        );
        setLowStock(low);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Resumen general de tu tienda</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <StatCard label="Productos" value={stats.total_products} />
            <StatCard label="Variantes" value={stats.total_variants} />
            <StatCard label="Stock total" value={stats.total_stock} sub="unidades" />
            <StatCard
              label="Stock bajo"
              value={stats.low_stock_variants}
              sub="variantes con menos de 2 uds."
              color={stats.low_stock_variants > 0 ? 'text-amber-500' : 'text-gray-800'}
            />
            <StatCard label="Pedidos recibidos" value={stats.orders_total} />
            <StatCard label="Enviados a WhatsApp" value={stats.orders_sent} color="text-green-600" />
          </div>

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
