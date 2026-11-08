'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/adminApi';
import { getSession } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Si ya hay una sesión válida, no hace falta volver a ingresar.
    if (getSession()) { router.replace('/admin'); return; }
    // Se lee de la URL del navegador (useSearchParams obligaría a envolver la página en Suspense).
    setExpired(new URLSearchParams(window.location.search).get('expired') === '1');
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!username.trim()) return setError('Escribe tu usuario.');
    if (!password) return setError('Escribe tu contraseña.');
    setLoading(true);
    try {
      await adminApi.auth.login(username.trim(), password, remember);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ingresar. Inténtalo de nuevo.');
      setPassword('');
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300';

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl ring-1 ring-primary-100/70 px-7 py-9">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.svg" alt="Belleza Íntima" width={64} height={64} priority />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-primary-700">Panel de administración</h1>
          <p className="mt-1 text-sm text-gray-500">Ingresa con tu usuario y contraseña.</p>
        </div>

        {expired && !error && (
          <p role="status" className="mt-5 text-sm text-amber-700 bg-amber-50 rounded-xl px-3.5 py-2.5">
            Tu sesión venció. Ingresa de nuevo para continuar.
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="login-user" className="block text-xs font-semibold text-gray-600 mb-1">Usuario</label>
            <input
              id="login-user" className={inputCls} value={username} autoFocus
              autoComplete="username" autoCapitalize="none" spellCheck={false}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="login-pass" className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
            <div className="relative">
              <input
                id="login-pass" className={`${inputCls} pr-11`} value={password}
                type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-400"
            />
            <span>
              Mantener la sesión abierta por 7 días
              <span className="block text-xs text-gray-400">Úsalo solo en tu propio dispositivo.</span>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3.5 py-2.5">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-full transition-colors"
          >
            <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}
