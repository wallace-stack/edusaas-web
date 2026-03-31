'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, BookOpen, Users, ClipboardList, CheckSquare } from 'lucide-react';

interface SchoolClass {
  id: number;
  name: string;
  year: number;
  shift?: string;
  totalStudents?: number;
  subjects?: { id: number; name: string }[];
}

export default function ProfessorTurmasPage() {
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
      const response = await api.get('/classes/my');
      setClasses(response.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Minhas Turmas</h1>
          </div>
          <span className="text-sm text-gray-400 dark:text-gray-500">{classes.length} turmas</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {classes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <BookOpen size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma turma atribuída</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c) => (
              <div key={c.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-purple-600" />
                  </div>
                  {c.shift && (
                    <span className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                      {shiftLabel[c.shift] || c.shift}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[#1E3A5F] dark:text-white mb-1">{c.name}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{c.year}</p>
                {c.totalStudents !== undefined && (
                  <div className="flex items-center gap-1 mb-4">
                    <Users size={13} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{c.totalStudents} alunos</span>
                  </div>
                )}
                {c.subjects && c.subjects.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Disciplinas:</p>
                    <div className="flex flex-wrap gap-1">
                      {c.subjects.slice(0, 3).map((s) => (
                        <span key={s.id} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-full">
                          {s.name}
                        </span>
                      ))}
                      {c.subjects.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                          +{c.subjects.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                  <button
                    onClick={() => router.push(`/dashboard/professor/notas?turmaId=${c.id}`)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  >
                    <ClipboardList size={14} />
                    Notas
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/professor/chamada?turmaId=${c.id}`)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 dark:bg-green-950 text-green-600 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                  >
                    <CheckSquare size={14} />
                    Chamada
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
