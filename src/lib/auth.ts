/**
 * Sesión del panel de administración (solo en el navegador).
 *
 * El token se guarda en sessionStorage (se borra al cerrar la pestaña) o, si la
 * persona marca "mantener sesión abierta", en localStorage. El token vence solo
 * (lo decide el servidor) y se descarta aquí en cuanto vence.
 */

const KEY = 'bi_admin_session';

export interface AdminUser {
  username: string;
  display_name: string;
}

export interface AdminSession {
  token: string;
  expiresAt: string; // ISO
  user: AdminUser;
}

function read(storage: Storage | undefined): AdminSession | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AdminSession;
    if (!s?.token || !s?.expiresAt) return null;
    if (new Date(s.expiresAt).getTime() <= Date.now()) {
      storage?.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

/** Sesión actual o null si no hay (o ya venció). */
export function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  return read(window.sessionStorage) ?? read(window.localStorage);
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function saveSession(session: AdminSession, remember: boolean): void {
  clearSession();
  (remember ? window.localStorage : window.sessionStorage).setItem(KEY, JSON.stringify(session));
}

/** Actualiza el token/usuario conservando dónde estaba guardada la sesión. */
export function replaceSession(session: AdminSession): void {
  const remember = !!read(window.localStorage);
  saveSession(session, remember);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KEY);
  window.localStorage.removeItem(KEY);
}
