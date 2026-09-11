import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { RecentlyViewedProvider } from '@/context/RecentlyViewedContext';
import TopBar from '@/components/TopBar';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Belleza Íntima | Tu belleza, tu esencia, tu momento',
    template: '%s | Belleza Íntima',
  },
  description:
    'Lencería que celebra la mujer que eres. Sets, corsets, bodies y más. Envíos a toda Colombia.',
  keywords: [
    'lencería',
    'lencería Colombia',
    'sets de lencería',
    'corsets',
    'bodies',
    'pijamas',
    'ropa íntima',
    'Belleza Íntima',
  ],
  authors: [{ name: 'Belleza Íntima' }],
  creator: 'Belleza Íntima',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'Belleza Íntima',
    title: 'Belleza Íntima | Tu belleza, tu esencia, tu momento',
    description: 'Lencería que celebra la mujer que eres. Envíos a toda Colombia.',
    images: [{ url: '/logo.svg', alt: 'Belleza Íntima' }],
  },
  twitter: {
    card: 'summary',
    title: 'Belleza Íntima',
    description: 'Tu belleza, tu esencia, tu momento. Lencería que celebra la mujer que eres.',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-gray-50 min-h-screen`}>
        <RecentlyViewedProvider>
          <CartProvider>
            <TopBar />
            <Navbar />
            <CartDrawer />
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </RecentlyViewedProvider>
      </body>
    </html>
  );
}
