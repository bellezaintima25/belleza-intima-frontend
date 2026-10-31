'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Combo } from '@/lib/api';
import ComboCard from '@/components/ComboCard';

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.combos.list()
      .then(setCombos)
      .catch(() => setError('No se pudieron cargar los combos. Verifica que el servidor esté corriendo.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Encabezado al estilo del catálogo */}
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl font-semibold text-primary-700 mb-2">Un mundo de combinaciones</h1>
        <p className="text-gray-500">Prendas que se complementan, a un precio especial pensado para ti.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-400">
          <p>{error}</p>
        </div>
      ) : combos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <span className="text-5xl block mb-3">🎁</span>
          <p>Muy pronto tendremos combos de promoción.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {combos.map((c, i) => (
            <ComboCard key={c.id} combo={c} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
