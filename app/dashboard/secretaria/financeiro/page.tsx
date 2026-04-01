'use client';

import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import { ArrowLeft, DollarSign } from 'lucide-react';

export default function SecretariaFinanceiroPage() {
  const router = useRouter();
  const user = getUser();

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="font-bold text-[#1E3A5F] dark:text-white">Financeiro</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950 rounded-2xl flex items-center justify-center mb-6">
          <DollarSign size={36} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-[#1E3A5F] dark:text-white mb-3">Módulo financeiro</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm leading-relaxed">
          A integração com pagamentos estará disponível em breve.
          Por enquanto, os dados financeiros podem ser gerenciados manualmente.
        </p>
        <a
          href="mailto:suporte@edusaas.com.br"
          className="mt-8 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Falar com suporte
        </a>
      </main>
    </div>
  );
}
