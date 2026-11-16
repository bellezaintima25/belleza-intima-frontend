'use client';

import { useEffect, useRef, useState } from 'react';
import { loadRecaptcha, recaptchaEnabled, RECAPTCHA_V2_KEY } from '@/lib/recaptcha';
import { WHATSAPP_URL } from '@/lib/contact';

const WIDGET_WIDTH = 304; // ancho fijo de la casilla de Google
const WIDGET_HEIGHT = 78;

interface Props {
  onToken: (token: string) => void;
  onExpired: () => void;
  /** Súbelo para reiniciar la casilla (el token anterior ya se gastó). */
  resetKey: number;
}

/** Casilla "No soy un robot" (v2). Solo se muestra cuando el servidor pide el reto. */
export default function RecaptchaChallenge({ onToken, onExpired, resetKey }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [scale, setScale] = useState(1);

  const callbacks = useRef({ onToken, onExpired });
  callbacks.current = { onToken, onExpired };

  // Dibuja la casilla de Google.
  useEffect(() => {
    let cancelled = false;
    if (!recaptchaEnabled || !RECAPTCHA_V2_KEY) {
      setFailed(true);
      return;
    }
    // Si no aparece en 10 s (bloqueador de anuncios, sin red), se ofrece una salida.
    const timer = setTimeout(() => { if (widgetId.current === null && !cancelled) setFailed(true); }, 10000);
    loadRecaptcha().then((g) => {
      if (cancelled) return;
      if (!g || !hostRef.current) return setFailed(true);
      if (widgetId.current !== null) return;
      try {
        hostRef.current.innerHTML = '';
        widgetId.current = g.render(hostRef.current, {
          sitekey: RECAPTCHA_V2_KEY,
          callback: (t) => callbacks.current.onToken(t),
          'expired-callback': () => callbacks.current.onExpired(),
          'error-callback': () => callbacks.current.onExpired(),
        });
      } catch {
        setFailed(true);
      }
    });
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  // En celular la casilla puede quedar bajo el borde de la pantalla: se lleva a la vista al aparecer.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      (wrapRef.current ?? hostRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Reinicia la casilla cuando el token ya se usó o falló.
  useEffect(() => {
    if (resetKey > 0 && widgetId.current !== null) window.grecaptcha?.reset(widgetId.current);
  }, [resetKey]);

  // La casilla mide 304 px: en pantallas más angostas se reduce para no provocar scroll lateral.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / WIDGET_WIDTH));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [failed]);

  if (failed) {
    return (
      <p role="alert" className="text-sm text-amber-800 bg-amber-50 rounded-xl px-3.5 py-2.5 leading-relaxed">
        No pudimos cargar la verificación de seguridad (a veces la impide un bloqueador de anuncios).
        Desactívalo para esta página e inténtalo de nuevo, o{' '}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
          escríbenos por WhatsApp
        </a>{' '}
        y te ayudamos.
      </p>
    );
  }

  return (
    <div ref={wrapRef} className="w-full" role="group" aria-label="Verificación de seguridad">
      <div style={{ height: WIDGET_HEIGHT * scale }}>
        <div
          ref={hostRef}
          style={{ width: WIDGET_WIDTH, height: WIDGET_HEIGHT, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        />
      </div>
    </div>
  );
}

/** Aviso que Google exige cuando se oculta la insignia flotante de reCAPTCHA. */
export function RecaptchaNotice({ className = '' }: { className?: string }) {
  if (!recaptchaEnabled) return null;
  return (
    <p className={`text-[11px] leading-snug text-gray-400 ${className}`}>
      Este sitio está protegido por reCAPTCHA y se aplican la{' '}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
        Política de privacidad
      </a>{' '}
      y los{' '}
      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
        Términos de servicio
      </a>{' '}
      de Google.
    </p>
  );
}
