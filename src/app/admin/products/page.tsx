'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/adminApi';
import type { AdminProduct } from '@/lib/adminApi';
import { formatPrice, categoryLabel } from '@/lib/format';
import { getImageForColor } from '@/lib/api';
import Image from 'next/image';

type StockFilter = 'all' | 'in' | 'low' | 'out';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<number | null>(null);

  // Búsqueda y filtros
  const [query, setQuery] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fSize, setFSize] = useState('');
  const [fColor, setFColor] = useState('');
  const [fStock, setFStock] = useState<StockFilter>('all');

  const load = () => {
    setLoading(true);
    adminApi.products.list()
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Preseleccionar filtro de stock si viene por query (?stock=low|out|in).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search).get('stock');
    if (sp === 'low' || sp === 'out' || sp === 'in') setFStock(sp);
  }, []);

  // Opciones de filtro derivadas del catálogo.
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  );
  const sizes = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.variants.map((v) => v.size)))).sort(),
    [products],
  );
  const colors = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.variants.map((v) => v.color)))).sort(),
    [products],
  );

  const totalStock = (p: AdminProduct) => p.variants.reduce((s, v) => s + v.stock, 0);
  const isLow = (p: AdminProduct) => p.variants.some((v) => v.stock < 2);

  // Aplicar búsqueda + filtros.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))) return false;
      if (fCategory && p.category !== fCategory) return false;
      if (fSize && !p.variants.some((v) => v.size === fSize)) return false;
      if (fColor && !p.variants.some((v) => v.color === fColor)) return false;
      if (fStock !== 'all') {
        const total = totalStock(p);
        if (fStock === 'in' && total <= 0) return false;
        if (fStock === 'out' && total !== 0) return false;
        if (fStock === 'low' && !isLow(p)) return false;
      }
      return true;
    });
  }, [products, query, fCategory, fSize, fColor, fStock]);

  const hasActiveFilters = query || fCategory || fSize || fColor || fStock !== 'all';
  const clearFilters = () => {
    setQuery(''); setFCategory(''); setFSize(''); setFColor(''); setFStock('all');
  };

  const handleToggleFeatured = async (p: AdminProduct) => {
    const next = !p.featured;
    setTogglingFeatured(p.id);
    // Optimistic update
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, featured: next } : x)));
    try {
      await adminApi.products.update(p.id, { featured: next });
    } catch {
      // Revert on error
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, featured: !next } : x)));
      alert('No se pudo actualizar el destacado. Intenta de nuevo.');
    } finally {
      setTogglingFeatured(null);
    }
  };

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

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-gray-400 text-sm mt-1">
            {hasActiveFilters
              ? `${filtered.length} de ${products.length} productos`
              : `${products.length} productos en catálogo`}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo producto
        </Link>
      </div>

      {/* Búsqueda y filtros */}
      {!loading && (
        <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-wrap items-center gap-2">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          <select value={fCategory} onChange={(e) => setFCategory(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">Categoría: todas</option>
            {categories.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>

          <select value={fSize} onChange={(e) => setFSize(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">Talla: todas</option>
            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={fColor} onChange={(e) => setFColor(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">Color: todos</option>
            {colors.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={fStock} onChange={(e) => setFStock(e.target.value as StockFilter)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="all">Stock: todos</option>
            <option value="in">Con stock</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary-600 px-2 py-2">
              <XMarkIcon className="h-4 w-4" /> Limpiar
            </button>
          )}
        </div>
      )}

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
                <th className="px-5 py-3 font-semibold text-gray-500">Destacado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
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
                    <td className="px-5 py-3 font-medium text-gray-700 nums">{formatPrice(p.base_price)}</td>
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
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        disabled={togglingFeatured === p.id}
                        role="switch"
                        aria-checked={p.featured}
                        aria-label={p.featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                        title={p.featured ? 'Destacado — clic para quitar' : 'Marcar como destacado'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                          p.featured ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            p.featured ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
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
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No hay productos que coincidan con la búsqueda o los filtros.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
