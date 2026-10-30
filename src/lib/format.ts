export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    SET: 'Sets',
    BODY: 'Bodies',
    CORSET: 'Corsets',
    PANTY: 'Pantys',
    PIJAMA: 'Pijamas',
    COMBO: 'Combos',
  };
  return labels[cat] ?? cat;
}

// Número de pedido visible: más largo y menos obvio que el id secuencial.
// Se deriva del id real con un desfase fijo y relleno a 6 dígitos.
// Ej: id 3 -> "BI-100003". No es secreto (para eso está el token de seguimiento),
// solo evita exponer un contador obvio desde 1.
const ORDER_OFFSET = 100000;

export function orderNumber(id: number): string {
  return `BI-${ORDER_OFFSET + id}`;
}

/**
 * Convierte lo que el cliente escribe (ej. "BI-100003", "100003" o "3")
 * de vuelta al id real del pedido, o null si no es válido.
 */
export function parseOrderNumber(input: string): number | null {
  const digits = (input || '').replace(/\D/g, '');
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  // Si viene con el desfase (>= ORDER_OFFSET), lo restamos; si no, es el id directo.
  const id = n >= ORDER_OFFSET ? n - ORDER_OFFSET : n;
  return id > 0 ? id : null;
}
