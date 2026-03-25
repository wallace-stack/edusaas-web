'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft } from 'lucide-react';

interface Grade {
  id: number;
  value: number;
  type: string;
  description: string;
  period: number;
  subject: { name: string };
  createdAt: string;
}

const typeLabel: any = {
  exam: 'Prova',
  assignment: 'Trabalho',
  quiz: 'Quiz',
  final: 'Final',
};

export default function AlunoNotasPage() {
  const router = useRouter();
  const user = getUser();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const response = await api.get('/grades/my-grades');
      setGrades(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = periodFilter
    ? grades.filter(g => g.period === Number(periodFilter))
    : grades;

  // Agrupa por disciplina
  const bySubject: any = {};
  filtered.forEach(g => {
    const name = g.subject?.name || 'Sem disciplina';
    if (!bySubject[name]) bySubject[name] = [];
    bySubject[name].push(g);
  });

  const getAverage = (grades: Grade[]) => {
    if (!grades.length) return 0;
    const sum = grades.reduce((acc, g) => acc + Number(g.value), 0);
    return Math.round((sum / grades.length) * 100) / 100;
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
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Minhas Notas</h1>
          </div>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Todos os bimestres</option>
            <option value="1">1º Bimestre</option>
            <option value="2">2º Bimestre</option>
            <option value="3">3º Bimestre</option>
            <option value="4">4º Bimestre</option>
          </select>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {Object.keys(bySubject).length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma nota lançada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(bySubject).map(([subject, subjectGrades]: any) => {
              const avg = getAverage(subjectGrades);
              return (
                <div key={subject} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="font-semibold text-[#1E3A5F] dark:text-white">{subject}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Média:</span>
                      <span className={`text-lg font-bold ${avg >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                        {avg.toFixed(1)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${avg >= 6 ? 'bg-green-50 dark:bg-green-950 text-green-700' : 'bg-red-50 dark:bg-red-950 text-red-700'}`}>
                        {avg >= 6 ? 'Aprovado' : 'Reprovado'}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {subjectGrades.map((grade: Grade) => (
                      <div key={grade.id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{typeLabel[grade.type]} — {grade.period}º Bimestre</p>
                          {grade.description && <p className="text-xs text-gray-400 dark:text-gray-500">{grade.description}</p>}
                        </div>
                        <span className={`text-xl font-bold ${Number(grade.value) >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                          {Number(grade.value).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
