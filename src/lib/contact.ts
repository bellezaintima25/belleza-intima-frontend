/** Datos de contacto compartidos por toda la tienda. */

// Número de WhatsApp de la tienda (con código de país, sin + ni espacios).
// Se puede sobreescribir con NEXT_PUBLIC_WHATSAPP_NUMBER.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '573217795555';

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

/** Enlace de WhatsApp con un mensaje ya escrito. */
export function whatsappLink(message: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
