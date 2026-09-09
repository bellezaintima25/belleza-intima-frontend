'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { TrashIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/adminApi';
import type { AdminProduct, VariantOut } from '@/lib/adminApi';
import { formatPrice, categoryLabel } from '@/lib/format';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imgColor, setImgColor] = useState('');
  const [stockEdits, setStockEdits] = useState<Record<number, number>>({});
  const [newVariant, setNewVariant] = useState({ size: '', color: '', stock: 1, price: '' });
  const [addingVariant, setAddingVariant] = useState(false);

  const load = () => {
    adminApi.products.get(Number(id)).then((p) => {
      setProduct(p);
      const edits: Record<number, number> = {};
      p.variants.forEach((v) => { edits[v.id] = v.stock; });
      setStockEdits(edits);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdateProduct = async (data: object) => {
    setSaving(true);
    try {
      const updated = await adminApi.products.update(Number(id), data);
      setProduct(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleStockSave = async (variant: VariantOut) => {
    const newStock = stockEdits[variant.id];
    if (newStock === variant.stock) return;
    await adminApi.variants.updateStock(Number(id), variant.id, newStock);
    setProduct((prev) =>
      prev ? { ...prev, variants: prev.variants.map((v) => v.id === variant.id ? { ...v, stock: newStock } : v) } : prev
    );
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm('¿Eliminar esta variante?')) return;
    await adminApi.variants.delete(Number(id), variantId);
    setProduct((prev) =>
      prev ? { ...prev, variants: prev.variants.filter((v) => v.id !== variantId) } : prev
    );
  };

  const handleAddVariant = async () => {
    if (!newVariant.size || !newVariant.color) return;
    setAddingVariant(true);
    try {
      const v = await adminApi.variants.add(Number(id), {
        size: newVariant.size,
        color: newVariant.color,
        stock: Number(newVariant.stock),
        price: newVariant.price ? Number(newVariant.price) : null,
      });
      setProduct((prev) => prev ? { ...prev, variants: [...prev.variants, v] } : prev);
      setStockEdits((prev) => ({ ...prev, [v.id]: v.stock }));
      setNewVariant({ size: '', color: '', stock: 1, price: '' });
    } finally {
      setAddingVariant(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const img = await adminApi.images.upload(Number(id), file, imgColor || null, product!.images.length);
      setProduct((prev) => prev ? { ...prev, images: [...prev.images, img] } : prev);
      setImgColor('');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    await adminApi.images.delete(Number(id), imageId);
    setProduct((prev) =>
      prev ? { ...prev, images: prev.images.filter((img) => img.id !== imageId) } : prev
    );
  };

  if (loading || !product) {
    return <div className="p-8 text-gray-400 animate-pulse">Cargando producto...</div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary-600 mb-6">
        <ArrowLeftIcon className="h-4 w-4" /> Volver
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">{product.name}</h1>
      <p className="text-gray-400 text-sm mb-8">{product.code} · {categoryLabel(product.category)}</p>

      {/* Product info form */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-700 mb-4">Información general</h2>
        <ProductForm
          initial={product}
          onSubmit={handleUpdateProduct}
          submitLabel={saving ? 'Guardando...' : 'Guardar cambios'}
        />
      </section>

      {/* Variants */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-700 mb-4">Variantes</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-500">Talla</th>
                <th className="px-4 py-3 font-semibold text-gray-500">Color</th>
                <th className="px-4 py-3 font-semibold text-gray-500">Precio</th>
                <th className="px-4 py-3 font-semibold text-gray-500">Stock</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 text-gray-700">{v.size}</td>
                  <td className="px-4 py-3 text-gray-700">{v.color}</td>
                  <td className="px-4 py-3 text-gray-500">{v.price ? formatPrice(v.price) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={stockEdits[v.id] ?? v.stock}
                        onChange={(e) => setStockEdits((prev) => ({ ...prev, [v.id]: Number(e.target.value) }))}
                        onBlur={() => handleStockSave(v)}
                        className={`w-16 border rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                          (stockEdits[v.id] ?? v.stock) < 2 ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                        }`}
                      />
                      {(stockEdits[v.id] ?? v.stock) < 2 && (
                        <span className="text-amber-400 text-xs">⚠️</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteVariant(v.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add variant */}
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Agregar variante</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              placeholder="Talla (ej: M)"
              value={newVariant.size}
              onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              placeholder="Color (ej: Rosa)"
              value={newVariant.color}
              onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              placeholder="Precio (opcional)"
              type="number"
              value={newVariant.price}
              onChange={(e) => setNewVariant((p) => ({ ...p, price: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              placeholder="Stock"
              type="number"
              min="0"
              value={newVariant.stock}
              onChange={(e) => setNewVariant((p) => ({ ...p, stock: Number(e.target.value) }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <button
            onClick={handleAddVariant}
            disabled={addingVariant || !newVariant.size || !newVariant.color}
            className="mt-3 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            {addingVariant ? 'Agregando...' : 'Agregar variante'}
          </button>
        </div>
      </section>

      {/* Images */}
      <section>
        <h2 className="text-base font-bold text-gray-700 mb-4">Imágenes</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {/* Existing images */}
          {product.images.map((img) => (
            <div key={img.id} className="relative group">
              <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-primary-50">
                <Image src={img.url} alt={img.color ?? 'imagen'} fill sizes="150px" className="object-cover" />
              </div>
              {img.color && (
                <p className="text-xs text-center text-gray-500 mt-1 truncate">{img.color}</p>
              )}
              <button
                onClick={() => handleDeleteImage(img.id)}
                className="absolute top-1.5 right-1.5 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Upload card — same size as image cards */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
            {/* Color input shown above the + card */}
            <input
              placeholder="Color (ej: Rosa)"
              value={imgColor}
              onChange={(e) => setImgColor(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400 mb-2"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImg}
              className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50 group"
            >
              {uploadingImg ? (
                <span className="text-xs text-gray-400">Subiendo...</span>
              ) : (
                <>
                  <PlusIcon className="h-8 w-8 text-gray-300 group-hover:text-primary-400 transition-colors" />
                  <span className="text-xs text-gray-400 group-hover:text-primary-500 transition-colors">Agregar foto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
