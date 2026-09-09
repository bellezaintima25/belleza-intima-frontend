'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { adminApi } from '@/lib/adminApi';

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: object) => {
    const product = await adminApi.products.create(data);
    router.push(`/admin/products/${product.id}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Nuevo producto</h1>
      <ProductForm onSubmit={handleSubmit} />
    </div>
  );
}
