'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, BookOpen, Users, X, ChevronRight, Phone, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import { maskCPF } from '../../../lib/utils';

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

interface StudentDetail {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  birthDate?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianRelation?: string | null;
  isActive: boolean;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function formatDate(raw?: string | null) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('pt-BR');
}

export default function CoordenadorTurmasPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  const [manageClass, setManageClass] = useState<SchoolClass | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjectForm, setSubjectForm] = useState({ name: '', teacherId: '' });
  const [savingSubject, setSavingSubject] = useState(false);

  // Drawer de alunos
  const [studentsClass, setStudentsClass] = useState<SchoolClass | null>(null);
  const [drawerStudents, setDrawerStudents] = useState<StudentDetail[]>([]);
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);

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

  const openStudentsDrawer = async (c: SchoolClass) => {
    setStudentsClass(c);
    setSelectedStudent(null);
    setDrawerStudents([]);
    setLoadingDrawer(true);
    try {
      const res = await api.get(`/secretary/classes/${c.id}/students`);
      setDrawerStudents(res.data);
    } catch {
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoadingDrawer(false);
    }
  };

  const closeStudentsDrawer = () => {
    setStudentsClass(null);
    setSelectedStudent(null);
    setDrawerStudents([]);
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
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                            onClick={() => openStudentsDrawer(c)}
                            className="text-xs text-[#F97316] border border-[#F97316] px-3 py-1.5 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors whitespace-nowrap"
                          >
                            Alunos
                          </button>
                          <button
                            onClick={() => openManageModal(c)}
                            className="text-xs text-[#1E3A5F] dark:text-blue-400 border border-[#1E3A5F] dark:border-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors whitespace-nowrap"
                          >
                            Disciplinas
                          </button>
                        </div>
                      </td>
                    </tr>
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

      {/* Drawer: Alunos da turma */}
      {studentsClass && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closeStudentsDrawer} />
          <div className="relative w-full max-w-[500px] bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-semibold text-[#1E3A5F] dark:text-white text-sm">
                  {selectedStudent ? selectedStudent.name : studentsClass.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {selectedStudent ? studentsClass.name : `${drawerStudents.length} aluno${drawerStudents.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button onClick={closeStudentsDrawer} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!selectedStudent && (
                <div className="p-4">
                  {loadingDrawer ? (
                    <div className="flex justify-center py-12">
                      <div className="w-7 h-7 border-2 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : drawerStudents.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <Users size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum aluno matriculado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {drawerStudents.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedStudent(s)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#1E3A5F] dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-white">{initials(s.name)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{s.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                              {s.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedStudent && (
                <div className="p-5 space-y-4">
                  {/* Botão Voltar */}
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[#1E3A5F] dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft size={15} />
                    Voltar para lista
                  </button>

                  {/* Avatar + nome */}
                  <div className="flex items-center gap-4 py-4 border-y border-gray-100 dark:border-gray-800">
                    <div className="w-14 h-14 rounded-full bg-[#1E3A5F] dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">{initials(selectedStudent.name)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{selectedStudent.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selectedStudent.email}</p>
                      <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${selectedStudent.isActive ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
                        {selectedStudent.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  {/* Dados Pessoais */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={14} className="text-[#1E3A5F] dark:text-blue-400" />
                      <p className="text-xs font-semibold text-[#1E3A5F] dark:text-blue-400 uppercase tracking-wider">Dados Pessoais</p>
                    </div>
                    <div className="space-y-2.5">
                      <InfoRow label="Nome completo" value={selectedStudent.name} />
                      <InfoRow label="CPF" value={maskCPF(selectedStudent.document)} />
                      <InfoRow label="Nascimento" value={formatDate(selectedStudent.birthDate)} />
                      <InfoRow label="Telefone" value={selectedStudent.phone} />
                    </div>
                  </div>

                  {/* Endereço */}
                  {(selectedStudent.address || selectedStudent.city) && (
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={14} className="text-[#1E3A5F] dark:text-blue-400" />
                        <p className="text-xs font-semibold text-[#1E3A5F] dark:text-blue-400 uppercase tracking-wider">Endereço</p>
                      </div>
                      <div className="space-y-2.5">
                        {(selectedStudent.address || selectedStudent.addressNumber) && (
                          <InfoRow
                            label="Logradouro"
                            value={[selectedStudent.address, selectedStudent.addressNumber].filter(Boolean).join(', ')}
                          />
                        )}
                        {(selectedStudent.city || selectedStudent.state) && (
                          <InfoRow
                            label="Cidade / Estado"
                            value={[selectedStudent.city, selectedStudent.state].filter(Boolean).join(' — ')}
                          />
                        )}
                        <InfoRow label="CEP" value={selectedStudent.zipCode} />
                      </div>
                    </div>
                  )}

                  {/* Responsável */}
                  {(selectedStudent.guardianName || selectedStudent.guardianPhone) && (
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Phone size={14} className="text-[#1E3A5F] dark:text-blue-400" />
                        <p className="text-xs font-semibold text-[#1E3A5F] dark:text-blue-400 uppercase tracking-wider">Responsável / Contato de Urgência</p>
                      </div>
                      <div className="space-y-2.5">
                        <InfoRow label="Nome" value={selectedStudent.guardianName} />
                        <InfoRow label="Parentesco" value={selectedStudent.guardianRelation} />
                        <InfoRow label="Telefone" value={selectedStudent.guardianPhone} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-700 dark:text-gray-200 text-right">{value || '—'}</span>
    </div>
  );
}
