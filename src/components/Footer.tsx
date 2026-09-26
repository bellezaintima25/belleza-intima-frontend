'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

export default function Footer({ compact = false }: { compact?: boolean }) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Versión reducida (para el panel de administración): solo marca,
  // derechos reservados y botón de volver arriba.
  if (compact) {
    return (
      <footer className="bg-white border-t border-primary-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Belleza Íntima" width={36} height={36} />
            <span className="font-serif text-base font-semibold text-primary-600">Belleza Íntima</span>
          </Link>
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Belleza Íntima. Todos los derechos reservados.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 transition-colors group"
            aria-label="Volver arriba"
          >
            Volver arriba
            <span className="w-7 h-7 rounded-full border border-gray-200 group-hover:border-primary-400 flex items-center justify-center transition-colors">
              <ChevronUpIcon className="h-4 w-4" />
            </span>
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-white border-t border-primary-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div className="flex flex-col items-start gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Belleza Íntima" width={48} height={48} />
              <span className="font-serif text-lg font-semibold text-primary-600">Belleza Íntima</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Tu belleza, tu esencia, tu momento.<br />
              Lencería que celebra la mujer que eres.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-4">Tienda</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/catalogo" className="hover:text-primary-600 transition-colors">Catálogo</Link></li>
              <li><Link href="/catalogo?category=SET" className="hover:text-primary-600 transition-colors">Sets</Link></li>
              <li><Link href="/catalogo?category=CORSET" className="hover:text-primary-600 transition-colors">Corsets</Link></li>
              <li><Link href="/catalogo?category=BODY" className="hover:text-primary-600 transition-colors">Bodies</Link></li>
              <li><Link href="/catalogo?category=PIJAMA" className="hover:text-primary-600 transition-colors">Pijamas</Link></li>
              <li><Link href="/nuestra-marca" className="hover:text-primary-600 transition-colors">Nuestra marca</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-4">Contacto</p>

            {/* Redes en paralelo: ícono arriba, etiqueta debajo */}
            <div className="flex items-start gap-6">
              {/* WhatsApp */}
              <a
                href="https://wa.me/573217795555"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="group flex flex-col items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors"
              >
                <span className="w-12 h-12 rounded-full border border-gray-200 group-hover:border-primary-400 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/>
                  </svg>
                </span>
                <span className="text-xs font-medium">WhatsApp</span>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/bellezaintima25?stkn=MWF3dHJ2dHE4bGd0Ng%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="group flex flex-col items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors"
              >
                <span className="w-12 h-12 rounded-full border border-gray-200 group-hover:border-primary-400 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </span>
                <span className="text-xs font-medium">Instagram</span>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@belleza.intima.25?_r=1&_t=ZS-99bP1LUaCCG"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="group flex flex-col items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors"
              >
                <span className="w-12 h-12 rounded-full border border-gray-200 group-hover:border-primary-400 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                  </svg>
                </span>
                <span className="text-xs font-medium">TikTok</span>
              </a>
            </div>

            <p className="text-gray-400 text-xs mt-4 leading-relaxed">
              Pedidos y consultas por WhatsApp.<br />
              Respondemos a la mayor brevedad.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Belleza Íntima. Todos los derechos reservados.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 transition-colors group"
            aria-label="Volver arriba"
          >
            Volver arriba
            <span className="w-7 h-7 rounded-full border border-gray-200 group-hover:border-primary-400 flex items-center justify-center transition-colors">
              <ChevronUpIcon className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
