'use client';

import type { OrderTrack, PaymentStatus } from '@/lib/api';
import { formatPrice, orderNumber } from '@/lib/format';

// Pasos de la línea de tiempo (en orden). CANCELADO se trata aparte.
const STEPS: { key: PaymentStatus; label: string; emoji: string }[] = [
  { key: 'PENDIENTE', label: 'Pedido recibido', emoji: '📝' },
  { key: 'PAGADO', label: 'Pago confirmado', emoji: '💳' },
  { key: 'ENVIADO', label: 'Enviado', emoji: '📦' },
  { key: 'ENTREGADO', label: 'Entregado', emoji: '🎉' },
];

function stepIndex(status: PaymentStatus): number {
  const i = STEPS.findIndex((s) => s.key === status);
  return i; // -1 si es CANCELADO
}

export default function OrderTrackView({ order, printable = true }: { order: OrderTrack; printable?: boolean }) {
  const cancelled = order.payment_status === 'CANCELADO';
  const activeIdx = stepIndex(order.payment_status);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => window.print();

  return (
    <div data-print-area className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      {/* Encabezado de marca (solo visible al imprimir / en el PDF) */}
      <div className="print-only" style={{ marginBottom: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#8B1A3A', fontFamily: 'Atlane, serif' }}>Belleza Íntima</p>
        <p style={{ fontSize: 12, color: '#6b7280' }}>Comprobante de pedido</p>
      </div>
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Pedido</p>
          <p className="text-xl font-bold text-gray-800 nums">{orderNumber(order.id)}</p>
          <p className="text-xs text-gray-400 mt-0.5">A nombre de {order.customer_name}</p>
          <p className="text-xs text-gray-400">Realizado el {fmtDate(order.created_at)}</p>
          {order.combo_name && (
            <p className="text-xs text-primary-600 mt-1">🎁 Combo: {order.combo_name}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-xl font-bold text-primary-600 nums">{formatPrice(order.total)}</p>
        </div>
      </div>

      {/* Línea de tiempo del estado */}
      {cancelled ? (
        <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 mb-5">
          <p className="text-sm font-semibold text-rose-600">Este pedido fue cancelado.</p>
          <p className="text-xs text-rose-400 mt-0.5">Si crees que es un error, escríbenos por WhatsApp.</p>
        </div>
      ) : (
        <ol className="flex items-center justify-between mb-6 mt-2">
          {STEPS.map((step, i) => {
            const done = i <= activeIdx;
            const current = i === activeIdx;
            return (
              <li key={step.key} className="flex-1 flex flex-col items-center relative">
                {/* Línea conectora (a la izquierda, menos en el primero) */}
                {i > 0 && (
                  <span
                    className={`absolute top-4 right-1/2 h-0.5 w-full ${i <= activeIdx ? 'bg-primary-500' : 'bg-gray-200'}`}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full text-sm transition-colors ${
                    done ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                  } ${current ? 'ring-4 ring-primary-100' : ''}`}
                >
                  {step.emoji}
                </span>
                <span className={`mt-1.5 text-[11px] text-center leading-tight ${done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Productos */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resumen</p>
        <ul className="space-y-2">
          {order.items.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <p className="text-gray-800 truncate">{it.quantity}× {it.product_name}</p>
                {(it.size || it.color) && (
                  <p className="text-xs text-gray-400">
                    {[it.size && `Talla: ${it.size}`, it.color && `Color: ${it.color}`].filter(Boolean).join(' · ')}
                  </p>
                )}
                {it.line_savings > 0 && (
                  <p className="text-xs text-emerald-600 font-medium">Ahorras {formatPrice(it.line_savings)}</p>
                )}
              </div>
              <span className="flex-shrink-0 ml-2 text-right">
                {it.line_savings > 0 && (
                  <span className="block text-xs text-gray-400 line-through nums">{formatPrice(it.line_original)}</span>
                )}
                <span className="font-medium text-gray-700 nums">{formatPrice(it.line_total)}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5">
          {order.savings > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Precio normal</span>
                <span className="line-through nums">{formatPrice(order.original_total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-600 font-medium">Ahorro total</span>
                <span className="text-emerald-600 font-semibold nums">−{formatPrice(order.savings)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-gray-800">Total</span>
            <span className="text-base font-bold text-primary-600 nums">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Botón de descarga/impresión (no sale en el PDF) */}
      {printable && (
        <button
          type="button"
          onClick={handlePrint}
          className="no-print mt-5 w-full flex items-center justify-center gap-2 border border-primary-200 text-primary-700 hover:bg-primary-50 font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <path d="M6 14h12v8H6z" />
          </svg>
          Descargar / imprimir comprobante
        </button>
      )}
    </div>
  );
}
