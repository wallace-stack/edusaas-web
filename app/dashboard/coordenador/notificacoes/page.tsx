'use client';

import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import { ArrowLeft, Bell } from 'lucide-react';

export default function CoordenadorNotificacoesPage() {
  const router = useRouter();
  const user = getUser();

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="font-bold text-[#1E3A5F]">Notificações</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
          <Bell size={36} className="text-[#F97316]" />
        </div>
        <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">Em breve</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          O módulo de notificações está sendo desenvolvido e estará disponível em breve.
        </p>
      </main>
    </div>
  );
}
