'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Medidas REFERENCIALES de ejemplo (en cm). Reemplázalas por las reales de la
// marca cuando estén disponibles.
const SIZE_ROWS: { size: string; busto: string; cintura: string; cadera: string }[] = [
  { size: 'XS', busto: '78 – 82', cintura: '58 – 62', cadera: '84 – 88' },
  { size: 'S', busto: '83 – 87', cintura: '63 – 67', cadera: '89 – 93' },
  { size: 'M', busto: '88 – 92', cintura: '68 – 72', cadera: '94 – 98' },
  { size: 'L', busto: '93 – 98', cintura: '73 – 78', cadera: '99 – 104' },
  { size: 'XL', busto: '99 – 104', cintura: '79 – 84', cadera: '105 – 110' },
];

export default function SizeGuide() {
  const [open, setOpen] = useState(false);

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-3 py-1.5 rounded-full transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7h18M3 12h18M3 17h18" />
        </svg>
        Guía de tallas
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Guía de tallas"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl ring-1 ring-primary-100/70 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="bg-gradient-to-b from-primary-50 to-white px-6 pt-6 pb-4 text-center relative">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/70 hover:bg-white text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-400">Belleza Íntima</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-primary-700">Guía de tallas</h2>
              <p className="mt-1 text-xs text-gray-400">Encuentra tu talla ideal · medidas en centímetros</p>
            </div>

            {/* Tabla */}
            <div className="px-6 pb-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-primary-700">
                    <th className="py-2 text-left font-semibold">Talla</th>
                    <th className="py-2 text-center font-semibold">Busto</th>
                    <th className="py-2 text-center font-semibold">Cintura</th>
                    <th className="py-2 text-center font-semibold">Cadera</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_ROWS.map((r, i) => (
                    <tr key={r.size} className={i % 2 === 0 ? 'bg-primary-50/40' : ''}>
                      <td className="py-2.5 px-2 font-serif font-semibold text-primary-700 rounded-l-lg">{r.size}</td>
                      <td className="py-2.5 px-2 text-center text-gray-600 nums">{r.busto}</td>
                      <td className="py-2.5 px-2 text-center text-gray-600 nums">{r.cintura}</td>
                      <td className="py-2.5 px-2 text-center text-gray-600 nums rounded-r-lg">{r.cadera}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cómo medir + nota */}
            <div className="px-6 pb-6 pt-3">
              <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4">
                <p className="text-xs font-semibold text-primary-700 mb-1.5">Cómo tomar tus medidas</p>
                <ul className="text-xs text-gray-500 space-y-1 leading-relaxed">
                  <li><span className="font-medium text-gray-600">Busto:</span> rodea la parte más amplia del pecho.</li>
                  <li><span className="font-medium text-gray-600">Cintura:</span> mide la parte más estrecha del torso.</li>
                  <li><span className="font-medium text-gray-600">Cadera:</span> rodea la parte más amplia de la cadera.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4 mt-3">
                <p className="text-xs font-semibold text-primary-700 mb-1.5">Nota</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  La mayoría de nuestros pantys son ajustables, por lo cual se pueden graduar a los
                  lados y se adaptan cómodamente a diferentes tallas.
                </p>
              </div>
              <p className="text-[11px] text-gray-400 mt-3 text-center">
                * Medidas referenciales. Pueden variar levemente según el modelo.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
