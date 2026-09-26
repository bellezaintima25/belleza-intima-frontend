'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

/**
 * PageLoader
 *
 * Pantalla de carga a pantalla completa con el logo (logoB.svg) animándose
 * desde el centro hacia afuera. Aparece en dos escenarios:
 *
 *  1. Carga inicial de la página (evento `load` de window).
 *  2. Navegaciones internas — PERO solo si se demoran (p. ej. internet lento).
 *     Al iniciar una navegación se arranca un temporizador de gracia; si la
 *     nueva página llega antes de que expire, el loader NO se muestra (evita
 *     parpadeos en navegaciones instantáneas). Si la navegación tarda más que
 *     el umbral, se muestra hasta que la ruta termina de cambiar.
 */

// Umbral (ms) tras el cual una navegación se considera "lenta" y muestra loader.
const SLOW_NAV_THRESHOLD_MS = 400;
// Duración mínima visible una vez mostrado, para que la animación se aprecie.
const MIN_VISIBLE_MS = 500;
// Duración del fundido de salida (debe coincidir con la transición del CSS).
const FADE_MS = 400;
// Tope de seguridad: nunca dejar el loader bloqueado.
const SAFETY_MS = 8000;

export default function PageLoader() {
  const pathname = usePathname();

  const [visible, setVisible] = useState(true); // montado + opaco
  const [fading, setFading] = useState(false); // en transición de salida

  // Timers y marcas de tiempo compartidos entre efectos.
  const graceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef<number>(Date.now());
  // Ruta actual, para distinguir "inicio" de "fin" de navegación.
  const currentPath = useRef<string | null>(null);

  const clearTimers = () => {
    if (graceTimer.current) clearTimeout(graceTimer.current);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
  };

  const show = () => {
    clearTimers();
    shownAt.current = Date.now();
    setFading(false);
    setVisible(true);
    // Seguridad: ocultar pase lo que pase.
    safetyTimer.current = setTimeout(hide, SAFETY_MS);
  };

  const hide = () => {
    // Respeta la duración mínima visible antes de iniciar el fundido.
    const elapsed = Date.now() - shownAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    fadeTimer.current = setTimeout(() => {
      setFading(true);
      fadeTimer.current = setTimeout(() => {
        setVisible(false);
        setFading(false);
      }, FADE_MS);
    }, wait);
  };

  // --- Carga inicial ---------------------------------------------------- //
  useEffect(() => {
    const onLoad = () => hide();
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
    }
    safetyTimer.current = setTimeout(hide, SAFETY_MS);
    return () => window.removeEventListener('load', onLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Detectar INICIO de navegaciones internas ------------------------- //
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      // Solo clics simples con botón izquierdo, sin modificadores.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');
      if (!href || target === '_blank' || href.startsWith('#')) return;

      // ¿Es un enlace interno hacia una ruta distinta?
      let dest: URL;
      try {
        dest = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (dest.origin !== window.location.origin) return; // externo
      const samePage =
        dest.pathname === window.location.pathname &&
        dest.search === window.location.search;
      if (samePage) return;

      // Navegación interna hacia otra página: arrancamos el temporizador de
      // gracia. Solo si tarda más que el umbral, mostramos el loader.
      if (graceTimer.current) clearTimeout(graceTimer.current);
      graceTimer.current = setTimeout(show, SLOW_NAV_THRESHOLD_MS);
    };

    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Detectar FIN de navegación (cambió la ruta renderizada) ---------- //
  useEffect(() => {
    if (currentPath.current === null) {
      // Primer render: registrar ruta inicial, no hacer nada más.
      currentPath.current = pathname;
      return;
    }
    if (currentPath.current !== pathname) {
      currentPath.current = pathname;
      // La navegación terminó: cancelamos el temporizador de gracia (por si la
      // navegación fue rápida y aún no había mostrado el loader) y ocultamos.
      if (graceTimer.current) clearTimeout(graceTimer.current);
      hide();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Limpieza global al desmontar.
  useEffect(() => clearTimers, []);

  if (!visible) return null;

  return (
    <div
      className={`page-loader ${fading ? 'page-loader--out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Cargando"
    >
      <div className="page-loader__stage">
        {/* Anillos que se expanden del centro hacia afuera */}
        <span className="page-loader__ring" />
        <span className="page-loader__ring page-loader__ring--delay" />

        {/* Logo con animación de aparición desde el centro */}
        <Image
          src="/logoB.svg"
          alt="Belleza Íntima"
          width={200}
          height={200}
          priority
          className="page-loader__logo"
        />
      </div>
    </div>
  );
}
