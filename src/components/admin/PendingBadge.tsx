'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';

/** Evento que la bandeja de testimonios dispara al cambiar el estado de un comentario. */
export const TESTIMONIALS_CHANGED = 'testimonials:changed';

/** Globito con la cantidad de comentarios pendientes de revisar (se oculta si es 0). */
export default function PendingBadge({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    adminApi.testimonials.pendingCount().then((r) => setCount(r.count)).catch(() => null);
  }, []);

  // Al cargar y al navegar entre secciones del admin.
  useEffect(() => { refresh(); }, [pathname, refresh]);
  // Al aprobar/rechazar desde la bandeja, se actualiza al instante.
  useEffect(() => {
    window.addEventListener(TESTIMONIALS_CHANGED, refresh);
    return () => window.removeEventListener(TESTIMONIALS_CHANGED, refresh);
  }, [refresh]);

  if (count <= 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-primary-600 text-white font-bold nums ${
        compact ? 'absolute top-1 right-1/4 h-4 min-w-[1rem] px-1 text-[10px]' : 'ml-auto h-5 min-w-[1.25rem] px-1.5 text-[11px]'
      }`}
      aria-label={`${count} comentario${count !== 1 ? 's' : ''} pendiente${count !== 1 ? 's' : ''} de revisar`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
