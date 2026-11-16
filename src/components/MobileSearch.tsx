'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { api, getImageForColor } from '@/lib/api';
import type { Product } from '@/lib/api';
import { formatPrice, categoryLabel } from '@/lib/format';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  matchesProduct,
  normalizeText,
  removeRecentSearch,
} from '@/lib/search';

const MAX_RESULTS = 6;

interface Props {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  /** Categorías para los atajos (las mismas del menú). */
  categories: { href: string; label: string }[];
}

export default function MobileSearch({ open, onClose, query, onQueryChange, categories }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Al abrir: historial al día y catálogo (se vuelve a pedir cada vez para ver precios actuales).
  useEffect(() => {
    if (!open) return;
    setRecent(getRecentSearches());
    let cancelled = false;
    api.products.list()
      .then((list) => { if (!cancelled) { setProducts(list); setLoadError(false); } })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [open]);

  // Bloquea el scroll del fondo, cierra con Escape y si la pantalla pasa a escritorio.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { if (mq.matches) onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onChange);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onChange);
    };
  }, [open]);

  const trimmed = query.trim();
  const results = useMemo(
    () => (products && trimmed ? products.filter((p) => matchesProduct(p, trimmed)) : []),
    [products, trimmed],
  );
  // Búsquedas anteriores que coinciden con lo que se va escribiendo.
  const recentMatches = useMemo(() => {
    const q = normalizeText(trimmed);
    return q ? recent.filter((r) => normalizeText(r).includes(q) && normalizeText(r) !== q).slice(0, 3) : recent;
  }, [recent, trimmed]);

  if (!open || typeof document === 'undefined') return null;

  const close = () => onClose();

  const searchFor = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setRecent(addRecentSearch(q));
    onQueryChange('');
    onClose();
    router.push(`/catalogo?q=${encodeURIComponent(q)}`);
  };

  const openProduct = (p: Product) => {
    if (trimmed.length >= 2) setRecent(addRecentSearch(trimmed));
    onClose();
    router.push(`/products/${p.id}`);
  };

  const goCategory = (href: string) => {
    onClose();
    router.push(href);
  };

  const shown = results.slice(0, MAX_RESULTS);
  const showCategories = !trimmed || (products !== null && results.length === 0);
  const chips = categories.filter((c) => c.label !== 'Ver todo');

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar en la tienda"
      className="search-overlay-in fixed inset-0 z-[60] bg-white flex flex-col lg:hidden"
    >
      {/* Barra de búsqueda */}
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); searchFor(query); }}
        className="flex items-center gap-1 px-3 py-3 border-b border-gray-100 bg-white"
      >
        <button
          type="button"
          onClick={close}
          className="p-2 -ml-1 text-gray-500 hover:text-primary-600 transition-colors"
          aria-label="Cerrar búsqueda"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            enterKeyHint="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={60}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar productos…"
            aria-label="Buscar productos"
            // text-base (16 px): con menos, el iPhone hace zoom solo al tocar el campo.
            className="w-full rounded-full bg-gray-100 pl-11 pr-11 py-2.5 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => { onQueryChange(''); inputRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
              aria-label="Borrar lo escrito"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-10">
        {/* Búsquedas anteriores (todas, o las que coinciden con lo escrito) */}
        {recentMatches.length > 0 && (
          <section aria-labelledby="ms-recent">
            <div className="flex items-center justify-between">
              <h2 id="ms-recent" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {trimmed ? 'De tus búsquedas' : 'Búsquedas recientes'}
              </h2>
              {!trimmed && (
                <button
                  type="button"
                  onClick={() => setRecent(clearRecentSearches())}
                  className="text-xs font-semibold text-primary-600 py-1"
                >
                  Borrar todo
                </button>
              )}
            </div>
            <ul>
              {recentMatches.map((r) => (
                <li key={r} className="flex items-center border-b border-gray-50 last:border-0">
                  <button
                    type="button"
                    onClick={() => searchFor(r)}
                    className="flex-1 min-w-0 flex items-center gap-3 py-3 text-left text-gray-700"
                  >
                    <ClockIcon className="h-5 w-5 flex-shrink-0 text-gray-300" aria-hidden="true" />
                    <span className="truncate">{r}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecent(removeRecentSearch(r))}
                    className="p-2 text-gray-300 hover:text-gray-500"
                    aria-label={`Quitar ${r} del historial`}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!trimmed && recent.length === 0 && (
          <p className="pt-2 text-sm text-gray-400">
            Escribe el nombre de una prenda, una categoría o un código. Tus búsquedas quedarán aquí para repetirlas con un toque.
          </p>
        )}

        {/* Productos que coinciden mientras se escribe */}
        {trimmed && (
          <section className="mt-4" aria-live="polite">
            {products === null && !loadError ? (
              <div className="space-y-3" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-14 w-14 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-gray-100" />
                      <div className="h-3 w-1/3 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError && products === null ? (
              <button
                type="button"
                onClick={() => searchFor(trimmed)}
                className="w-full flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700"
              >
                <span>Buscar “{trimmed}” en el catálogo</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            ) : shown.length > 0 ? (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Productos</h2>
                <ul>
                  {shown.map((p) => {
                    const img = getImageForColor(p.images);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => openProduct(p)}
                          className="w-full flex items-center gap-3 py-2.5 text-left active:bg-primary-50/60 rounded-lg"
                        >
                          <span className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-primary-50">
                            {img && <Image src={img} alt="" fill sizes="56px" className="object-cover" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block truncate text-sm font-semibold text-gray-800">{p.name}</span>
                            <span className="block text-xs text-gray-400">{categoryLabel(p.category)}</span>
                          </span>
                          <span className="flex-shrink-0 text-right nums">
                            <span className="block text-sm font-bold text-primary-600">
                              {formatPrice(p.on_sale ? p.final_price : p.base_price)}
                            </span>
                            {p.on_sale && (
                              <span className="block text-xs text-gray-400 line-through">{formatPrice(p.base_price)}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => searchFor(trimmed)}
                  className="mt-2 w-full flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700"
                >
                  <span>
                    {results.length === 1 ? 'Ver el resultado' : `Ver los ${results.length} resultados`} de “{trimmed}”
                  </span>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="font-medium text-gray-600">No encontramos “{trimmed}”</p>
                <p className="mt-1 text-sm text-gray-400">Revisa cómo está escrito o prueba con una categoría.</p>
              </div>
            )}
          </section>
        )}

        {/* Atajos a las categorías */}
        {showCategories && (
          <section className="mt-6" aria-labelledby="ms-cats">
            <h2 id="ms-cats" className="text-xs font-semibold uppercase tracking-wider text-gray-400">Categorías</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => goCategory(c.href)}
                  className="rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 active:bg-primary-50"
                >
                  {c.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goCategory('/catalogo')}
                className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white active:bg-primary-700"
              >
                Ver todo
              </button>
            </div>
          </section>
        )}
      </div>
    </div>,
    document.body,
  );
}
