'use client';

import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import {
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/adminApi';
import type { AdminProduct, VariantOut, ImageOut } from '@/lib/adminApi';
import { imageSrc } from '@/lib/api';
import { formatPrice } from '@/lib/format';

/** Lista fija de tallas disponibles al crear variantes. */
export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];
const LOW_STOCK = 2;

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
const sizeRank = (s: string) => {
  const i = SIZE_OPTIONS.findIndex((o) => norm(o) === norm(s));
  return i === -1 ? SIZE_OPTIONS.length : i;
};

interface ColorGroup {
  key: string;
  name: string;
  variants: VariantOut[];
  images: ImageOut[];
}

interface Props {
  product: AdminProduct;
  setProduct: Dispatch<SetStateAction<AdminProduct | null>>;
  notify: (message: string, ok?: boolean) => void;
}

const inputCls =
  'border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

/** Fila de una talla dentro de un color: precio y stock editables. */
function SizeRow({
  variant,
  basePrice,
  onUpdate,
  onDelete,
}: {
  variant: VariantOut;
  basePrice: number;
  onUpdate: (patch: { stock?: number; price?: number | null }) => Promise<void>;
  onDelete: () => void;
}) {
  const [stock, setStock] = useState(String(variant.stock));
  const [price, setPrice] = useState(variant.price != null ? String(variant.price) : '');
  const low = Number(stock) < LOW_STOCK;

  // Sincroniza con el valor guardado cuando cambia desde afuera.
  useEffect(() => { setStock(String(variant.stock)); }, [variant.stock]);
  useEffect(() => { setPrice(variant.price != null ? String(variant.price) : ''); }, [variant.price]);

  const commitStock = () => {
    const n = Math.max(0, Math.floor(Number(stock)));
    if (!Number.isFinite(n)) return setStock(String(variant.stock));
    setStock(String(n));
    if (n !== variant.stock) onUpdate({ stock: n }).catch(() => setStock(String(variant.stock)));
  };
  const commitPrice = () => {
    const next = price.trim() === '' ? null : Number(price);
    if (next !== null && (!Number.isFinite(next) || next < 0)) return setPrice(variant.price != null ? String(variant.price) : '');
    if (next !== variant.price) onUpdate({ price: next }).catch(() => setPrice(variant.price != null ? String(variant.price) : ''));
  };

  return (
    <tr className="border-t border-gray-50">
      <td className="py-2 pr-3">
        <span className="inline-block min-w-[2.5rem] text-center px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-sm font-semibold">
          {variant.size}
        </span>
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          min={0}
          value={price}
          placeholder={String(basePrice)}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={commitPrice}
          aria-label={`Precio talla ${variant.size}`}
          title="Vacío = usa el precio base del producto"
          className={`${inputCls} w-28`}
        />
      </td>
      <td className="py-2 pr-3">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onBlur={commitStock}
            aria-label={`Stock talla ${variant.size}`}
            className={`${inputCls} w-16 text-center ${low ? 'border-amber-300 bg-amber-50' : ''}`}
          />
          {low && <ExclamationTriangleIcon className="h-4 w-4 text-amber-400" aria-label="Stock bajo" />}
        </div>
      </td>
      <td className="py-2 text-right">
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors"
          aria-label={`Eliminar talla ${variant.size}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

export default function ColorVariantsEditor({ product, setProduct, notify }: Props) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Panel "Agregar color"
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSizes, setNewSizes] = useState<string[]>([]);
  const [newStock, setNewStock] = useState(1);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);

  // ---- Agrupar por color (sin distinguir mayúsculas) ----
  const groups: ColorGroup[] = [];
  product.variants.forEach((v) => {
    const key = norm(v.color);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, name: v.color, variants: [], images: [] };
      groups.push(g);
    }
    g.variants.push(v);
  });
  groups.forEach((g) => g.variants.sort((a, b) => sizeRank(a.size) - sizeRank(b.size)));
  const generalImages: ImageOut[] = [];
  const orphanImages: ImageOut[] = [];
  product.images.forEach((img) => {
    if (!img.color) return generalImages.push(img);
    const g = groups.find((x) => x.key === norm(img.color));
    if (g) g.images.push(img);
    else orphanImages.push(img);
  });

  const colorNames = groups.map((g) => g.name);
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const noPhotoColors = groups.filter((g) => g.images.length === 0);
  const lowStockCount = product.variants.filter((v) => v.stock < LOW_STOCK).length;

  // ---- Operaciones ----
  const addVariant = async (color: string, size: string, stock = 1) => {
    const v = await adminApi.variants.add(product.id, { size, color, stock, price: null });
    setProduct((prev) => (prev ? { ...prev, variants: [...prev.variants, v] } : prev));
  };

  const updateVariant = async (v: VariantOut, patch: { stock?: number; price?: number | null }) => {
    try {
      const updated = await adminApi.variants.updateVariant(product.id, v.id, patch);
      setProduct((prev) =>
        prev ? { ...prev, variants: prev.variants.map((x) => (x.id === v.id ? updated : x)) } : prev
      );
      notify('Cambios guardados');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo guardar el cambio.', false);
      throw e;
    }
  };

  const deleteVariant = async (v: VariantOut) => {
    if (!confirm(`¿Eliminar la talla ${v.size} de ${v.color}?`)) return;
    try {
      await adminApi.variants.delete(product.id, v.id);
      setProduct((prev) => (prev ? { ...prev, variants: prev.variants.filter((x) => x.id !== v.id) } : prev));
      notify('Talla eliminada');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo eliminar la talla.', false);
    }
  };

  const renameColor = async (g: ColorGroup) => {
    const input = prompt(`Nuevo nombre para el color "${g.name}":`, g.name);
    if (input === null) return;
    const name = input.trim();
    if (!name || name === g.name) return;
    try {
      const updated = await adminApi.colors.rename(product.id, g.name, name);
      setProduct(updated);
      notify(`Color renombrado a "${name}"`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo renombrar el color.', false);
    }
  };

  const deleteColor = async (g: ColorGroup) => {
    const photos = g.images.length
      ? ` Sus ${g.images.length} foto(s) quedarán sin variante (podrás reasignarlas o borrarlas).`
      : '';
    if (!confirm(`¿Eliminar el color ${g.name} con todas sus tallas?${photos}`)) return;
    let failed = 0;
    let lastError = '';
    for (const v of g.variants) {
      try {
        await adminApi.variants.delete(product.id, v.id);
        setProduct((prev) => (prev ? { ...prev, variants: prev.variants.filter((x) => x.id !== v.id) } : prev));
      } catch (e) {
        failed++;
        lastError = e instanceof Error ? e.message : '';
      }
    }
    if (failed) notify(lastError || `No se pudieron eliminar ${failed} talla(s).`, false);
    else notify('Color eliminado');
  };

  const uploadImages = async (files: File[], color: string | null, key: string) => {
    if (!files.length) return;
    setUploadingKey(key);
    let done = 0;
    try {
      for (const file of files) {
        const img = await adminApi.images.upload(product.id, file, color, product.images.length + done);
        done++;
        setProduct((prev) => (prev ? { ...prev, images: [...prev.images, img] } : prev));
      }
      notify(done === 1 ? 'Foto agregada' : `${done} fotos agregadas`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo subir la foto.', false);
    } finally {
      setUploadingKey(null);
    }
  };

  const moveImage = async (img: ImageOut, color: string | null) => {
    try {
      const updated = await adminApi.images.setColor(product.id, img.id, color);
      setProduct((prev) =>
        prev ? { ...prev, images: prev.images.map((x) => (x.id === img.id ? updated : x)) } : prev
      );
      notify('Foto reasignada');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo reasignar la foto.', false);
    }
  };

  const deleteImage = async (img: ImageOut) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await adminApi.images.delete(product.id, img.id);
      setProduct((prev) => (prev ? { ...prev, images: prev.images.filter((x) => x.id !== img.id) } : prev));
      notify('Foto eliminada');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo eliminar la foto.', false);
    }
  };

  const createColor = async () => {
    const name = newName.trim();
    if (!name) return notify('Escribe el nombre del color.', false);
    if (colorNames.some((c) => norm(c) === norm(name))) {
      return notify(`Ya existe el color "${name}". Agrégale tallas desde su tarjeta.`, false);
    }
    if (newSizes.length === 0) return notify('Elige al menos una talla.', false);
    setCreating(true);
    try {
      const sizes = [...newSizes].sort((a, b) => sizeRank(a) - sizeRank(b));
      for (const size of sizes) await addVariant(name, size, Math.max(0, Number(newStock) || 0));
      if (newFiles.length) await uploadImages(newFiles, name, 'new');
      else notify('Color agregado');
      setNewName('');
      setNewSizes([]);
      setNewStock(1);
      setNewFiles([]);
      setAdding(false);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo crear el color.', false);
    } finally {
      setCreating(false);
    }
  };

  // ---- Piezas de UI ----
  const photoTile = (img: ImageOut) => (
    <div key={img.id} className="w-24 flex-shrink-0">
      <div className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-primary-50">
        <Image src={imageSrc(img.url)} alt={img.color ?? 'foto'} fill sizes="96px" className="object-cover" />
        <button
          onClick={() => deleteImage(img)}
          className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md p-1 shadow-sm"
          aria-label="Eliminar foto"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <select
        value={colorNames.find((c) => norm(c) === norm(img.color)) ?? img.color ?? ''}
        onChange={(e) => moveImage(img, e.target.value || null)}
        aria-label="Mover foto a otro color"
        title="Mover a otro color"
        className="mt-1 w-full border border-gray-200 rounded-md px-1 py-0.5 text-[11px] text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-400"
      >
        <option value="">Todos los colores</option>
        {img.color && !colorNames.some((c) => norm(c) === norm(img.color)) && (
          <option value={img.color}>{img.color} (sin variante)</option>
        )}
        {colorNames.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );

  const addPhotoTile = (color: string | null, tileKey: string) => (
    <label
      key={"add-${tileKey}"}
      className={`w-24 flex-shrink-0 aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
        uploadingKey === tileKey ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          uploadImages(files, color, tileKey);
        }}
      />
      {uploadingKey === tileKey ? (
        <span className="text-[11px] text-gray-400">Subiendo...</span>
      ) : (
        <>
          <PlusIcon className="h-6 w-6 text-gray-300" />
          <span className="text-[11px] text-gray-400 text-center leading-tight px-1">Agregar fotos</span>
        </>
      )}
    </label>
  );

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-100 text-gray-600">
          <b className="text-gray-800">{groups.length}</b> color{groups.length !== 1 ? 'es' : ''}
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-100 text-gray-600">
          Stock total: <b className="text-gray-800">{totalStock}</b>
        </span>
        {noPhotoColors.length > 0 && (
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            Sin foto: {noPhotoColors.map((g) => g.name).join(', ')}
          </span>
        )}
        {lowStockCount > 0 && (
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            {lowStockCount} talla{lowStockCount !== 1 ? 's' : ''} con stock bajo
          </span>
        )}
      </div>

      {/* Tarjeta por color */}
      {groups.map((g) => {
        const missing = SIZE_OPTIONS.filter((s) => !g.variants.some((v) => norm(v.size) === norm(s)));
        return (
          <section key={g.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-bold text-gray-800">{g.name}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => renameColor(g)}
                  className="text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1"
                >
                  <PencilIcon className="h-3.5 w-3.5" /> Renombrar
                </button>
                <button
                  onClick={() => deleteColor(g)}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                >
                  <TrashIcon className="h-3.5 w-3.5" /> Eliminar color
                </button>
              </div>
            </div>

            {/* Fotos del color */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fotos de este color</p>
            <div className="flex flex-wrap gap-3 mb-1">
              {g.images.map((img) => photoTile(img))}
              {addPhotoTile(g.name, g.key)}
            </div>
            {g.images.length === 0 && (
              <p className="text-xs text-amber-600 mb-1">
                Sin foto: en la tienda se mostrará la foto general o la primera del producto.
              </p>
            )}

            {/* Tallas */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-1">Tallas</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="font-medium pb-1">Talla</th>
                  <th className="font-medium pb-1">Precio (opcional)</th>
                  <th className="font-medium pb-1">Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {g.variants.map((v) => (
                  <SizeRow
                    key={`${v.id}-${v.stock}-${v.price}`}
                    variant={v}
                    basePrice={product.base_price}
                    onUpdate={(patch) => updateVariant(v, patch)}
                    onDelete={() => deleteVariant(v)}
                  />
                ))}
              </tbody>
            </table>
            {missing.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-xs text-gray-400 mr-1">Agregar talla:</span>
                {missing.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      addVariant(g.name, s)
                        .then(() => notify(`Talla ${s} agregada`))
                        .catch((e) => notify(e instanceof Error ? e.message : 'No se pudo agregar la talla.', false))
                    }
                    className="px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Agregar color */}
      {adding ? (
        <section className="bg-white rounded-2xl border border-dashed border-primary-300 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Nuevo color</h3>
            <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600" aria-label="Cancelar">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre del color</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ej: Negro"
              className="w-full max-w-xs border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tallas</p>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((s) => {
                const on = newSizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setNewSizes((p) => (on ? p.filter((x) => x !== s) : [...p, s]))}
                    className={`px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      on
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock inicial por talla</label>
              <input
                type="number"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fotos (opcional)</label>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                <PhotoIcon className="h-4 w-4" />
                {newFiles.length ? `${newFiles.length} foto(s) elegida(s)` : 'Elegir fotos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    setNewFiles(Array.from(e.target.files ?? []));
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>

          <button
            onClick={createColor}
            disabled={creating}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            {creating ? 'Creando...' : 'Crear color'}
          </button>
        </section>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 text-gray-500 hover:text-primary-600 text-sm font-semibold py-4 transition-colors"
        >
          <PlusIcon className="h-5 w-5" /> Agregar color
        </button>
      )}

      {/* Fotos generales */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-bold text-gray-800">Fotos generales</h3>
        <p className="text-xs text-gray-400 mb-3">
          No pertenecen a un color en particular: se ven siempre en la galería de la tienda.
        </p>
        <div className="flex flex-wrap gap-3">
          {generalImages.map((img) => photoTile(img))}
          {addPhotoTile(null, "general")}
        </div>
      </section>

      {/* Fotos con un color que ya no existe */}
      {orphanImages.length > 0 && (
        <section className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
          <h3 className="font-bold text-amber-800 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" /> Fotos sin variante
          </h3>
          <p className="text-xs text-amber-700 mb-3">
            Estas fotos apuntan a un color que ya no existe. Muévelas a un color o elimínalas.
          </p>
          <div className="flex flex-wrap gap-3">
            {orphanImages.map((img) => photoTile(img))}
          </div>
        </section>
      )}

      <p className="text-xs text-gray-400">
        Precio base del producto: {formatPrice(product.base_price)}. Si dejas el precio de una talla vacío, se usa ese.
      </p>
    </div>
  );
}

