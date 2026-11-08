'use client';

import { useEffect, useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/adminApi';
import type { TeamMember } from '@/lib/adminApi';

/** Contraseña aleatoria de 16 caracteres (sin letras que se confundan: 0/O, 1/l/I). */
function generatePassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('');
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString('es-CO', {
        day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : 'Nunca';

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300';

/** Muestra una contraseña temporal UNA sola vez, con botón de copiar. */
function SecretBox({ title, password, onClose }: { title: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* si el navegador no deja copiar, se puede seleccionar a mano */ }
  };
  return (
    <div role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-800">{title}</p>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <code className="select-all rounded-lg bg-white border border-amber-200 px-3 py-1.5 text-sm font-mono text-gray-800">{password}</code>
        <button onClick={copy} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-lg">
          {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
          {copied ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <p className="mt-2 text-xs text-amber-700">
        Anótala o envíasela ahora: <b>no se vuelve a mostrar</b>. La persona puede cambiarla desde esta misma página, en “Mi contraseña”.
      </p>
      <button onClick={onClose} className="mt-2 text-xs text-amber-700 underline">Ya la guardé</button>
    </div>
  );
}

export default function AccountPage() {
  // ---- Mi contraseña ----
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const changeMine = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null); setPwErr(null);
    if (!current) return setPwErr('Escribe tu contraseña actual.');
    if (next.length < 10) return setPwErr('La contraseña nueva debe tener al menos 10 caracteres.');
    if (next !== again) return setPwErr('Las contraseñas nuevas no coinciden.');
    setPwBusy(true);
    try {
      await adminApi.auth.changePassword(current, next);
      setCurrent(''); setNext(''); setAgain('');
      setPwMsg('Contraseña cambiada. Se cerraron tus sesiones en otros dispositivos.');
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setPwBusy(false);
    }
  };

  // ---- Equipo ----
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamErr, setTeamErr] = useState<string | null>(null);
  const [teamMsg, setTeamMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [secret, setSecret] = useState<{ title: string; password: string } | null>(null);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState(() => generatePassword());
  const [createBusy, setCreateBusy] = useState(false);

  const load = async () => {
    try {
      setTeam(await adminApi.team.list());
    } catch (e) {
      setTeamErr(e instanceof Error ? e.message : 'No se pudo cargar el equipo.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamErr(null); setTeamMsg(null); setSecret(null);
    if (!newName.trim()) return setTeamErr('Escribe el nombre de la persona.');
    if (!newUser.trim()) return setTeamErr('Escribe el usuario (sin tildes ni espacios, ej. ana).');
    setCreateBusy(true);
    try {
      const m = await adminApi.team.create({
        username: newUser.trim(), display_name: newName.trim(), password: newPass,
      });
      setSecret({ title: `Contraseña temporal de ${m.display_name} (usuario: ${m.username})`, password: newPass });
      setNewName(''); setNewUser(''); setNewPass(generatePassword()); setAdding(false);
      await load();
    } catch (err) {
      setTeamErr(err instanceof Error ? err.message : 'No se pudo agregar a la persona.');
    } finally {
      setCreateBusy(false);
    }
  };

  const resetPassword = async (m: TeamMember) => {
    if (!confirm(`¿Restablecer la contraseña de ${m.display_name}? Se cerrarán sus sesiones abiertas.`)) return;
    const password = generatePassword();
    setBusyId(m.id); setTeamErr(null); setTeamMsg(null); setSecret(null);
    try {
      await adminApi.team.resetPassword(m.id, password);
      setSecret({ title: `Nueva contraseña de ${m.display_name} (usuario: ${m.username})`, password });
    } catch (err) {
      setTeamErr(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (m: TeamMember) => {
    if (m.active && !confirm(`¿Quitar el acceso a ${m.display_name}? No podrá ingresar al panel (puedes reactivarla después).`)) return;
    setBusyId(m.id); setTeamErr(null); setTeamMsg(null);
    try {
      const updated = await adminApi.team.setActive(m.id, !m.active);
      setTeam((list) => list.map((x) => (x.id === m.id ? updated : x)));
      setTeamMsg(updated.active ? `${m.display_name} puede ingresar de nuevo.` : `${m.display_name} ya no tiene acceso.`);
    } catch (err) {
      setTeamErr(err instanceof Error ? err.message : 'No se pudo cambiar el acceso.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800">Equipo y cuenta</h1>
      <p className="text-gray-400 text-sm mt-1 mb-8">Quién puede entrar al panel y cómo mantener tu cuenta segura.</p>

      {/* ---------------- Mi contraseña ---------------- */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-700 mb-1">
          <KeyIcon className="h-5 w-5 text-primary-500" aria-hidden="true" /> Mi contraseña
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Mínimo 10 caracteres, que no sea solo números ni algo fácil de adivinar. Al cambiarla se cierran tus otras sesiones abiertas.
        </p>
        <form onSubmit={changeMine} className="space-y-3 max-w-sm" noValidate>
          <div>
            <label htmlFor="pw-current" className="block text-xs font-semibold text-gray-600 mb-1">Contraseña actual</label>
            <input id="pw-current" type="password" autoComplete="current-password" className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pw-new" className="block text-xs font-semibold text-gray-600 mb-1">Contraseña nueva</label>
            <input id="pw-new" type="password" autoComplete="new-password" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pw-again" className="block text-xs font-semibold text-gray-600 mb-1">Repite la contraseña nueva</label>
            <input id="pw-again" type="password" autoComplete="new-password" className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} />
          </div>
          {pwErr && <p role="alert" className="text-sm text-rose-600">{pwErr}</p>}
          {pwMsg && <p role="status" className="text-sm text-emerald-600">{pwMsg}</p>}
          <button type="submit" disabled={pwBusy} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
            {pwBusy ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>

      {/* ---------------- Equipo ---------------- */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-700">Personas con acceso</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cada persona entra con su propio usuario y contraseña.</p>
          </div>
          {!adding && (
            <button onClick={() => { setAdding(true); setSecret(null); setTeamErr(null); setTeamMsg(null); }}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">
              + Agregar persona
            </button>
          )}
        </div>

        {teamMsg && <p role="status" className="mb-3 text-sm text-emerald-600">{teamMsg}</p>}
        {teamErr && <p role="alert" className="mb-3 text-sm text-rose-600">{teamErr}</p>}
        {secret && <SecretBox title={secret.title} password={secret.password} onClose={() => setSecret(null)} />}

        {adding && (
          <form onSubmit={create} className="mb-5 mt-3 rounded-xl border border-dashed border-primary-200 p-4 space-y-3" noValidate>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="m-name" className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                <input id="m-name" className={inputCls} value={newName} placeholder="Ana Pérez" maxLength={60} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="m-user" className="block text-xs font-semibold text-gray-600 mb-1">Usuario (para ingresar)</label>
                <input id="m-user" className={inputCls} value={newUser} placeholder="ana" maxLength={30} autoCapitalize="none" spellCheck={false}
                  onChange={(e) => setNewUser(e.target.value.toLowerCase().replace(/\s/g, ''))} />
              </div>
            </div>
            <div>
              <label htmlFor="m-pass" className="block text-xs font-semibold text-gray-600 mb-1">Contraseña temporal</label>
              <div className="flex gap-2">
                <input id="m-pass" className={`${inputCls} font-mono`} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                <button type="button" onClick={() => setNewPass(generatePassword())}
                  className="text-xs font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-3 rounded-lg whitespace-nowrap">
                  Generar otra
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Se muestra una vez al crear. Después cada persona puede poner la suya.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={createBusy} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
                {createBusy ? 'Creando…' : 'Crear acceso'}
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {team.map((m) => (
              <li key={m.id} className={`py-3 flex items-center gap-3 flex-wrap ${m.active ? '' : 'opacity-60'}`}>
                <div className="flex-1 min-w-[10rem]">
                  <p className="font-semibold text-gray-800 flex items-center gap-2 flex-wrap">
                    {m.display_name}
                    {m.is_me && <span className="text-[10px] font-bold uppercase bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">Tú</span>}
                    {!m.active && <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Sin acceso</span>}
                  </p>
                  <p className="text-xs text-gray-400">@{m.username} · Último ingreso: {fmtDate(m.last_login_at)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => resetPassword(m)} disabled={busyId === m.id}
                    className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50">
                    Restablecer contraseña
                  </button>
                  {!m.is_me && (
                    <button onClick={() => toggleActive(m)} disabled={busyId === m.id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-50 ${
                        m.active ? 'text-rose-500 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                      }`}>
                      {m.active ? 'Quitar acceso' : 'Reactivar'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
