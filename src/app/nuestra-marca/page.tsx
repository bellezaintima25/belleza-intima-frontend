import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Nuestra marca | Belleza Íntima',
  description: 'Conoce la historia y los valores de Belleza Íntima.',
};

export default function NuestraMarcaPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center flex flex-col items-center">
          <Image src="/logo.svg" alt="Belleza Íntima" width={100} height={100} className="mb-6" />
          <h1 className="font-serif text-4xl font-semibold text-gray-800">Nuestra marca</h1>
          <p className="mt-4 text-gray-500 max-w-xl">
            Más que lencería: una experiencia pensada para que te sientas hermosa,
            cómoda y segura de ti misma.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 py-14 space-y-12">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-800 mb-3">Quiénes somos</h2>
          <p className="text-gray-600 leading-relaxed">
            Belleza Íntima nació con un propósito claro: ofrecer lencería de calidad
            que combine elegancia, comodidad y estilo. Cada prenda es seleccionada
            con dedicación, pensando en resaltar lo mejor de cada mujer.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-800 mb-3">Nuestra promesa</h2>
          <p className="text-gray-600 leading-relaxed">
            Nos comprometemos a brindarte productos que te hagan sentir especial, con
            una atención cercana y personalizada. Queremos que cada compra sea una
            experiencia agradable, desde que eliges tu prenda hasta que la recibes.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <span className="text-3xl block mb-2">🌸</span>
            <h3 className="font-serif text-lg text-gray-800 mb-1">Calidad</h3>
            <p className="text-sm text-gray-500">Prendas seleccionadas con el mejor cuidado y detalle.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <span className="text-3xl block mb-2">💝</span>
            <h3 className="font-serif text-lg text-gray-800 mb-1">Cercanía</h3>
            <p className="text-sm text-gray-500">Atención personalizada por WhatsApp en cada pedido.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <span className="text-3xl block mb-2">✨</span>
            <h3 className="font-serif text-lg text-gray-800 mb-1">Estilo</h3>
            <p className="text-sm text-gray-500">Diseños que realzan tu belleza y tu seguridad.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/catalogo"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            Explora nuestra colección
          </Link>
        </div>
      </section>
    </div>
  );
}
