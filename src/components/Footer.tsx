'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-white border-t border-primary-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div className="flex flex-col items-start gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Belleza Íntima" width={48} height={48} />
              <span className="font-serif text-lg font-semibold text-primary-700">Belleza Íntima</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Lencería y más, con amor 🌸<br />
              Encuentra tu estilo con nosotras.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tienda</p>
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contacto</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a
                  href="https://wa.me/573217795555"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary-600 transition-colors"
                >
                  <span>💬</span> WhatsApp
                </a>
              </li>
              <li className="text-gray-400 text-xs mt-3">
                Pedidos y consultas por WhatsApp.<br />
                Respondemos a la mayor brevedad.
              </li>
            </ul>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://www.instagram.com/bellezaintima25?stkn=MWF3dHJ2dHE4bGd0Ng%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-400 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@belleza.intima.25?_r=1&_t=ZS-99bP1LUaCCG"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-400 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                </svg>
              </a>
            </div>
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
