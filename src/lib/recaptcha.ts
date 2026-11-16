/**
 * Google reCAPTCHA en el navegador: v3 (silencioso) + v2 (casilla de reto).
 *
 * - Sin NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY el captcha queda desactivado: no se carga
 *   nada de Google y los formularios funcionan igual (útil en local).
 * - El script de Google se carga SOLO cuando un formulario protegido se abre
 *   (checkout, pedido de combo, comentarios), no en todo el sitio.
 * - Cada token vale 2 minutos y se usa una sola vez: se pide uno nuevo en cada envío.
 */

export const RECAPTCHA_V3_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY ?? '';
export const RECAPTCHA_V2_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY ?? '';

export const recaptchaEnabled = Boolean(RECAPTCHA_V3_KEY);

export interface RecaptchaApi {
  ready(cb: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
  render(
    container: HTMLElement,
    params: {
      sitekey: string;
      theme?: 'light' | 'dark';
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ): number;
  reset(widgetId?: number): void;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

let loader: Promise<RecaptchaApi | null> | null = null;

/** Carga el script de Google una sola vez. Devuelve null si está bloqueado o sin red. */
export function loadRecaptcha(): Promise<RecaptchaApi | null> {
  if (!recaptchaEnabled || typeof window === 'undefined') return Promise.resolve(null);
  if (loader) return loader;
  loader = new Promise<RecaptchaApi | null>((resolve) => {
    const script = document.createElement('script');
    // render=<clave v3> habilita v3 y deja disponible grecaptcha.render() para la casilla v2.
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_V3_KEY)}&hl=es`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const g = window.grecaptcha;
      if (!g) return resolve(null);
      g.ready(() => resolve(g));
    };
    script.onerror = () => {
      // Bloqueado (adblock) o sin conexión: se permite reintentar más tarde.
      script.remove();
      loader = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return loader;
}

/** Empieza a cargar reCAPTCHA (para que v3 observe la visita antes del envío). */
export function preloadRecaptcha(): void {
  void loadRecaptcha();
}

/**
 * Token silencioso (v3) para una acción. Devuelve '' si el captcha está desactivado,
 * bloqueado o tarda demasiado: el servidor decidirá entonces si pide la casilla.
 */
export async function getV3Token(action: string, timeoutMs = 6000): Promise<string> {
  if (!recaptchaEnabled) return '';
  try {
    const g = await loadRecaptcha();
    if (!g) return '';
    const timeout = new Promise<string>((resolve) => setTimeout(() => resolve(''), timeoutMs));
    return await Promise.race([g.execute(RECAPTCHA_V3_KEY, { action }), timeout]);
  } catch {
    return '';
  }
}
