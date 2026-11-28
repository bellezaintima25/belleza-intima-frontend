/** @type {import('next').NextConfig} */

// ---------------------------------------------------------------------------
// Encabezados de seguridad
// ---------------------------------------------------------------------------
// Orígenes que la tienda necesita de verdad (todo lo demás queda bloqueado):
//  - el backend (datos, pedidos)                     -> NEXT_PUBLIC_API_URL
//  - Cloudflare R2 (fotos y banners subidos)
//  - Google reCAPTCHA Enterprise (scripts, casilla y verificación)
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').origin;
  } catch {
    return 'http://localhost:8000';
  }
})();
const R2_ORIGIN = 'https://pub-463c68e8bfb54ae3a8372a52d2d2f105.r2.dev';

const isProd = process.env.NODE_ENV === 'production';

// Política de contenido (CSP). Se aplica solo en producción: en desarrollo Next necesita
// 'unsafe-eval' para recargar en caliente.
// 'unsafe-inline' en scripts es necesario porque Next.js inserta scripts en la página;
// aun así se bloquea todo script que no venga de la propia tienda o de Google reCAPTCHA.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${R2_ORIGIN} ${API_ORIGIN} https://www.gstatic.com https://www.google.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${API_ORIGIN} https://www.google.com https://www.gstatic.com`,
  'frame-src https://www.google.com https://recaptcha.google.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  // Nadie puede incrustar la tienda en otra página (evita el "clickjacking").
  { key: 'X-Frame-Options', value: 'DENY' },
  // El navegador no "adivina" el tipo de un archivo.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Al salir hacia otro sitio solo se comparte el dominio, no la dirección completa.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Funciones del dispositivo que la tienda no usa.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  ...(isProd ? [{ key: 'Content-Security-Policy', value: csp }] : []),
];

const nextConfig = {
  // No anunciar con qué está hecho el sitio.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket
      {
        protocol: 'https',
        hostname: 'pub-463c68e8bfb54ae3a8372a52d2d2f105.r2.dev',
      },
      // Keep this for any other external/CDN images
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Backend local (desarrollo): sirve /images subidas desde IMAGES_DIR
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
    ],
  },
};
export default nextConfig;
