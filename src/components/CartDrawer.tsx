'use client';

import Link from 'next/link';
import Image from 'next/image';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { getImageForColor } from '@/lib/api';

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQty, total, itemCount } = useCart();

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
              <span className="ml-2 text-sm font-normal text-gray-500">({itemCount} artículos)</span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar carrito"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <span className="text-5xl block mb-3">🛍️</span>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => {
              const price = item.variant.price ?? item.product.base_price;
              const imageUrl = getImageForColor(item.product.images, item.variant.color);
              return (
                <div key={item.variant.id} className="flex gap-4">
                  <div className="w-16 h-20 flex-shrink-0 bg-primary-50 rounded-lg overflow-hidden relative flex items-center justify-center">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🌸</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{item.product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Talla: {item.variant.size} · Color: {item.variant.color}
                    </p>
                    <p className="text-primary-600 font-bold text-sm mt-1 nums">{formatPrice(price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.variant.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-400 transition-colors"
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.variant.id, item.quantity + 1)}
                        disabled={item.quantity >= item.variant.stock}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                      {item.quantity >= item.variant.stock && (
                        <span className="text-xs text-amber-500">máx.</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.variant.id)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors self-start"
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
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900 nums">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-gray-400">El pago se coordina por WhatsApp</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-semibold py-3 rounded-xl transition-colors"
            >
              Pedir por WhatsApp 💬
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
