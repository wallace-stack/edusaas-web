'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface Student {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  class?: { id: number; name: string } | null;
  className?: string;
  attendanceRate?: number;
  situation?: 'APPROVED' | 'RECOVERY' | 'FAILED' | 'NO_GRADES';
}

interface StudentDetail {
  id: number;
  name: string;
  email: string;
  class?: { id: number; name: string; year?: number } | null;
  className?: string;
  attendanceRate?: number;
  avgGrade?: number;
  situation?: string;
  classYear?: number | string;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianRelation?: string | null;
}

const situationConfig: Record<string, { label: string; cls: string }> = {
  APPROVED:  { label: 'Aprovado',    cls: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' },
  RECOVERY:  { label: 'Recuperação', cls: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' },
  FAILED:    { label: 'Reprovado',   cls: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' },
  NO_GRADES: { label: 'Sem notas',   cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
};

function AttBadge({ rate }: { rate?: number }) {
  if (rate == null) return <span className="text-xs text-gray-400">—</span>;
  const color = rate >= 75 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600';
  return <span className={`text-sm font-medium ${color}`}>{rate}%</span>;
}

function SituationBadge({ situation }: { situation?: string }) {
  if (!situation) return <span className="text-xs text-gray-400">—</span>;
  const cfg = situationConfig[situation] ?? { label: situation, cls: 'bg-gray-100 text-gray-500' };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

export default function DiretorAlunosPage() {
  const router = useRouter();
  const user = getUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [turmaFilter, setTurmaFilter] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const r = await api.get('/secretary/students');
      setStudents(r.data);
    } catch {
      try {
        const r = await api.get('/users?role=student');
        setStudents(r.data);
      } catch (err) { console.error(err); }
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (s: Student) => {
    setDetail({ ...s });
    setSheetOpen(true);
    setLoadingDetail(true);
    try {
      const r = await api.get(`/users/${s.id}/profile-detail`);
      setDetail(r.data);
    } catch {
      setDetail({ ...s });
    } finally {
      setLoadingDetail(false);
    }
  };

  const turmas = Array.from(new Set(
    students.map(s => s.className ?? s.class?.name).filter(Boolean)
  )) as string[];

  const filtered = students.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchTurma = !turmaFilter || (s.className ?? s.class?.name) === turmaFilter;
    return matchSearch && matchTurma;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Alunos</h1>
          </div>
          <span className="text-sm text-gray-400 dark:text-gray-500">{students.length} alunos</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          {turmas.length > 0 && (
            <select
              value={turmaFilter}
              onChange={e => setTurmaFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              <option value="">Todas as turmas</option>
              {turmas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center mb-4">
                <Users size={28} className="text-blue-400" />
              </div>
              <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Nenhum aluno encontrado</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {search || turmaFilter ? 'Tente ajustar os filtros.' : 'Peça à secretaria para matricular alunos.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Nome</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:table-cell">Turma</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hidden md:table-cell">Frequência</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hidden md:table-cell">Situação</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filtered.map(s => (
                    <tr
                      key={s.id}
                      onClick={() => openDetail(s)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{s.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 sm:hidden">{s.className ?? s.class?.name ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{s.className ?? s.class?.name ?? '—'}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 hidden md:table-cell">
                        <AttBadge rate={s.attendanceRate} />
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 hidden md:table-cell">
                        <SituationBadge situation={s.situation} />
                      </td>
                      <td className="px-4 sm:px-6 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.isActive
                            ? 'bg-green-50 dark:bg-green-950 text-green-700'
                            : 'bg-red-50 dark:bg-red-950 text-red-700'
                        }`}>
                          {s.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Sheet de detalhe do aluno */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex flex-col p-0">
          <SheetHeader>
            <SheetTitle>Detalhes do aluno</SheetTitle>
            <SheetDescription>
              {(detail?.className ?? detail?.class?.name) ? `Turma ${detail?.className ?? detail?.class?.name}` : 'Sem turma'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loadingDetail ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detail ? (
              <div className="space-y-4">
                {/* Avatar + nome */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="w-14 h-14 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-bold">{detail.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{detail.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{detail.email}</p>
                    {(detail.className ?? detail.class?.name) && (
                      <span className="inline-block mt-1 text-[11px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full">
                        {detail.className ?? detail.class?.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cards de métricas */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Frequência</p>
                    <p className={`text-lg font-bold ${
                      detail.attendanceRate == null ? 'text-gray-400'
                      : detail.attendanceRate >= 75 ? 'text-green-600'
                      : detail.attendanceRate >= 60 ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}>
                      {detail.attendanceRate != null ? `${detail.attendanceRate}%` : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Média</p>
                    <p className={`text-lg font-bold ${
                      detail.avgGrade == null ? 'text-gray-400'
                      : detail.avgGrade >= 7 ? 'text-green-600'
                      : detail.avgGrade >= 5 ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}>
                      {detail.avgGrade != null ? Number(detail.avgGrade).toFixed(1) : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Situação</p>
                    <div className="flex justify-center mt-1">
                      <SituationBadge situation={detail.situation} />
                    </div>
                  </div>
                </div>

                {/* Turma */}
                {(detail.className ?? detail.class?.name) && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Turma matriculada</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{detail.className ?? detail.class?.name}</p>
                    {(detail.classYear ?? detail.class?.year) && (
                      <p className="text-xs text-gray-400 mt-0.5">Ano letivo: {detail.classYear ?? detail.class?.year}</p>
                    )}
                  </div>
                )}

                {/* Contato */}
                {detail.phone && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Telefone</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{detail.phone}</p>
                  </div>
                )}
                {detail.guardianName && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Responsável</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{detail.guardianName}</p>
                    {detail.guardianPhone && (
                      <p className="text-xs text-gray-400 mt-0.5">{detail.guardianPhone} · {detail.guardianRelation}</p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
