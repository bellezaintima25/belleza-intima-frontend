'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import { categoryLabel } from '@/lib/format';

// Categories that have a cover on the home page.
const CATEGORY_KEYS = ['SET', 'CORSET', 'BODY', 'PIJAMA'];

export default function AdminCoversPage() {
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [catalogImages, setCatalogImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [picker, setPicker] = useState<string | null>(null); // category whose gallery is open
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [coverList, products] = await Promise.all([
        adminApi.categories.covers(),
        adminApi.products.list(),
      ]);
      const map: Record<string, string> = {};
      coverList.forEach((c) => { map[c.category] = c.image_url; });
      setCovers(map);

      // Unique catalog image URLs for the "pick existing" gallery.
      const urls = new Set<string>();
      products.forEach((p) => p.images.forEach((img) => urls.add(img.url)));
      setCatalogImages(Array.from(urls));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setCover = async (category: string, imageUrl: string) => {
    setSaving(category);
    const prev = covers[category];
    setCovers((c) => ({ ...c, [category]: imageUrl })); // optimistic
    try {
      await adminApi.categories.setCover(category, imageUrl);
      setPicker(null);
    } catch {
      setCovers((c) => ({ ...c, [category]: prev })); // revert
      alert('No se pudo guardar la portada. Intenta de nuevo.');
    } finally {
      setSaving(null);
    }
  };

  const handleUpload = async (category: string, file: File) => {
    setSaving(category);
    try {
      const uploaded = await adminApi.categories.uploadCover(file);
      await adminApi.categories.setCover(category, uploaded.url);
      setCovers((c) => ({ ...c, [category]: uploaded.url }));
      // Make the freshly uploaded image available in the gallery too.
      setCatalogImages((imgs) => (imgs.includes(uploaded.url) ? imgs : [uploaded.url, ...imgs]));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Portadas de categoría</h1>
        <p className="text-gray-400 text-sm mt-1">
          Cambia la foto que aparece en “Explora por categoría” de la página de inicio.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CATEGORY_KEYS.map((k) => (
            <div key={k} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CATEGORY_KEYS.map((category) => {
            const current = covers[category];
            const isSaving = saving === category;
            return (
              <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Current cover preview */}
                <div className="relative aspect-video bg-primary-50">
                  {current ? (
                    <Image src={current} alt={categoryLabel(category)} fill sizes="400px" className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-gray-300">Sin portada</span>
                  )}
                  <span className="absolute top-3 left-3 bg-black/50 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    {categoryLabel(category)}
                  </span>
                  {isSaving && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-sm">
                      Guardando…
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 flex flex-wrap gap-2">
                  <input
                    ref={(el) => { fileInputs.current[category] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(category, f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputs.current[category]?.click()}
                    disabled={isSaving}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    Subir nueva foto
                  </button>
                  <button
                    onClick={() => setPicker(picker === category ? null : category)}
                    disabled={isSaving}
                    className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    {picker === category ? 'Cerrar catálogo' : 'Elegir del catálogo'}
                  </button>
                </div>

                {/* Catalog gallery picker */}
                {picker === category && (
                  <div className="px-4 pb-4">
                    {catalogImages.length === 0 ? (
                      <p className="text-sm text-gray-400">No hay imágenes en el catálogo todavía.</p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                        {catalogImages.map((url) => (
                          <button
                            key={url}
                            onClick={() => setCover(category, url)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                              current === url ? 'border-primary-600' : 'border-transparent hover:border-primary-300'
                            }`}
                            title="Usar esta imagen"
                          >
                            <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
