/** Datos de contacto compartidos por toda la tienda. */

// Número de WhatsApp de la tienda (con código de país, sin + ni espacios).
// Se puede sobreescribir con NEXT_PUBLIC_WHATSAPP_NUMBER.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '573217795555';

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const PENDING_WA_KEY = 'bi_pending_whatsapp';

/**
 * Abre WhatsApp en otra pestaña. Si el navegador bloquea la ventana (pasa cuando el envío
 * se repite solo tras resolver la casilla de reCAPTCHA, porque ya no viene de un clic nuestro),
 * guarda el enlace para que la página de éxito ofrezca un botón que sí lo abra.
 */
export function openWhatsAppOrStash(url: string): void {
  const win = window.open(url, '_blank');
  if (!win) {
    try { window.sessionStorage.setItem(PENDING_WA_KEY, url); } catch { /* sin almacenamiento: nada que guardar */ }
  }
}

/** Enlace de WhatsApp pendiente de abrir (si el navegador bloqueó la ventana). */
export function getPendingWhatsApp(): string | null {
  try { return window.sessionStorage.getItem(PENDING_WA_KEY); } catch { return null; }
}

export function clearPendingWhatsApp(): void {
  try { window.sessionStorage.removeItem(PENDING_WA_KEY); } catch { /* nada */ }
}

/** Enlace de WhatsApp con un mensaje ya escrito. */
export function whatsappLink(message: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
