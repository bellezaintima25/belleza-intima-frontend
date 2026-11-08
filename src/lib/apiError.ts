/**
 * Utilidades compartidas para convertir errores de la API en mensajes claros
 * en español, pensados para que cualquier persona (clienta o admin) los entienda.
 */

export const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.';

/** fetch que, si la red falla, lanza un error con un mensaje entendible. */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
}

/** Lee una respuesta con error y devuelve un mensaje claro en español. */
export async function readApiError(res: Response): Promise<string> {
  const raw = await res.text();

  try {
    // FastAPI responde {"detail": "texto"} o, en validaciones (422), {"detail": [...]}.
    const parsed = JSON.parse(raw);
    if (typeof parsed?.detail === 'string' && parsed.detail.trim()) {
      return parsed.detail;
    }
    if (Array.isArray(parsed?.detail) && parsed.detail.length > 0) {
      return 'Hay datos incompletos o con un formato incorrecto. Revísalos e inténtalo de nuevo.';
    }
  } catch {
    // La respuesta no era JSON: se decide según el código de estado.
  }

  if (res.status === 400) return 'No se pudo procesar la solicitud. Revisa los datos e inténtalo de nuevo.';
  if (res.status === 401) return 'Necesitas iniciar sesión para hacer esto.';
  if (res.status === 403) return 'No tienes permiso para hacer esta acción.';
  if (res.status === 404) return 'No se encontró lo que buscabas. Puede que ya no exista.';
  if (res.status === 405) return 'Esta acción no está permitida.';
  if (res.status === 409) return 'Esto choca con información que ya existe. Revisa los datos e inténtalo de nuevo.';
  if (res.status === 413) return 'El archivo es demasiado grande. Prueba con uno más liviano.';
  if (res.status === 415) return 'Ese tipo de archivo no es compatible. Usa una imagen (JPG, PNG, WEBP o AVIF).';
  if (res.status === 422) return 'Hay datos incompletos o con un formato incorrecto. Revísalos e inténtalo de nuevo.';
  if (res.status === 429) return 'Hiciste demasiados intentos seguidos. Espera un momento e inténtalo de nuevo.';
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return 'El servidor no está disponible en este momento. Inténtalo de nuevo en unos minutos.';
  }
  if (res.status >= 500) return 'Ocurrió un problema en el servidor. Inténtalo de nuevo en unos minutos.';

  // Texto plano corto (no JSON ni HTML): se puede mostrar tal cual.
  const text = raw.trim();
  if (text && text.length <= 200 && !/^[{<\[]/.test(text)) return text;

  return 'No se pudo completar la acción. Inténtalo de nuevo.';
}
