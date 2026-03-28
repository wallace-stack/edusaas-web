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

  const bySubject: Record<string, { [period: number]: Grade[] }> = {};
  filtered.forEach(g => {
    const name = g.subject?.name || 'Sem disciplina';
    if (!bySubject[name]) bySubject[name] = { 1: [], 2: [], 3: [], 4: [] };
    bySubject[name][g.period]?.push(g);
  });

  const getPeriodAvg = (grades: Grade[]) => {
    if (!grades?.length) return null;
    return grades.reduce((acc, g) => acc + Number(g.value), 0) / grades.length;
  };

  const getSubjectAvg = (periods: { [period: number]: Grade[] }) => {
    const all = Object.values(periods).flat();
    if (!all.length) return null;
    return all.reduce((acc, g) => acc + Number(g.value), 0) / all.length;
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
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Minhas Notas</h1>
          </div>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Todos</option>
            <option value="1">1º Bim</option>
            <option value="2">2º Bim</option>
            <option value="3">3º Bim</option>
            <option value="4">4º Bim</option>
          </select>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {Object.keys(bySubject).length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma nota lançada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(bySubject).map(([subject, periods]) => {
              const avg = getSubjectAvg(periods);
              return (
                <div key={subject} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="font-semibold text-[#1E3A5F] dark:text-white text-sm">{subject}</h2>
                    <div className="flex items-center gap-2">
                      {avg !== null && (
                        <>
                          <span className={`text-base font-bold ${avg >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                            {avg.toFixed(1)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${avg >= 6 ? 'bg-green-50 dark:bg-green-950 text-green-700' : 'bg-red-50 dark:bg-red-950 text-red-700'}`}>
                            {avg >= 6 ? '✓ Aprovado' : '✗ Reprovado'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-50 dark:divide-gray-800">
                    {[1, 2, 3, 4].map(period => {
                      const periodAvg = getPeriodAvg(periods[period]);
                      const periodGrades = periods[period];
                      return (
                        <div key={period} className="p-3">
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-2">{period}º Bimestre</p>
                          {periodGrades?.length > 0 ? (
                            <div className="space-y-1">
                              {periodGrades.map(g => (
                                <div key={g.id} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{typeLabel[g.type]}</span>
                                  <span className={`text-sm font-bold ${Number(g.value) >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                                    {Number(g.value).toFixed(1)}
                                  </span>
                                </div>
                              ))}
                              {periodAvg !== null && periodGrades.length > 1 && (
                                <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-gray-700">
                                  <span className="text-xs text-gray-400 dark:text-gray-500">Média</span>
                                  <span className={`text-xs font-bold ${periodAvg >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                                    {periodAvg.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-300 dark:text-gray-600">—</p>
                          )}
                        </div>
                      );
                    })}
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
