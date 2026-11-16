'use client';

import { useCallback, useRef, useState } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import RecaptchaChallenge from '@/components/RecaptchaChallenge';
import { ApiError } from '@/lib/apiError';
import type { CaptchaTokens } from '@/lib/api';
import { getV3Token, preloadRecaptcha } from '@/lib/recaptcha';

export interface CaptchaGate {
  /** Empieza a cargar reCAPTCHA (llámalo cuando se abre el formulario). */
  preload: () => void;
  /** Tokens a enviar con la petición: v3 nuevo y, si ya se resolvió, el de la casilla. */
  tokens: () => Promise<CaptchaTokens>;
  /** Pásale el error de un envío: si era "falta la casilla" (428) la muestra y devuelve true. */
  handleError: (err: unknown) => boolean;
  /** Llámalo tras cada intento que pudo gastar el token de la casilla (éxito o error). */
  consume: () => void;
  /** Oculta la casilla y olvida el token (p. ej. al cerrar el formulario). */
  reset: () => void;
  /** Función a repetir automáticamente cuando la casilla se resuelve. */
  retry: MutableRefObject<(() => void) | null>;
  /** Casilla v2 para pintar en el formulario (null mientras no haga falta). */
  widget: ReactNode;
  challengeVisible: boolean;
}

/**
 * Flujo de reCAPTCHA de un formulario:
 *  1) Se envía con un token silencioso (v3).
 *  2) Si el servidor responde 428, se muestra la casilla (v2).
 *  3) Al resolverla se repite el envío solo, con el token de la casilla.
 */
export function useCaptcha(action: string): CaptchaGate {
  const [challengeVisible, setChallengeVisible] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const v2Token = useRef<string | null>(null);
  const retry = useRef<(() => void) | null>(null);

  const tokens = useCallback(async (): Promise<CaptchaTokens> => {
    const v3 = await getV3Token(action);
    return {
      captcha_token: v3 || undefined,
      captcha_v2_token: v2Token.current || undefined,
    };
  }, [action]);

  const handleError = useCallback((err: unknown): boolean => {
    if (err instanceof ApiError && err.status === 428) {
      v2Token.current = null;
      setChallengeVisible(true);
      setResetKey((k) => k + 1);
      return true;
    }
    return false;
  }, []);

  const consume = useCallback(() => {
    if (v2Token.current) {
      v2Token.current = null;
      setResetKey((k) => k + 1); // el token ya se gastó: la casilla vuelve a pedirse
    }
  }, []);

  const reset = useCallback(() => {
    v2Token.current = null;
    setChallengeVisible(false);
  }, []);

  const widget = challengeVisible ? (
    <RecaptchaChallenge
      resetKey={resetKey}
      onToken={(t) => {
        v2Token.current = t;
        retry.current?.(); // repite el envío automáticamente
      }}
      onExpired={() => {
        v2Token.current = null;
      }}
    />
  ) : null;

  return { preload: preloadRecaptcha, tokens, handleError, consume, reset, retry, widget, challengeVisible };
}
