'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, BookOpen, Users } from 'lucide-react';

interface SchoolClass {
  id: number;
  name: string;
  year: number;
  shift?: string;
  totalStudents?: number;
  teacher?: { name: string };
}

export default function CoordenadorTurmasPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const shiftLabel: Record<string, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Turmas</h1>
          </div>
          <span className="text-sm text-gray-400 dark:text-gray-500">{classes.length} turmas</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {classes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <BookOpen size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma turma cadastrada</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Turma</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Ano</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Turno</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Professor</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Alunos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 dark:bg-purple-950 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen size={16} className="text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{c.year}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {c.shift ? (shiftLabel[c.shift] || c.shift) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{c.teacher?.name || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{c.totalStudents ?? '—'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
