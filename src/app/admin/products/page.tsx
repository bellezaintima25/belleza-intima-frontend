'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/adminApi';
import type { AdminProduct } from '@/lib/adminApi';
import { formatPrice, categoryLabel } from '@/lib/format';
import { getImageForColor } from '@/lib/api';
import Image from 'next/image';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.products.list()
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await adminApi.products.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const totalStock = (p: AdminProduct) => p.variants.reduce((s, v) => s + v.stock, 0);
  const isLow = (p: AdminProduct) => p.variants.some((v) => v.stock < 2);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-gray-400 text-sm mt-1">{products.length} productos en catálogo</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo producto
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50">
                <th className="px-5 py-3 font-semibold text-gray-500">Producto</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Categoría</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Precio base</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Variantes</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Stock total</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const imgUrl = getImageForColor(p.images);
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-primary-50 flex-shrink-0">
                          {imgUrl ? (
                            <Image src={imgUrl} alt={p.name} fill sizes="40px" className="object-cover" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-lg">🌸</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{categoryLabel(p.category)}</td>
                    <td className="px-5 py-3 font-medium text-gray-700">{formatPrice(p.base_price)}</td>
                    <td className="px-5 py-3 text-gray-600">{p.variants.length}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${
                        totalStock(p) === 0 ? 'text-red-500' :
                        isLow(p) ? 'text-amber-500' : 'text-gray-700'
                      }`}>
                        {totalStock(p)}
                        {isLow(p) && <span className="ml-1 text-amber-400">⚠️</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Editar"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deleting === p.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
