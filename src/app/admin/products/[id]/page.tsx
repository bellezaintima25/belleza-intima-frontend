'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/adminApi';
import type { AdminProduct } from '@/lib/adminApi';
import { categoryLabel } from '@/lib/format';
import ProductForm from '@/components/admin/ProductForm';
import ColorVariantsEditor from '@/components/admin/ColorVariantsEditor';

type Tab = 'variants' | 'info';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('variants');
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string, ok = true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, ok });
    toastTimer.current = setTimeout(() => setToast(null), ok ? 2500 : 5000);
  };

  useEffect(() => {
    adminApi.products
      .get(Number(id))
      .then(setProduct)
      .finally(() => setLoading(false));
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [id]);

  const handleUpdateProduct = async (data: object) => {
    const updated = await adminApi.products.update(Number(id), data);
    setProduct(updated);
    notify('Producto guardado');
  };

  if (loading || !product) {
    return <div className="p-8 text-gray-400 animate-pulse">Cargando producto...</div>;
  }

  const tabBtn = (key: Tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      role="tab"
      aria-selected={tab === key}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        tab === key
          ? 'border-primary-600 text-primary-700'
          : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary-600 mb-6">
        <ArrowLeftIcon className="h-4 w-4" /> Volver
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{product.name}</h1>
          <p className="text-gray-400 text-sm">{product.code} · {categoryLabel(product.category)}</p>
        </div>
        <a
          href={`/products/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 border border-primary-200 hover:bg-primary-50 rounded-xl px-3.5 py-2 transition-colors"
        >
          Ver en la tienda <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </a>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-gray-200 mb-6">
        {tabBtn('variants', 'Colores, tallas y fotos')}
        {tabBtn('info', 'Información y precio')}
      </div>

      {tab === 'variants' ? (
        <ColorVariantsEditor product={product} setProduct={setProduct} notify={notify} />
      ) : (
        <ProductForm
          initial={product}
          onSubmit={handleUpdateProduct}
          submitLabel="Guardar cambios"
        />
      )}

      {/* Aviso de guardado / error */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.ok ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationCircleIcon className="h-5 w-5" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
