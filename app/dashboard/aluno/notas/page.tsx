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
  period: number;
  instrument: number;
  label: string;
  weight: number;
  description: string;
  subject: { name: string };
}

export default function AlunoNotasPage() {
  const router = useRouter();
  const user = getUser();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/grades/my-grades')
      .then(r => setGrades(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = periodFilter ? grades.filter(g => g.period === Number(periodFilter)) : grades;

  const bySubject: Record<string, Record<number, Grade[]>> = {};
  filtered.forEach(g => {
    const name = g.subject?.name || 'Sem disciplina';
    if (!bySubject[name]) bySubject[name] = { 1: [], 2: [], 3: [], 4: [] };
    bySubject[name][g.period]?.push(g);
  });

  const getPeriodAvg = (gs: Grade[]): number | null => {
    if (!gs?.length) return null;
    let sw = 0, wt = 0;
    for (const g of gs) { const w = Number(g.weight) || 1; sw += Number(g.value) * w; wt += w; }
    return wt > 0 ? Math.round((sw / wt) * 10) / 10 : null;
  };

  const getSubjectAvg = (periods: Record<number, Grade[]>): number | null => {
    const avgs: number[] = [];
    for (let b = 1; b <= 4; b++) { const a = getPeriodAvg(periods[b]); if (a !== null) avgs.push(a); }
    if (!avgs.length) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Minhas notas</h1>
          </div>
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}
            className="px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
            <option value="">Todos</option>
            {[1,2,3,4].map(b => <option key={b} value={b}>{b}º Bim</option>)}
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
            {Object.entries(bySubject).sort(([a],[b]) => a.localeCompare(b)).map(([subject, periods]) => {
              const avg = getSubjectAvg(periods);
              const approved = avg !== null && avg >= 6;
              const recovering = avg !== null && avg >= 5 && avg < 6;
              return (
                <div key={subject} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="font-semibold text-[#1E3A5F] dark:text-white text-sm">{subject}</h2>
                    {avg !== null && (
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold ${approved ? 'text-green-600' : recovering ? 'text-orange-500' : 'text-red-500'}`}>
                          {avg.toFixed(1)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          approved ? 'bg-green-50 dark:bg-green-950 text-green-700'
                          : recovering ? 'bg-orange-50 dark:bg-orange-950 text-orange-700'
                          : 'bg-red-50 dark:bg-red-950 text-red-700'
                        }`}>
                          {approved ? 'Aprovado' : recovering ? 'Recuperação' : 'Reprovado'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-50 dark:divide-gray-800">
                    {[1,2,3,4].map(b => {
                      const gs = (periods[b] || []).sort((a,b) => (a.instrument||1) - (b.instrument||1));
                      const bAvg = getPeriodAvg(gs);
                      return (
                        <div key={b} className="p-3">
                          <p className="text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wider">{b}º Bimestre</p>
                          {gs.length > 0 ? (
                            <div className="space-y-1.5">
                              {gs.map((g, i) => (
                                <div key={g.id || i} className="flex items-center justify-between">
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                                    {g.label || `Instr. ${g.instrument || i+1}`}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-sm font-bold ${Number(g.value) >= 6 ? 'text-green-600' : Number(g.value) >= 5 ? 'text-orange-500' : 'text-red-500'}`}>
                                      {Number(g.value).toFixed(1)}
                                    </span>
                                    {Number(g.weight) !== 1 && (
                                      <span className="text-[9px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 rounded">×{Number(g.weight)}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {gs.length > 1 && bAvg !== null && (
                                <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700">
                                  <span className="text-[10px] text-gray-400">Média</span>
                                  <span className={`text-xs font-bold ${bAvg >= 6 ? 'text-green-600' : bAvg >= 5 ? 'text-orange-500' : 'text-red-500'}`}>
                                    {bAvg.toFixed(1)}
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
