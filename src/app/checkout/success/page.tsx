import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <span className="text-6xl block mb-4">🎉</span>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Pedido enviado!</h1>
      <p className="text-gray-500 mb-6">
        Tu pedido fue enviado a WhatsApp. Pronto nos comunicaremos contigo para confirmar la entrega.
      </p>
      <Link
        href="/"
        className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Seguir comprando
      </Link>
    </div>
  );
}
