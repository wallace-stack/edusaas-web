'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-950 rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-red-500 text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Algo deu errado
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Ocorreu um erro inesperado. Tente novamente ou volte ao início.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#1E3A5F] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
          >
            Tentar novamente
          </button>
          <Link
            href="/login"
            className="border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
