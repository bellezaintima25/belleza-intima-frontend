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
  };
  return labels[cat] ?? cat;
}
