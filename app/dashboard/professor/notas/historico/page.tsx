'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../../lib/auth';
import api from '../../../../lib/api';
import { ArrowLeft } from 'lucide-react';

interface Grade {
  id: number;
  value: number;
  type: string;
  period: number;
  description: string;
  student: { id: number; name: string };
  subject: { id: number; name: string };
}
interface SchoolClass { id: number; name: string; }
interface Subject { id: number; name: string; }

export default function ProfessorNotasHistoricoPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/classes/my')
      .then(r => setClasses(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (classFilter) {
      api.get(`/classes/${classFilter}/subjects`)
        .then(r => setSubjects(r.data))
        .catch(console.error);
      setGrades([]);
      setSubjectFilter('');
    }
  }, [classFilter]);

  useEffect(() => {
    if (classFilter && subjectFilter) {
      setLoadingGrades(true);
      api.get(`/grades/class/${classFilter}/subject/${subjectFilter}`)
        .then(r => setGrades(r.data))
        .catch(console.error)
        .finally(() => setLoadingGrades(false));
    } else {
      setGrades([]);
    }
  }, [classFilter, subjectFilter]);

  // Agrupa notas por aluno e bimestre
  const byStudent: Record<string, Record<number, Grade[]>> = {};
  grades.forEach(g => {
    const name = g.student?.name || 'Aluno';
    if (!byStudent[name]) byStudent[name] = { 1: [], 2: [], 3: [], 4: [] };
    byStudent[name][g.period]?.push(g);
  });

  const getPeriodAvg = (gs: Grade[]) => {
    if (!gs?.length) return null;
    return gs.reduce((acc, g) => acc + Number(g.value), 0) / gs.length;
  };

  const getOverallAvg = (periods: Record<number, Grade[]>) => {
    const all = Object.values(periods).flat();
    if (!all.length) return null;
    return all.reduce((acc, g) => acc + Number(g.value), 0) / all.length;
  };

  const sortedStudents = Object.keys(byStudent).sort((a, b) => a.localeCompare(b));

  const selectCls = "px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Boletim da Turma</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={selectCls}>
            <option value="">Selecione a turma</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} disabled={!classFilter} className={`${selectCls} disabled:opacity-50`}>
            <option value="">Selecione a disciplina</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Conteúdo */}
        {!classFilter || !subjectFilter ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Selecione turma e disciplina para ver o boletim</p>
          </div>
        ) : loadingGrades ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedStudents.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma nota lançada ainda</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Tabela — scroll horizontal no mobile */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Aluno</th>
                    {[1,2,3,4].map(b => (
                      <th key={b} className="text-center px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {b}º Bim
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Média</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {sortedStudents.map(studentName => {
                    const periods = byStudent[studentName];
                    const avg = getOverallAvg(periods);
                    const approved = avg !== null && avg >= 6;
                    const recovering = avg !== null && avg >= 5 && avg < 6;

                    return (
                      <tr key={studentName} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{studentName.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
                              {studentName}
                            </span>
                          </div>
                        </td>
                        {[1,2,3,4].map(b => {
                          const bAvg = getPeriodAvg(periods[b]);
                          return (
                            <td key={b} className="px-3 py-3 text-center">
                              {bAvg !== null ? (
                                <span className={`text-sm font-bold ${bAvg >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                                  {bAvg.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          {avg !== null ? (
                            <span className={`text-sm font-bold ${avg >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                              {avg.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {avg !== null ? (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              approved
                                ? 'bg-green-50 dark:bg-green-950 text-green-700'
                                : recovering
                                ? 'bg-orange-50 dark:bg-orange-950 text-orange-700'
                                : 'bg-red-50 dark:bg-red-950 text-red-700'
                            }`}>
                              {approved ? '✓ Aprovado' : recovering ? '~ Recuperação' : '✗ Reprovado'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé com legenda */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><span className="text-green-600 font-bold">≥ 6.0</span> Aprovado</span>
              <span className="flex items-center gap-1"><span className="text-orange-600 font-bold">5.0–5.9</span> Recuperação</span>
              <span className="flex items-center gap-1"><span className="text-red-500 font-bold">{'< 5.0'}</span> Reprovado</span>
              <span className="ml-auto">{sortedStudents.length} alunos</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
