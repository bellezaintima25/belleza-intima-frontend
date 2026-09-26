'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import type { AdminOrder, PaymentStatus, AdminProduct } from '@/lib/adminApi';
import { formatPrice } from '@/lib/format';

function orderTotal(order: AdminOrder): number {
  return order.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const PAYMENT_STATES: PaymentStatus[] = [
  'PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO',
];

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

// Colores del "chip" de estado de gestión.
const STATUS_STYLE: Record<PaymentStatus, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  PAGADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ENVIADO: 'bg-sky-100 text-sky-700 border-sky-200',
  ENTREGADO: 'bg-violet-100 text-violet-700 border-violet-200',
  CANCELADO: 'bg-rose-100 text-rose-700 border-rose-200',
};

// Estados que confirman la venta y por tanto descuentan stock del inventario.
const STOCK_CONSUMING: PaymentStatus[] = ['PAGADO', 'ENVIADO', 'ENTREGADO'];

// Transiciones permitidas (flujo escalable). No se puede pasar a Enviado o
// Entregado sin haber pasado por Pagado. Cancelado está disponible desde
// cualquier estado activo, y desde Cancelado se puede reactivar a Pendiente.
const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['ENVIADO', 'ENTREGADO', 'PENDIENTE', 'CANCELADO'],
  ENVIADO: ['ENTREGADO', 'PAGADO', 'CANCELADO'],
  ENTREGADO: ['ENVIADO', 'CANCELADO'],
  CANCELADO: ['PENDIENTE'],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Confirmación pendiente. `kind` indica si el cambio descuenta o repone stock.
  const [confirm, setConfirm] = useState<
    { order: AdminOrder; next: PaymentStatus; kind: 'discount' | 'restore' } | null
  >(null);
  // Confirmación de eliminación de un pedido (pedidos de prueba).
  const [deleteConfirm, setDeleteConfirm] = useState<AdminOrder | null>(null);
  // Edición de ítems: id del pedido en modo edición y catálogo de productos.
  const [editing, setEditing] = useState<number | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  // Formulario de "agregar producto": producto y variante seleccionados.
  const [addProductId, setAddProductId] = useState<number | ''>('');
  const [addVariantId, setAddVariantId] = useState<number | ''>('');
  // Edición de datos del cliente (nombre / teléfono) del pedido en edición.
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  useEffect(() => {
    adminApi.orders.list()
      .then(setOrders)
      .finally(() => setLoading(false));
    // Catálogo para el selector de "agregar producto".
    adminApi.products.list().then(setProducts).catch(() => {});
  }, []);

  // Reemplaza un pedido en la lista con la versión devuelta por el backend.
  const replaceOrder = (updated: AdminOrder) =>
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));

  const changeItemQty = async (order: AdminOrder, itemId: number, quantity: number) => {
    if (quantity < 1) return;
    setError(null);
    setSavingId(order.id);
    try {
      replaceOrder(await adminApi.orders.updateItemQty(order.id, itemId, quantity));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar la cantidad.');
    } finally {
      setSavingId(null);
    }
  };

  const removeItem = async (order: AdminOrder, itemId: number) => {
    setError(null);
    setSavingId(order.id);
    try {
      replaceOrder(await adminApi.orders.deleteItem(order.id, itemId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar el producto.');
    } finally {
      setSavingId(null);
    }
  };

  const addItem = async (order: AdminOrder) => {
    if (addVariantId === '') return;
    setError(null);
    setSavingId(order.id);
    try {
      replaceOrder(await adminApi.orders.addItem(order.id, Number(addVariantId), 1));
      setAddProductId('');
      setAddVariantId('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar el producto.');
    } finally {
      setSavingId(null);
    }
  };

  const saveCustomer = async (order: AdminOrder) => {
    const name = custName.trim();
    const phone = custPhone.trim();
    if (!name || !phone) {
      setError('El nombre y el teléfono no pueden estar vacíos.');
      return;
    }
    if (name === order.customer_name && phone === order.customer_phone) return;
    setError(null);
    setSavingId(order.id);
    try {
      replaceOrder(await adminApi.orders.updateCustomer(order.id, { customer_name: name, customer_phone: phone }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron actualizar los datos del cliente.');
    } finally {
      setSavingId(null);
    }
  };

  // Aplica el cambio de estado contra el backend.
  const applyStatus = async (order: AdminOrder, next: PaymentStatus) => {
    setError(null);
    setSavingId(order.id);
    try {
      const updated = await adminApi.orders.updateStatus(order.id, next);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo actualizar el estado.';
      setError(msg);
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = (order: AdminOrder, next: PaymentStatus) => {
    if (next === order.payment_status) return;
    // Seguridad extra: ignorar transiciones no permitidas (el select ya las
    // deshabilita, pero validamos por si acaso).
    if (!ALLOWED_TRANSITIONS[order.payment_status].includes(next)) return;

    const willConsumeStock = !order.stock_applied && STOCK_CONSUMING.includes(next);
    const willRestoreStock = order.stock_applied && !STOCK_CONSUMING.includes(next);

    if (willConsumeStock) {
      setConfirm({ order, next, kind: 'discount' });
      return;
    }
    if (willRestoreStock) {
      // Reposición de stock (p. ej. cancelar un pedido ya pagado).
      setConfirm({ order, next, kind: 'restore' });
      return;
    }
    applyStatus(order, next);
  };

  const confirmAction = async () => {
    if (!confirm) return;
    const { order, next } = confirm;
    setConfirm(null);
    await applyStatus(order, next);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const order = deleteConfirm;
    setDeleteConfirm(null);
    setError(null);
    setSavingId(order.id);
    try {
      await adminApi.orders.delete(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      if (expanded === order.id) setExpanded(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar el pedido.';
      setError(msg);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        <p className="text-gray-400 text-sm mt-1">{orders.length} pedidos registrados</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600" aria-label="Cerrar aviso">✕</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <span className="text-5xl block mb-3">📦</span>
          <p>Aún no hay pedidos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Encabezado de columnas (solo en pantallas grandes) */}
          <div className="hidden lg:grid grid-cols-12 gap-3 px-5 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">WhatsApp</div>
            <div className="col-span-3">Estado</div>
          </div>

          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Fila principal — clic en cualquier parte despliega el detalle */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpanded(expanded === order.id ? null : order.id);
                  }
                }}
                className="px-5 py-4 grid grid-cols-2 lg:grid-cols-12 gap-3 items-start cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {/* Cliente */}
                <div className="col-span-2 lg:col-span-3 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{order.customer_name}</p>
                  <p className="text-xs text-gray-400">{order.customer_phone}</p>
                </div>

                {/* Fecha */}
                <div className="lg:col-span-2">
                  <p className="text-gray-500 text-xs lg:hidden">Fecha</p>
                  <p className="text-gray-700 text-sm">{formatDate(order.created_at)}</p>
                </div>

                {/* Total */}
                <div className="lg:col-span-2">
                  <p className="text-gray-500 text-xs lg:hidden">Total</p>
                  <p className="font-semibold text-gray-800 nums">{formatPrice(orderTotal(order))}</p>
                </div>

                {/* Estado de WhatsApp */}
                <div className="lg:col-span-2">
                  <p className="text-gray-500 text-xs lg:hidden">WhatsApp</p>
                  {order.status === 'SENT' ? (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"
                      title={order.sent_at ? `Enviado: ${formatDate(order.sent_at)}` : 'Enviado a WhatsApp'}
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                        <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm5.6 14.2c-.2.6-1.2 1.1-1.7 1.2-.5.1-1 .2-3.2-.7-2.7-1.1-4.4-3.9-4.6-4.1-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.2.4-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.7.9.2.1.4.1.4.2.1.2.1.7-.1 1.3z" />
                      </svg>
                      Enviado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                      No enviado
                    </span>
                  )}
                </div>

                {/* Estado de gestión editable — no debe togglear el detalle */}
                <div
                  className="col-span-2 lg:col-span-3 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex-1">
                    <select
                      value={order.payment_status}
                      disabled={savingId === order.id}
                      onChange={(e) => handleStatusChange(order, e.target.value as PaymentStatus)}
                      className={`w-full appearance-none cursor-pointer rounded-lg border px-3 py-1.5 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60 ${STATUS_STYLE[order.payment_status]}`}
                      aria-label="Cambiar estado del pedido"
                    >
                      {PAYMENT_STATES.map((s) => {
                        const allowed =
                          s === order.payment_status ||
                          ALLOWED_TRANSITIONS[order.payment_status].includes(s);
                        return (
                          <option
                            key={s}
                            value={s}
                            disabled={!allowed}
                            className="bg-white text-gray-800"
                          >
                            {STATUS_LABEL[s]}{!allowed ? ' (no disponible)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-60 text-[10px]">▼</span>
                  </div>
                  {savingId === order.id && (
                    <span className="text-xs text-gray-400 animate-pulse">Guardando…</span>
                  )}
                  {order.stock_applied && savingId !== order.id && (
                    <span className="text-[10px] text-emerald-600 whitespace-nowrap" title="El stock de este pedido ya fue descontado del inventario.">
                      stock aplicado
                    </span>
                  )}
                </div>

                {/* Indicador de expandir/colapsar */}
                <div className="hidden lg:flex lg:col-span-12 lg:justify-end -mt-1">
                  <span className="text-xs text-gray-300">
                    {expanded === order.id ? '▲ ocultar detalle' : '▼ ver detalle'}
                  </span>
                </div>
              </div>

              {/* Detalle expandido */}
              {expanded === order.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  {/* Edición de datos del cliente (solo en modo edición) */}
                  {editing === order.id && (
                    <div className="mb-4 p-3 rounded-xl border border-dashed border-gray-200 bg-white">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Datos del cliente</p>
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="flex flex-col text-xs text-gray-500">
                          Nombre
                          <input
                            type="text"
                            value={custName}
                            onChange={(e) => setCustName(e.target.value)}
                            className="mt-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
                          />
                        </label>
                        <label className="flex flex-col text-xs text-gray-500">
                          Teléfono
                          <input
                            type="tel"
                            value={custPhone}
                            onChange={(e) => setCustPhone(e.target.value)}
                            className="mt-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
                          />
                        </label>
                        <button
                          onClick={() => saveCustomer(order)}
                          disabled={
                            savingId === order.id ||
                            (custName.trim() === order.customer_name && custPhone.trim() === order.customer_phone)
                          }
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                        >
                          Guardar datos
                        </button>
                      </div>
                    </div>
                  )}

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs">
                        <th className="pb-2">Producto</th>
                        <th className="pb-2">Talla</th>
                        <th className="pb-2">Color</th>
                        <th className="pb-2">Cant.</th>
                        <th className="pb-2">Precio unit.</th>
                        <th className="pb-2">Subtotal</th>
                        {editing === order.id && <th className="pb-2"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100">
                          <td className="py-2 font-medium text-gray-800">
                            {item.variant?.product?.name ?? `Variante #${item.variant_id}`}
                          </td>
                          <td className="py-2 text-gray-600">{item.variant?.size ?? '—'}</td>
                          <td className="py-2 text-gray-600">{item.variant?.color ?? '—'}</td>
                          <td className="py-2 text-gray-600 nums">
                            {editing === order.id ? (
                              <span className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => changeItemQty(order, item.id, item.quantity - 1)}
                                  disabled={savingId === order.id || item.quantity <= 1}
                                  className="h-6 w-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                                  aria-label="Reducir cantidad"
                                >−</button>
                                <span className="w-6 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => changeItemQty(order, item.id, item.quantity + 1)}
                                  disabled={savingId === order.id}
                                  className="h-6 w-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                                  aria-label="Aumentar cantidad"
                                >+</button>
                              </span>
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="py-2 text-gray-600 nums">{formatPrice(item.unit_price)}</td>
                          <td className="py-2 font-semibold text-gray-800 nums">{formatPrice(item.unit_price * item.quantity)}</td>
                          {editing === order.id && (
                            <td className="py-2 text-right">
                              <button
                                onClick={() => removeItem(order, item.id)}
                                disabled={savingId === order.id || order.items.length <= 1}
                                className="text-xs text-rose-500 hover:text-rose-700 disabled:opacity-40"
                                title={order.items.length <= 1 ? 'No puedes quitar la última línea' : 'Quitar producto'}
                              >
                                Quitar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={5} className="pt-3 text-right font-semibold text-gray-700 text-sm pr-4">Total</td>
                        <td className="pt-3 font-bold text-primary-600 nums">{formatPrice(orderTotal(order))}</td>
                        {editing === order.id && <td></td>}
                      </tr>
                    </tfoot>
                  </table>

                  {/* Modo edición: agregar un producto al pedido */}
                  {editing === order.id && (
                    <div className="mt-3 p-3 rounded-xl border border-dashed border-gray-200 bg-white">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Agregar producto al pedido</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={addProductId}
                          onChange={(e) => {
                            const pid = e.target.value === '' ? '' : Number(e.target.value);
                            setAddProductId(pid);
                            setAddVariantId('');
                          }}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        >
                          <option value="">Producto…</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>

                        <select
                          value={addVariantId}
                          onChange={(e) => setAddVariantId(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={addProductId === ''}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50"
                        >
                          <option value="">Talla / Color…</option>
                          {products.find((p) => p.id === addProductId)?.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.size} / {v.color} — stock {v.stock}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => addItem(order)}
                          disabled={addVariantId === '' || savingId === order.id}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                        >
                          Agregar
                        </button>
                      </div>
                      {order.stock_applied && (
                        <p className="text-[11px] text-amber-600 mt-2">
                          Este pedido ya descontó stock: al agregar o aumentar cantidades se descontará del inventario, y al quitar o reducir se repondrá.
                        </p>
                      )}
                    </div>
                  )}
                  {order.sent_at && (
                    <p className="text-xs text-gray-400 mt-3">Enviado a WhatsApp: {formatDate(order.sent_at)}</p>
                  )}
                  {order.stock_applied ? (
                    <p className="text-xs text-emerald-600 mt-1">
                      El stock de este pedido está descontado del inventario.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      El stock aún no se ha descontado (se descuenta al marcar como Pagado).
                    </p>
                  )}

                  {/* Acción discreta: eliminar pedido (para pruebas) */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() =>
                        setEditing((cur) => {
                          setAddProductId('');
                          setAddVariantId('');
                          if (cur !== order.id) {
                            // Al entrar en edición, precargar datos del cliente.
                            setCustName(order.customer_name);
                            setCustPhone(order.customer_phone);
                          }
                          return cur === order.id ? null : order.id;
                        })
                      }
                      disabled={savingId === order.id}
                      className={`text-xs font-medium transition-colors disabled:opacity-50 ${
                        editing === order.id
                          ? 'text-primary-600 hover:text-primary-700'
                          : 'text-gray-500 hover:text-primary-600'
                      }`}
                    >
                      {editing === order.id ? '✓ Terminar edición' : '✎ Modificar pedido'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(order)}
                      disabled={savingId === order.id}
                      className="text-xs text-gray-300 hover:text-rose-500 transition-colors disabled:opacity-50"
                      title="Eliminar este pedido (úsalo solo para pedidos de prueba)"
                    >
                      Eliminar pedido de prueba
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación de cambios que afectan al inventario */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={confirm.kind === 'discount' ? 'Confirmar descuento de stock' : 'Confirmar reposición de stock'}
          onClick={() => setConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">
              {confirm.kind === 'discount' ? 'Confirmar descuento de stock' : 'Confirmar cancelación'}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Vas a marcar el pedido de{' '}
              <span className="font-semibold">{confirm.order.customer_name}</span> como{' '}
              <span className="font-semibold">{STATUS_LABEL[confirm.next]}</span>.{' '}
              {confirm.kind === 'discount'
                ? 'Esto descontará del inventario:'
                : 'Esto repondrá al inventario:'}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-gray-700 max-h-48 overflow-auto">
              {confirm.order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 border-b border-gray-50 pb-1">
                  <span className="truncate">
                    {item.variant?.product?.name ?? `Variante #${item.variant_id}`}
                    {item.variant ? ` · ${item.variant.size} / ${item.variant.color}` : ''}
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    {confirm.kind === 'discount' ? '−' : '+'} {item.quantity} u.
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              {confirm.kind === 'discount'
                ? 'Si luego cancelas el pedido, el stock se repondrá automáticamente.'
                : 'El pedido quedará cancelado y las unidades volverán a estar disponibles.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                  confirm.kind === 'discount'
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirm.kind === 'discount' ? 'Sí, descontar stock' : 'Sí, cancelar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de pedido */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de pedido"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">Eliminar pedido</h2>
            <p className="text-sm text-gray-600 mt-2">
              Vas a eliminar de forma permanente el pedido de{' '}
              <span className="font-semibold">{deleteConfirm.customer_name}</span>. Esta acción no se
              puede deshacer.
            </p>
            {deleteConfirm.stock_applied && (
              <p className="text-xs text-emerald-600 mt-2">
                El stock que tenía descontado se repondrá al inventario.
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Usa esta opción solo para pedidos de prueba. El historial de pedidos reales, aunque
              estén cancelados, es mejor conservarlo.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Conservar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Sí, eliminar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
