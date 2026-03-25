'use client';

import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import { ArrowLeft, Bell } from 'lucide-react';

export default function AlunoAvisosPage() {
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
          <h1 className="font-bold text-[#1E3A5F] dark:text-white">Avisos</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-purple-50 dark:bg-purple-950 rounded-2xl flex items-center justify-center mb-6">
          <Bell size={36} className="text-purple-500" />
        </div>
        <h2 className="text-xl font-bold text-[#1E3A5F] dark:text-white mb-2">Em breve</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
          O mural de avisos está sendo desenvolvido e estará disponível em breve.
        </p>
      </main>
    </div>
  );
}
