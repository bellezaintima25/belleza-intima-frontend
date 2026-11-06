'use client';

import Link from 'next/link';
import Image from 'next/image';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { getImageForColor, effectivePrice } from '@/lib/api';

function EmptyBag() {
  return (
    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.2} className="w-20 h-20 mb-4 text-primary-200">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 24V18a12 12 0 0 1 24 0v6" />
        <rect x="10" y="24" width="44" height="34" rx="6" strokeLinecap="round" />
        <path strokeLinecap="round" d="M26 36a6 6 0 0 0 12 0" />
      </svg>
      <p className="font-serif text-lg text-gray-400">Tu carrito está vacío</p>
      <p className="text-sm text-gray-300 mt-1">Agrega algo que te haga brillar</p>
    </div>
  );
}

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQty, total, itemCount } = useCart();

  // Calcular ahorro total si hay productos en descuento
  const totalSavings = items.reduce((acc, item) => {
    const base = item.product.base_price;
    const final = effectivePrice(item.product, item.variant);
    return acc + (base - final) * item.quantity;
  }, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Mi carrito
            {itemCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({itemCount} artículo{itemCount !== 1 ? 's' : ''})</span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Cerrar carrito"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <EmptyBag />
          ) : (
            items.map((item) => {
              const price = effectivePrice(item.product, item.variant);
              const imageUrl = getImageForColor(item.product.images, item.variant.color);
              const hasDiscount = item.product.base_price > price;
              return (
                <div
                  key={item.variant.id}
                  className="flex gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group"
                >
                  {/* Imagen más grande */}
                  <div className="w-20 h-24 flex-shrink-0 bg-primary-50 rounded-xl overflow-hidden relative">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-8 h-8 text-primary-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{item.product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Talla: {item.variant.size} · Color: {item.variant.color}
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-primary-600 font-bold text-sm nums">{formatPrice(price)}</p>
                      {hasDiscount && (
                        <>
                          <p className="text-xs text-gray-400 line-through nums">{formatPrice(item.product.base_price)}</p>
                          <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full nums">
                            -{Math.round(item.product.discount_percent)}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Controles cantidad */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.variant.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-all"
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold w-4 text-center nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.variant.id, item.quantity + 1)}
                        disabled={item.quantity >= item.variant.stock}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                      {item.quantity >= item.variant.stock && (
                        <span className="text-xs text-amber-500">máx.</span>
                      )}
                    </div>
                  </div>

                  {/* Botón eliminar — más visible en hover */}
                  <button
                    onClick={() => removeItem(item.variant.id)}
                    className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all self-start opacity-0 group-hover:opacity-100"
                    aria-label={`Eliminar ${item.product.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 space-y-3">
            {/* Ahorro total */}
            {totalSavings > 0 && (
              <div className="flex justify-between text-sm bg-green-50 text-green-700 rounded-xl px-4 py-2.5">
                <span className="font-medium flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l2.25 2.25L15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Estás ahorrando
                </span>
                <span className="font-bold nums">{formatPrice(totalSavings)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900 nums">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-gray-400">El pago se coordina por WhatsApp</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-semibold py-3 rounded-xl transition-colors shadow-sm hover:shadow-md"
            >
              Pedir por WhatsApp
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/>
              </svg>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
