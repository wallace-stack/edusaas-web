'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../../lib/auth';
import api from '../../../../lib/api';
import { ArrowLeft, X } from 'lucide-react';

interface Grade {
  id: number;
  value: number;
  type: string;
  period: number;
  instrument: number;
  label: string;
  weight: number;
  description: string;
  student: { id: number; name: string };
  subject: { id: number; name: string };
}
interface SchoolClass { id: number; name: string; }
interface Subject { id: number; name: string; }

interface DetailPopover {
  studentName: string;
  period: number;
  grades: Grade[];
  avg: number;
  x: number;
  y: number;
}

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
  const [detail, setDetail] = useState<DetailPopover | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

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

  // Fecha detail ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (detail && !(e.target as HTMLElement).closest('.detail-popover') && !(e.target as HTMLElement).closest('.note-cell')) {
        setDetail(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [detail]);

  // Agrupa notas por aluno e bimestre
  const byStudent: Record<string, { id: number; periods: Record<number, Grade[]> }> = {};
  grades.forEach(g => {
    const name = g.student?.name || 'Aluno';
    if (!byStudent[name]) byStudent[name] = { id: g.student?.id, periods: { 1: [], 2: [], 3: [], 4: [] } };
    byStudent[name].periods[g.period]?.push(g);
  });

  // Média ponderada do bimestre
  const getPeriodAvg = (gs: Grade[]): number | null => {
    if (!gs?.length) return null;
    let sumW = 0, sumWt = 0;
    for (const g of gs) {
      const w = Number(g.weight) || 1;
      sumW += Number(g.value) * w;
      sumWt += w;
    }
    return sumWt > 0 ? Math.round((sumW / sumWt) * 10) / 10 : null;
  };

  // Média final = média das médias dos bimestres
  const getOverallAvg = (periods: Record<number, Grade[]>): number | null => {
    const avgs: number[] = [];
    for (let b = 1; b <= 4; b++) {
      const avg = getPeriodAvg(periods[b]);
      if (avg !== null) avgs.push(avg);
    }
    if (!avgs.length) return null;
    const sum = avgs.reduce((a, b) => a + b, 0);
    return Math.round((sum / avgs.length) * 10) / 10;
  };

  const handleCellClick = (e: React.MouseEvent, studentName: string, period: number, gs: Grade[], avg: number) => {
    if (!gs.length) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const tableRect = tableRef.current?.getBoundingClientRect();
    setDetail({
      studentName,
      period,
      grades: gs.sort((a, b) => (a.instrument || 1) - (b.instrument || 1)),
      avg,
      x: rect.left - (tableRect?.left || 0) + rect.width / 2,
      y: rect.bottom - (tableRect?.top || 0) + 8,
    });
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative" ref={tableRef}>
            {/* Popover de detalhe */}
            {detail && (
              <div
                className="detail-popover absolute z-50 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[220px]"
                style={{
                  left: `${Math.min(Math.max(detail.x - 110, 8), 500)}px`,
                  top: `${detail.y}px`,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{detail.studentName}</p>
                    <p className="text-xs text-gray-400">{detail.period}º Bimestre</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>
                <div className="space-y-2">
                  {detail.grades.map((g, i) => (
                    <div key={g.id || i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 uppercase w-4">{g.instrument || i + 1}º</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {g.label || `Instrumento ${g.instrument || i + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${Number(g.value) >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                          {Number(g.value).toFixed(1)}
                        </span>
                        {Number(g.weight) !== 1 && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            ×{Number(g.weight)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Média ponderada</span>
                  <span className={`text-sm font-bold ${detail.avg >= 6 ? 'text-green-600' : detail.avg >= 5 ? 'text-orange-500' : 'text-red-500'}`}>
                    {detail.avg.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Tabela */}
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
                    const { periods } = byStudent[studentName];
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
                                <button
                                  className="note-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-lg transition-colors"
                                  onClick={(e) => handleCellClick(e, studentName, b, periods[b], bAvg)}
                                  title="Clique para ver detalhes dos instrumentos"
                                >
                                  <span className={`text-sm font-bold ${bAvg >= 6 ? 'text-green-600' : bAvg >= 5 ? 'text-orange-500' : 'text-red-500'}`}>
                                    {bAvg.toFixed(1)}
                                  </span>
                                  {periods[b].length > 1 && (
                                    <span className="text-[9px] text-gray-400 ml-1">
                                      ({periods[b].length})
                                    </span>
                                  )}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          {avg !== null ? (
                            <span className={`text-sm font-bold ${avg >= 6 ? 'text-green-600' : avg >= 5 ? 'text-orange-500' : 'text-red-500'}`}>
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

            {/* Rodapé */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><span className="text-green-600 font-bold">≥ 6.0</span> Aprovado</span>
              <span className="flex items-center gap-1"><span className="text-orange-600 font-bold">5.0–5.9</span> Recuperação</span>
              <span className="flex items-center gap-1"><span className="text-red-500 font-bold">{'< 5.0'}</span> Reprovado</span>
              <span className="ml-auto">{sortedStudents.length} alunos</span>
            </div>

            {/* Hint */}
            <div className="px-4 py-2 text-[10px] text-gray-400 dark:text-gray-600">
              Clique na nota de um bimestre para ver os instrumentos de avaliação
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
