import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-20 h-20 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-white text-3xl font-bold">404</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1E3A5F] dark:text-white">
          Página não encontrada
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#1E3A5F] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
