'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, BookOpen, Users, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface SchoolClass {
  id: number;
  name: string;
  year: number;
  shift?: string;
  totalStudents?: number;
  totalSubjects?: number;
  teacher?: { name: string };
}

interface Subject {
  id: number;
  name: string;
  teacher?: { id: number; name: string };
}

interface Teacher {
  id: number;
  name: string;
}

interface ClassStudent {
  id: number;
  name: string;
  situation?: string;
}

const situationConfig: Record<string, { label: string; cls: string }> = {
  APPROVED:  { label: 'Aprovado',    cls: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' },
  RECOVERY:  { label: 'Recuperação', cls: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' },
  FAILED:    { label: 'Reprovado',   cls: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' },
  NO_GRADES: { label: 'Sem notas',   cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
};

export default function CoordenadorTurmasPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [classStudents, setClassStudents] = useState<Record<number, ClassStudent[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<number | null>(null);

  const [manageClass, setManageClass] = useState<SchoolClass | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjectForm, setSubjectForm] = useState({ name: '', teacherId: '' });
  const [savingSubject, setSavingSubject] = useState(false);

  const toggleExpand = async (c: SchoolClass) => {
    if (expandedId === c.id) { setExpandedId(null); return; }
    setExpandedId(c.id);
    if (classStudents[c.id]) return;
    setLoadingStudents(c.id);
    try {
      const r = await api.get(`/classes/${c.id}/students`);
      setClassStudents(prev => ({ ...prev, [c.id]: r.data }));
    } catch { setClassStudents(prev => ({ ...prev, [c.id]: [] })); }
    finally { setLoadingStudents(null); }
  };

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

  const openManageModal = async (c: SchoolClass) => {
    setManageClass(c);
    try {
      const [subRes, teachRes] = await Promise.all([
        api.get(`/classes/${c.id}/subjects`),
        api.get('/secretary/teachers'),
      ]);
      setSubjects(subRes.data);
      setTeachers(teachRes.data);
    } catch (err) { console.error(err); }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageClass) return;
    try {
      setSavingSubject(true);
      await api.post(`/classes/${manageClass.id}/subjects`, {
        name: subjectForm.name,
        teacherId: Number(subjectForm.teacherId),
      });
      setSubjectForm({ name: '', teacherId: '' });
      const res = await api.get(`/classes/${manageClass.id}/subjects`);
      setSubjects(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao adicionar disciplina');
    } finally { setSavingSubject(false); }
  };

  const handleRemoveSubject = async (subjectId: number) => {
    if (!manageClass || !confirm('Remover esta disciplina?')) return;
    try {
      await api.delete(`/classes/${manageClass.id}/subjects/${subjectId}`);
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
    } catch (err) { console.error(err); }
  };

  const shiftLabel: Record<string, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite',
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100";

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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="font-medium text-lg text-gray-700 dark:text-gray-200 mb-1">Sem turmas cadastradas</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
              O diretor pode criar turmas no painel de gestão.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Turma</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:table-cell">Ano</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hidden md:table-cell">Turno</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:table-cell">Alunos</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <>
                    <tr
                      key={c.id}
                      onClick={() => toggleExpand(c)}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-50 dark:bg-purple-950 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen size={16} className="text-purple-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{c.name}</span>
                            {c.totalSubjects != null && (
                              <p className="text-[11px] text-gray-400">{c.totalSubjects} disciplina{c.totalSubjects !== 1 ? 's' : ''}</p>
                            )}
                          </div>
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
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{c.totalStudents ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={e => { e.stopPropagation(); openManageModal(c); }}
                            className="text-xs text-[#1E3A5F] dark:text-blue-400 border border-[#1E3A5F] dark:border-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors whitespace-nowrap"
                          >
                            Disciplinas
                          </button>
                          <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 ${expandedId === c.id ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr key={`expand-${c.id}`} className="bg-gray-50 dark:bg-gray-800/50">
                        <td colSpan={5} className="px-6 py-3">
                          {loadingStudents === c.id ? (
                            <div className="flex justify-center py-3">
                              <div className="w-5 h-5 border-2 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (classStudents[c.id] ?? []).length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Nenhum aluno matriculado nesta turma.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2 py-1">
                              {(classStudents[c.id] ?? []).map(s => {
                                const sit = s.situation ? situationConfig[s.situation] : null;
                                return (
                                  <div key={s.id} className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-1.5">
                                    <span className="text-xs text-gray-700 dark:text-gray-200">{s.name}</span>
                                    {sit && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sit.cls}`}>{sit.label}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal: Gerenciar disciplinas */}
      {manageClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white">Disciplinas</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{manageClass.name} · {manageClass.year}</p>
              </div>
              <button onClick={() => setManageClass(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {subjects.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhuma disciplina ainda</p>
              ) : (
                subjects.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {s.teacher ? `Prof. ${s.teacher.name}` : 'Sem professor'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveSubject(s.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">Adicionar disciplina</p>
              <form onSubmit={handleAddSubject} className="space-y-3">
                <input
                  value={subjectForm.name}
                  onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="Nome da disciplina (ex: Matemática)"
                  required
                  className={inputCls}
                />
                <select
                  value={subjectForm.teacherId}
                  onChange={e => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}
                  required
                  className={inputCls}
                >
                  <option value="">Selecione o professor *</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={savingSubject}
                  className="w-full py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50"
                >
                  {savingSubject ? 'Adicionando...' : 'Adicionar disciplina'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
